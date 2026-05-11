#!/usr/bin/env node

/**
 * Comprehensive test script for Student APIs
 * Tests:
 * - Student Dashboard API
 * - Student Fees Vouchers API
 * - Student Attendance API
 *
 * Usage: node test-student-apis.js
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ENV_ACCESS_TOKEN = process.env.ACCESS_TOKEN || "";

// Test data
let testContext = {
  accessToken: "",
  studentId: "",
  results: {
    passed: 0,
    failed: 0,
    tests: [],
  },
};

// ==================== UTILITIES ====================

function loadAuthTokensFromCookiesTxt() {
  const tokens = { accessToken: "", refreshToken: "" };

  try {
    const filePath = path.join(__dirname, "cookies.txt");
    if (!fs.existsSync(filePath)) return tokens;

    const content = fs.readFileSync(filePath, "utf8");

    // Try inline format: accessToken=value
    const inlineAccess = content.match(/accessToken=([^;\r\n]+)/i)?.[1]?.trim() || "";
    const inlineRefresh = content.match(/refreshToken=([^;\r\n]+)/i)?.[1]?.trim() || "";

    tokens.accessToken = inlineAccess;
    tokens.refreshToken = inlineRefresh;

    // Netscape cookie format fallback
    if (!tokens.accessToken || !tokens.refreshToken) {
      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && (!line.startsWith("#") || line.startsWith("#HttpOnly_")));

      for (const line of lines) {
        const parts = line.split("\t");
        if (parts.length < 7) continue;

        const name = parts[5];
        const value = parts[6] || "";

        if (name === "accessToken" && !tokens.accessToken) {
          tokens.accessToken = value.trim();
        }
        if (name === "refreshToken" && !tokens.refreshToken) {
          tokens.refreshToken = value.trim();
        }
      }
    }
  } catch {
    return { accessToken: "", refreshToken: "" };
  }

  return tokens;
}

async function requestJson(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(options.headers || {}),
      },
    });

    let body;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      body,
      headers: Object.fromEntries(response.headers),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: null,
      error: error.message,
    };
  }
}

function logTest(testName, passed, details = "") {
  const status = passed ? "✓ PASS" : "✗ FAIL";
  const message = `${status}: ${testName}`;
  console.log(message);
  if (details) console.log(`  ${details}`);

  testContext.results.tests.push({
    name: testName,
    passed,
    details,
  });

  if (passed) testContext.results.passed++;
  else testContext.results.failed++;
}

function formatResponse(data, maxLength = 200) {
  const str = JSON.stringify(data);
  return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
}

// ==================== TEST SUITES ====================

async function loginStudent() {
  const studentEmail = "adamjeec12@gmail.com";
  const studentPassword = "admin@c12";

  const loginRes = await requestJson(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      login: studentEmail,
      password: studentPassword,
    }),
  });

  if (!loginRes.ok || !loginRes.body?.accessToken) {
    throw new Error(
      `Login failed: ${loginRes.status} - ${JSON.stringify(loginRes.body)}`
    );
  }

  return loginRes.body.accessToken;
}

async function testAuthentication() {
  console.log("\n========== AUTHENTICATION ==========");

  try {
    // Try from cookies.txt
    const cookies = loadAuthTokensFromCookiesTxt();
    if (cookies.accessToken) {
      testContext.accessToken = cookies.accessToken;
      logTest("Loaded token from cookies.txt", true);
      return true;
    }

    if (ENV_ACCESS_TOKEN) {
      testContext.accessToken = ENV_ACCESS_TOKEN;
      logTest("Loaded token from ACCESS_TOKEN env", true);
      return true;
    }

    // Try to login
    console.log("No token found, attempting to login...");
    const token = await loginStudent();
    testContext.accessToken = token;
    logTest("Login successful and token obtained", true, "Student authenticated");
    return true;
  } catch (error) {
    logTest(
      "Authentication token availability",
      false,
      `Error: ${error.message}`
    );
    return false;
  }
}

async function testDashboardAPI() {
  console.log("\n========== STUDENT DASHBOARD API ==========");

  const headers = {
    Authorization: `Bearer ${testContext.accessToken}`,
  };

  // Test GET /api/student/dashboard (own dashboard)
  console.log("\n--- GET /api/student/dashboard ---");
  const dashboardRes = await requestJson(`${BASE_URL}/api/student/dashboard`, {
    method: "GET",
    headers,
  });

  logTest(
    "GET /api/student/dashboard (own dashboard)",
    dashboardRes.ok && dashboardRes.status === 200,
    dashboardRes.ok
      ? `Response: ${formatResponse(dashboardRes.body)}`
      : `Status: ${dashboardRes.status}, Error: ${dashboardRes.body?.error || dashboardRes.error}`
  );

  if (dashboardRes.ok && dashboardRes.body.data) {
    const { student, fees, attendance } = dashboardRes.body.data;

    logTest(
      "Dashboard contains student info",
      !!(student && student.id && student.first_name),
      `Student: ${student?.first_name} ${student?.last_name}`
    );

    logTest(
      "Dashboard contains fees overview",
      !!(fees && typeof fees.total_due !== "undefined"),
      `Total Due: ${fees?.total_due}, Remaining: ${fees?.total_remaining}`
    );

    logTest(
      "Dashboard contains attendance overview",
      !!(attendance && typeof attendance.present_days !== "undefined"),
      `Present: ${attendance?.present_days}/${attendance?.total_days_marked}, Percentage: ${attendance?.attendance_percentage}%`
    );

    if (student && student.id) {
      testContext.studentId = student.id;
    }
  }

  // Test with invalid student ID
  console.log("\n--- GET /api/student/dashboard?studentId=invalid (permission check) ---");
  const unauthorizedRes = await requestJson(
    `${BASE_URL}/api/student/dashboard?studentId=invalid`,
    {
      method: "GET",
      headers,
    }
  );

  logTest(
    "Dashboard rejects access to other student's data",
    unauthorizedRes.status === 403 || unauthorizedRes.status === 400,
    `Status: ${unauthorizedRes.status}`
  );
}

async function testFeesVouchersAPI() {
  console.log("\n========== STUDENT FEES VOUCHERS API ==========");

  const headers = {
    Authorization: `Bearer ${testContext.accessToken}`,
  };

  // Test GET /api/student/fees-vouchers (own vouchers)
  console.log("\n--- GET /api/student/fees-vouchers ---");
  const vouchersRes = await requestJson(`${BASE_URL}/api/student/fees-vouchers`, {
    method: "GET",
    headers,
  });

  logTest(
    "GET /api/student/fees-vouchers",
    vouchersRes.ok && vouchersRes.status === 200,
    vouchersRes.ok
      ? `Response: ${formatResponse(vouchersRes.body)}`
      : `Status: ${vouchersRes.status}, Error: ${vouchersRes.body?.error || vouchersRes.error}`
  );

  if (vouchersRes.ok && vouchersRes.body.data) {
    const { vouchers, pagination } = vouchersRes.body.data;

    logTest(
      "Fees vouchers list is array",
      Array.isArray(vouchers),
      `Count: ${vouchers?.length || 0}`
    );

    logTest(
      "Pagination data present",
      !!(pagination && typeof pagination.total !== "undefined"),
      `Total: ${pagination?.total}, Pages: ${pagination?.pages}`
    );

    if (vouchers && vouchers.length > 0) {
      const firstVoucher = vouchers[0];
      logTest(
        "Voucher contains required fields",
        !!(
          firstVoucher.id &&
          firstVoucher.voucher_no &&
          firstVoucher.status &&
          typeof firstVoucher.amount_due !== "undefined"
        ),
        `Voucher: ${firstVoucher.voucher_no}, Status: ${firstVoucher.status}, Amount: ${firstVoucher.amount_due}`
      );
    }
  }

  // Test with status filter
  console.log("\n--- GET /api/student/fees-vouchers?status=UNPAID ---");
  const unpaidRes = await requestJson(
    `${BASE_URL}/api/student/fees-vouchers?status=UNPAID`,
    {
      method: "GET",
      headers,
    }
  );

  logTest(
    "Fees vouchers with status filter",
    unpaidRes.ok && unpaidRes.status === 200,
    `UNPAID vouchers: ${unpaidRes.body?.data?.vouchers?.length || 0}`
  );

  // Test pagination
  console.log("\n--- GET /api/student/fees-vouchers?page=1&limit=5 ---");
  const paginatedRes = await requestJson(
    `${BASE_URL}/api/student/fees-vouchers?page=1&limit=5`,
    {
      method: "GET",
      headers,
    }
  );

  logTest(
    "Fees vouchers pagination",
    paginatedRes.ok && paginatedRes.status === 200,
    `Page: ${paginatedRes.body?.data?.pagination?.page}, Limit: ${paginatedRes.body?.data?.pagination?.limit}`
  );

  // Test permission denied for other student
  console.log("\n--- GET /api/student/fees-vouchers?studentId=invalid (permission check) ---");
  const unauthorizedVRes = await requestJson(
    `${BASE_URL}/api/student/fees-vouchers?studentId=invalid`,
    {
      method: "GET",
      headers,
    }
  );

  logTest(
    "Fees vouchers rejects access to other student's data",
    unauthorizedVRes.status === 403 || unauthorizedVRes.status === 400,
    `Status: ${unauthorizedVRes.status}`
  );
}

async function testAttendanceAPI() {
  console.log("\n========== STUDENT ATTENDANCE API ==========");

  const headers = {
    Authorization: `Bearer ${testContext.accessToken}`,
  };

  // Test GET /api/student/attendance (own attendance)
  console.log("\n--- GET /api/student/attendance ---");
  const attendanceRes = await requestJson(`${BASE_URL}/api/student/attendance`, {
    method: "GET",
    headers,
  });

  logTest(
    "GET /api/student/attendance",
    attendanceRes.ok && attendanceRes.status === 200,
    attendanceRes.ok
      ? `Response: ${formatResponse(attendanceRes.body)}`
      : `Status: ${attendanceRes.status}, Error: ${attendanceRes.body?.message || attendanceRes.error}`
  );

  if (attendanceRes.ok && attendanceRes.body.data) {
    const { attendances, summary, pagination } = attendanceRes.body.data;

    logTest(
      "Attendance records is array",
      Array.isArray(attendances),
      `Count: ${attendances?.length || 0}`
    );

    logTest(
      "Attendance summary present",
      !!(summary && typeof summary.total_records !== "undefined"),
      `Total: ${summary?.total_records}, Present: ${summary?.present}, Absent: ${summary?.absent}`
    );

    logTest(
      "Attendance percentage calculated",
      !!(summary && typeof summary.attendance_percentage !== "undefined"),
      `Percentage: ${summary?.attendance_percentage}%`
    );

    if (attendances && attendances.length > 0) {
      const firstAtt = attendances[0];
      logTest(
        "Attendance record contains required fields",
        !!(firstAtt.id && firstAtt.date && firstAtt.status),
        `Date: ${firstAtt.date}, Status: ${firstAtt.status}`
      );
    }
  }

  // Test with date range filter
  console.log("\n--- GET /api/student/attendance?dateFrom=2026-04-01&dateTo=2026-05-15 ---");
  const rangeRes = await requestJson(
    `${BASE_URL}/api/student/attendance?dateFrom=2026-04-01&dateTo=2026-05-15`,
    {
      method: "GET",
      headers,
    }
  );

  logTest(
    "Attendance with date range filter",
    rangeRes.ok && rangeRes.status === 200,
    `Records in range: ${rangeRes.body?.data?.attendances?.length || 0}`
  );

  // Test with status filter
  console.log("\n--- GET /api/student/attendance?status=PRESENT ---");
  const statusRes = await requestJson(
    `${BASE_URL}/api/student/attendance?status=PRESENT`,
    {
      method: "GET",
      headers,
    }
  );

  logTest(
    "Attendance with status filter",
    statusRes.ok && statusRes.status === 200,
    `Present records: ${statusRes.body?.data?.attendances?.length || 0}`
  );

  // Test pagination
  console.log("\n--- GET /api/student/attendance?page=1&limit=10 ---");
  const pagRes = await requestJson(
    `${BASE_URL}/api/student/attendance?page=1&limit=10`,
    {
      method: "GET",
      headers,
    }
  );

  logTest(
    "Attendance pagination",
    pagRes.ok && pagRes.status === 200,
    `Page: ${pagRes.body?.data?.pagination?.page}, Total: ${pagRes.body?.data?.pagination?.total}`
  );

  // Test permission denied for other student
  console.log("\n--- GET /api/student/attendance?studentId=invalid (permission check) ---");
  const unauthorizedARes = await requestJson(
    `${BASE_URL}/api/student/attendance?studentId=invalid`,
    {
      method: "GET",
      headers,
    }
  );

  logTest(
    "Attendance rejects access to other student's data",
    unauthorizedARes.status === 403 || unauthorizedARes.status === 400,
    `Status: ${unauthorizedARes.status}`
  );
}

// ==================== MAIN EXECUTION ====================

async function runAllTests() {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║   STUDENT APIs - Comprehensive Test Suite   ║");
  console.log("╚════════════════════════════════════════════╝");
  console.log(`Base URL: ${BASE_URL}`);

  try {
    // Step 1: Authentication
    const authOk = await testAuthentication();
    if (!authOk) {
      console.log("\n✗ Cannot proceed without authentication token");
      process.exit(1);
    }

    // Step 2: Test all three APIs
    await testDashboardAPI();
    await testFeesVouchersAPI();
    await testAttendanceAPI();

    // Print summary
    console.log("\n╔════════════════════════════════════════════╗");
    console.log("║             TEST SUMMARY                   ║");
    console.log("╚════════════════════════════════════════════╝");
    console.log(`✓ Passed: ${testContext.results.passed}`);
    console.log(`✗ Failed: ${testContext.results.failed}`);
    console.log(`Total: ${testContext.results.passed + testContext.results.failed}`);

    if (testContext.results.failed === 0) {
      console.log("\n🎉 All tests passed!");
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${testContext.results.failed} test(s) failed`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

runAllTests();
