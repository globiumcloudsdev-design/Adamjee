#!/usr/bin/env node

/**
 * Comprehensive Student Dashboard API Test Suite
 * 
 * Tests all student-related APIs:
 * - Profile (with dashboard data)
 * - Dashboard summary
 * - Fees/Vouchers
 * - Attendance
 * - Assignments
 * - Submissions
 * - Timetable
 * 
 * Usage: node test-student-dashboard.js
 * 
 * Credentials:
 * - Email: nomanirshad0324@gmail.com
 * - Password: 12345678
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const STUDENT_EMAIL = "nomanirshad0324@gmail.com";
const STUDENT_PASSWORD = "12345678";

// Test results tracker
let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

// ==================== UTILITIES ====================

function log(message, type = "info") {
  const colors = {
    info: "\x1b[36m",    // Cyan
    success: "\x1b[32m",  // Green
    error: "\x1b[31m",    // Red
    warning: "\x1b[33m",  // Yellow
    reset: "\x1b[0m",
    bold: "\x1b[1m",
  };

  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${"=".repeat(60)}`, "bold");
  log(title, "bold");
  log(`${"=".repeat(60)}`, "bold");
}

function testStart(testName) {
  log(`\n▶ ${testName}...`, "info");
}

function testPass(testName, data = null) {
  log(`✓ ${testName}`, "success");
  testResults.passed += 1;
  testResults.tests.push({ name: testName, status: "PASS", data });
  if (data) {
    log(JSON.stringify(data, null, 2), "success");
  }
}

function testFail(testName, error) {
  log(`✗ ${testName}`, "error");
  log(`  Error: ${error}`, "error");
  testResults.failed += 1;
  testResults.tests.push({ name: testName, status: "FAIL", error });
}

async function request(method, path, body = null, token = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return { status: response.status, data };
}

// ==================== AUTH ====================

async function login() {
  testStart("Login Student");
  try {
    const response = await request(
      "POST",
      "/api/auth/login",
      { login: STUDENT_EMAIL, password: STUDENT_PASSWORD }
    );

    if (response.status === 200 && response.data?.accessToken) {
      testPass("Login Student", {
        user: response.data.user?.first_name + " " + response.data.user?.last_name,
        role: response.data.user?.role,
        email: response.data.user?.email,
      });
      return response.data.accessToken;
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("Login Student", error.message);
    process.exit(1);
  }
}

// ==================== PROFILE API ====================

async function testStudentProfile(token) {
  section("STUDENT PROFILE API");

  testStart("GET /api/student/profile");
  try {
    const response = await request("GET", "/api/student/profile", null, token);

    if (response.status === 200 && response.data?.success) {
      const profile = response.data.user;
      const dashboard = response.data.dashboard;

      testPass("GET /api/student/profile", {
        profile: {
          id: profile?.id,
          name: `${profile?.first_name} ${profile?.last_name}`,
          email: profile?.email,
          phone: profile?.phone,
          registration_no: profile?.registration_no,
          branch: profile?.branch?.name,
          academic_info: profile?.academic_info,
        },
        dashboard: {
          fees: dashboard?.fees,
          attendance: dashboard?.attendance,
          assignments: dashboard?.assignments,
        },
      });
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("GET /api/student/profile", error.message);
  }
}

// ==================== DASHBOARD API ====================

async function testDashboard(token) {
  section("DASHBOARD API");

  testStart("GET /api/student/dashboard");
  try {
    const response = await request("GET", "/api/student/dashboard", null, token);

    if (response.status === 200) {
      const data = response.data;
      testPass("GET /api/student/dashboard", {
        student: {
          id: data?.student?.id,
          name: data?.student?.first_name,
        },
        fees: data?.fees,
        attendance: {
          percentage: data?.attendance?.percentage + "%",
          present_days: data?.attendance?.present_days,
          absent_days: data?.attendance?.absent_days,
          leave_days: data?.attendance?.leave_days,
        },
        assignments_pending: data?.pending_assignments,
        exams_upcoming: data?.upcoming_exams,
      });
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("GET /api/student/dashboard", error.message);
  }
}

// ==================== FEES/VOUCHERS API ====================

async function testFeesVouchers(token) {
  section("FEES & VOUCHERS API");

  testStart("GET /api/student/fees-vouchers (page 1)");
  try {
    const response = await request(
      "GET",
      "/api/student/fees-vouchers?page=1&limit=10",
      null,
      token
    );

    if (response.status === 200 && response.data?.data) {
      const vouchers = response.data.data;
      const pagination = response.data.pagination;

      testPass("GET /api/student/fees-vouchers", {
        total_vouchers: pagination?.total,
        pages: pagination?.pages,
        showing: vouchers.length,
        first_voucher: vouchers[0] ? {
          voucher_no: vouchers[0].voucher_no,
          fee_type: vouchers[0].fee_type,
          amount_due: vouchers[0].amount_due,
          paid_amount: vouchers[0].paid_amount,
          remaining_amount: vouchers[0].remaining_amount,
          status: vouchers[0].status,
          due_date: vouchers[0].due_date,
        } : null,
      });
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("GET /api/student/fees-vouchers", error.message);
  }

  // Test filter by status
  testStart("GET /api/student/fees-vouchers?status=UNPAID");
  try {
    const response = await request(
      "GET",
      "/api/student/fees-vouchers?status=UNPAID&page=1&limit=5",
      null,
      token
    );

    if (response.status === 200) {
      const vouchers = response.data.data;
      testPass("GET /api/student/fees-vouchers (UNPAID filter)", {
        total_unpaid: response.data.pagination?.total,
        shown: vouchers.length,
      });
    } else {
      throw new Error(`Status: ${response.status}`);
    }
  } catch (error) {
    testFail("GET /api/student/fees-vouchers (UNPAID filter)", error.message);
  }
}

// ==================== ATTENDANCE API ====================

async function testAttendance(token) {
  section("ATTENDANCE API");

  testStart("GET /api/student/attendance");
  try {
    const response = await request("GET", "/api/student/attendance", null, token);

    if (response.status === 200 && response.data?.data) {
      const records = response.data.data;
      testPass("GET /api/student/attendance", {
        total_records: records.length,
        summary: response.data.summary,
        first_record: records[0] ? {
          date: records[0].date,
          status: records[0].status,
          class: records[0].class,
          section: records[0].section,
        } : null,
      });
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("GET /api/student/attendance", error.message);
  }

  // Test with filters
  testStart("GET /api/student/attendance?status=PRESENT&filter=monthly");
  try {
    const response = await request(
      "GET",
      "/api/student/attendance?status=PRESENT&filter=monthly",
      null,
      token
    );

    if (response.status === 200) {
      testPass("GET /api/student/attendance (filtered)", {
        records: response.data.data?.length || 0,
      });
    } else {
      throw new Error(`Status: ${response.status}`);
    }
  } catch (error) {
    testFail("GET /api/student/attendance (filtered)", error.message);
  }
}

// ==================== ASSIGNMENTS API ====================

async function testAssignments(token) {
  section("ASSIGNMENTS API");

  testStart("GET /api/student/assignments");
  try {
    const response = await request(
      "GET",
      "/api/student/assignments?page=1&limit=10",
      null,
      token
    );

    if (response.status === 200 && response.data?.data) {
      const assignments = response.data.data;
      const pagination = response.data.data.pagination || response.data.pagination;

      testPass("GET /api/student/assignments", {
        total: pagination?.total || assignments.length,
        shown: assignments.length,
        first_assignment: assignments[0] ? {
          id: assignments[0].id,
          title: assignments[0].title,
          subject: assignments[0].subject?.name,
          due_date: assignments[0].due_date,
          status: assignments[0].status,
        } : null,
      });
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("GET /api/student/assignments", error.message);
  }
}

// ==================== SUBMISSIONS API ====================

async function testSubmissions(token) {
  section("SUBMISSIONS API");

  testStart("GET /api/student/submissions");
  try {
    const response = await request("GET", "/api/student/submissions", null, token);

    if (response.status === 200 && response.data?.data) {
      const submissions = response.data.data;
      testPass("GET /api/student/submissions", {
        total_submissions: submissions.length,
        first_submission: submissions[0] ? {
          assignment: submissions[0].assignment?.title,
          status: submissions[0].status,
          submitted_at: submissions[0].submitted_at,
        } : null,
      });
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("GET /api/student/submissions", error.message);
  }
}

// ==================== TIMETABLE API ====================

async function testTimetable(token) {
  section("TIMETABLE API");

  testStart("GET /api/student/timetable");
  try {
    const response = await request("GET", "/api/student/timetable", null, token);

    if (response.status === 200 && response.data?.data) {
      const timetable = response.data.data;
      testPass("GET /api/student/timetable", {
        total_entries: timetable.length,
        days_covered: [...new Set(timetable.map((t) => t.day))],
        first_entry: timetable[0] ? {
          day: timetable[0].day,
          time: timetable[0].time_slot,
          subject: timetable[0].subject?.name,
          teacher: timetable[0].teacher?.first_name,
        } : null,
      });
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("GET /api/student/timetable", error.message);
  }
}

// ==================== EXAMS API ====================

async function testExams(token) {
  section("EXAMS API");

  testStart("GET /api/student/schedule/exams");
  try {
    const response = await request(
      "GET",
      "/api/student/schedule/exams",
      null,
      token
    );

    if (response.status === 200) {
      const exams = response.data.data || [];
      testPass("GET /api/student/schedule/exams", {
        total_exams: exams.length,
        first_exam: exams[0] ? {
          title: exams[0].title,
          date: exams[0].exam_date,
          status: exams[0].status,
        } : null,
      });
    } else {
      throw new Error(`Status: ${response.status}`);
    }
  } catch (error) {
    testFail("GET /api/student/schedule/exams", error.message);
  }
}

// ==================== SUMMARY ====================

function printSummary() {
  section("TEST SUMMARY");

  const total = testResults.passed + testResults.failed;
  const percentage = total > 0 ? ((testResults.passed / total) * 100).toFixed(2) : 0;

  log(`Total Tests: ${total}`, "info");
  log(`Passed: ${testResults.passed}`, "success");
  log(`Failed: ${testResults.failed}`, "error");
  log(`Success Rate: ${percentage}%`, percentage >= 80 ? "success" : "warning");

  if (testResults.failed > 0) {
    log("\n❌ Failed Tests:", "error");
    testResults.tests
      .filter((t) => t.status === "FAIL")
      .forEach((t) => {
        log(`  - ${t.name}: ${t.error}`, "error");
      });
  }

  section("DETAILED RESULTS");
  log(JSON.stringify(testResults.tests, null, 2));
}

// ==================== MAIN ====================

async function main() {
  log("🚀 Starting Student Dashboard API Tests", "bold");
  log(`Base URL: ${BASE_URL}`, "info");
  log(`Student: ${STUDENT_EMAIL}`, "info");

  try {
    const token = await login();
    
    if (!token) {
      log("Failed to get auth token", "error");
      process.exit(1);
    }

    // Run all tests
    await testStudentProfile(token);
    await testDashboard(token);
    await testFeesVouchers(token);
    await testAttendance(token);
    await testAssignments(token);
    await testSubmissions(token);
    await testTimetable(token);
    await testExams(token);

    printSummary();

    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`Fatal error: ${error.message}`, "error");
    process.exit(1);
  }
}

main();
