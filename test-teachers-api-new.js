#!/usr/bin/env node

/**
 * Teacher API Test Suite (NEW)
 * Focus: teacher endpoints + exam marks write/read
 *
 * How to run:
 *   node test-teachers-api-new.js
 *
 * Old-credentials support:
 *   By default it uses the hardcoded values from existing scripts.
 *   You can override via env vars:
 *     BASE_URL
 *     TEACHER_EMAIL
 *     TEACHER_PASSWORD
 *
 * Exam marks (POST) inputs are required. Provide via env vars:
 *   TEACHER_EXAM_ID
 *   TEACHER_MARKS_STUDENT_ID
 *   TEACHER_MARKS_SUBJECT_ID
 * Optional:
 *   TEACHER_MARKS_MARKS_OBTAINED (default: 90)
 *   TEACHER_MARKS_IS_ABSENT (default: false)
 *   TEACHER_MARKS_REMARKS (default: "Test marks via script")
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Defaults preserved from existing scripts
const TEACHER_EMAIL = process.env.TEACHER_EMAIL || "shoaibrazamemon@gmail.com";
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || "12345678";

// Required for exam marks POST
const TEACHER_EXAM_ID = process.env.TEACHER_EXAM_ID;
const TEACHER_MARKS_STUDENT_ID = process.env.TEACHER_MARKS_STUDENT_ID;
const TEACHER_MARKS_SUBJECT_ID = process.env.TEACHER_MARKS_SUBJECT_ID;

const TEACHER_MARKS_MARKS_OBTAINED =
  process.env.TEACHER_MARKS_MARKS_OBTAINED !== undefined
    ? Number(process.env.TEACHER_MARKS_MARKS_OBTAINED)
    : 90;
const TEACHER_MARKS_IS_ABSENT =
  process.env.TEACHER_MARKS_IS_ABSENT === "true" ||
  process.env.TEACHER_MARKS_IS_ABSENT === true;
const TEACHER_MARKS_REMARKS = process.env.TEACHER_MARKS_REMARKS || "Test marks via script";

let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
  meta: {
    baseUrl: BASE_URL,
    teacherEmail: TEACHER_EMAIL,
    endpointsTested: [],
    timestamp: new Date().toISOString(),
  },
};

function log(message, type = "info") {
  const colors = {
    info: "\x1b[36m", // Cyan
    success: "\x1b[32m", // Green
    error: "\x1b[31m", // Red
    warning: "\x1b[33m", // Yellow
    reset: "\x1b[0m",
    bold: "\x1b[1m",
  };

  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${"=".repeat(70)}`, "bold");
  log(title, "bold");
  log(`${"=".repeat(70)}`, "bold");
}

function testStart(testName) {
  log(`\n▶ ${testName}...`, "info");
}

function testPass(testName, data = null, endpoint = null) {
  log(`✔ ${testName}`, "success");
  testResults.passed += 1;
  testResults.tests.push({ name: testName, status: "PASS", data });
  if (endpoint) {
    testResults.meta.endpointsTested.push(endpoint);
  }
}

function testFail(testName, error, endpoint = null) {
  log(`✖ ${testName}`, "error");
  log(`  Error: ${error}`, "error");
  testResults.failed += 1;
  testResults.tests.push({ name: testName, status: "FAIL", error });
  if (endpoint) {
    testResults.meta.endpointsTested.push(endpoint);
  }
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

async function login() {
  testStart("Login Teacher");
  try {
    const response = await request("POST", "/api/auth/login", {
      login: TEACHER_EMAIL,
      password: TEACHER_PASSWORD,
    });

    if (response.status === 200 && response.data?.accessToken) {
      testPass("Login Teacher", {
        user: response.data.user?.first_name + " " + response.data.user?.last_name,
        role: response.data.user?.role,
        email: response.data.user?.email,
        branch: response.data.user?.branch?.name,
      });
      return response.data.accessToken;
    }

    throw new Error(`Status: ${response.status}, ${response.data?.error || response.data?.message || "No error field"}`);
  } catch (e) {
    testFail("Login Teacher", e.message);
    process.exit(1);
  }
}

async function testTeacherProfile(token) {
  section("TEACHER PROFILE");

  testStart("GET /api/teacher/profile");
  try {
    const response = await request("GET", "/api/teacher/profile", null, token);

    // Some environments may have a model mismatch causing 500.
    // If that happens, still try to continue tests using a best-effort teacherId.
    if (response.status === 200 && response.data?.success) {
      const profile = response.data.data;
      testPass(
        "GET /api/teacher/profile",
        {
          id: profile?.id,
          full_name: profile?.full_name,
          email: profile?.email,
          phone: profile?.phone,
          branch: profile?.branch?.name,
          status: profile?.status,
        },
        "/api/teacher/profile"
      );
      return profile;
    }

    throw new Error(
      `Status: ${response.status}, ${response.data?.error || response.data?.message || "Unknown response"}`
    );
  } catch (e) {
    // Attempt to extract teacherId from JWT payload without requiring profile endpoint.
    // This prevents timetable test from failing when profile endpoint has server-side issues.
    let decodedId = null;
    try {
      const jwt = token;
      const parts = jwt.split(".");
      if (parts.length >= 2) {
        const payload = parts[1];
        const json = Buffer.from(payload, "base64").toString("utf8");
        const obj = JSON.parse(json);
        decodedId = obj?.userId || obj?.id || obj?.sub || null;
      }
    } catch {
      // ignore decode errors
    }

    testFail("GET /api/teacher/profile", e.message, "/api/teacher/profile");

    if (decodedId) {
      log(`Using decoded teacherId=${decodedId} for timetable test due to profile GET failure.`, "warning");
      return { id: decodedId };
    }

    return null;
  }

}

async function testTeacherProfileUpdate(token) {
  section("TEACHER PROFILE UPDATE");

  testStart("PUT /api/teacher/profile (safe no-op-ish update)");
  try {
    // Safe update: only send bio if provided; otherwise attempt small bio stamp.
    const stamp = `Auto-test bio @ ${new Date().toISOString()}`;

    const response = await request(
      "PUT",
      "/api/teacher/profile",
      {
        bio: stamp,
      },
      token
    );

    if (response.status === 200 && response.data?.success) {
      testPass(
        "PUT /api/teacher/profile",
        {
          message: response.data.message,
          data: {
            id: response.data.data?.id,
            bio: response.data.data?.bio,
          },
        },
        "/api/teacher/profile"
      );
      return true;
    }

    throw new Error(`Status: ${response.status}, ${response.data?.error || response.data?.message}`);
  } catch (e) {
    testFail("PUT /api/teacher/profile", e.message, "/api/teacher/profile");
    return false;
  }
}

async function testTeacherTimetable(token, teacherId) {
  section("TEACHER TIMETABLE");

  testStart("GET /api/timetable/teacher/:teacherId");
  try {
    if (!teacherId) throw new Error("Missing teacherId from profile");

    const url = `/api/timetable/teacher/${teacherId}?class_id=&section_id=`;
    const response = await request("GET", url, null, token);

    if (response.status === 200 && response.data?.success) {
      const data = response.data.data || [];
      testPass(
        "GET /api/timetable/teacher/:teacherId",
        {
          total: data.length,
          sample: data[0]
            ? {
                class: data[0].class_name,
                section: data[0].section_name,
                periods_assigned: data[0].total_periods_assigned,
                periods_sample: data[0].periods?.slice(0, 2),
              }
            : null,
        },
        `/api/timetable/teacher/${teacherId}`
      );
      return true;
    }

    throw new Error(`Status: ${response.status}, ${response.data?.error || response.data?.message}`);
  } catch (e) {
    testFail("GET /api/timetable/teacher/:teacherId", e.message, "/api/timetable/teacher/:teacherId");
    return false;
  }
}

async function testTeacherExamsMarksGet(token, examId, studentId) {
  section("EXAM MARKS READ");

  testStart("GET /api/exams/:id/marks?student_id=");
  try {
    if (!examId) throw new Error("Missing TEACHER_EXAM_ID");
    if (!studentId) throw new Error("Missing TEACHER_MARKS_STUDENT_ID");

    const url = `/api/exams/${examId}/marks?student_id=${encodeURIComponent(studentId)}`;
    const response = await request("GET", url, null, token);

    if (response.status === 200 && response.data?.success) {
      const marks = response.data.data || [];
      testPass(
        "GET /api/exams/:id/marks",
        {
          marks_count: marks.length,
          sample: marks[0] || null,
        },
        url
      );
      return marks;
    }

    throw new Error(`Status: ${response.status}, ${response.data?.error || response.data?.message}`);
  } catch (e) {
    testFail("GET /api/exams/:id/marks", e.message, "/api/exams/:id/marks");
    return null;
  }
}

async function testTeacherExamsMarksPost(token, examId, studentId, subjectId) {
  section("EXAM MARKS WRITE");

  testStart("POST /api/exams/:id/marks (upsert)");
  try {
    if (!examId) throw new Error("Missing TEACHER_EXAM_ID");
    if (!studentId) throw new Error("Missing TEACHER_MARKS_STUDENT_ID");
    if (!subjectId) throw new Error("Missing TEACHER_MARKS_SUBJECT_ID");

    const payload = {
      marks: [
        {
          student_id: Number(studentId),
          subject_id: Number(subjectId),
          marks_obtained: TEACHER_MARKS_MARKS_OBTAINED,
          is_absent: TEACHER_MARKS_IS_ABSENT,
          remarks: TEACHER_MARKS_REMARKS,
        },
      ],
    };

    const url = `/api/exams/${examId}/marks`;
    const response = await request("POST", url, payload, token);

    if (response.status === 200 && response.data?.success) {
      testPass(
        "POST /api/exams/:id/marks",
        {
          message: response.data.message,
        },
        url
      );
      return true;
    }

    // Common expected failures: 403 branch mismatch, 404 exam not found
    throw new Error(`Status: ${response.status}, ${response.data?.error || response.data?.message || JSON.stringify(response.data)}`);
  } catch (e) {
    testFail("POST /api/exams/:id/marks", e.message, "/api/exams/:id/marks");
    return false;
  }
}

function printSummary() {
  section("TEST SUMMARY");

  const total = testResults.passed + testResults.failed;
  const passPercentage = total > 0 ? ((testResults.passed / total) * 100).toFixed(2) : 0;

  log(`Total Tests: ${total}`, "info");
  log(`Passed: ${testResults.passed}`, "success");
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? "error" : "success");
  log(`Pass Rate: ${passPercentage}%\n`, testResults.failed === 0 ? "success" : "warning");

  const resultsFile = path.join(__dirname, "test-results-teachers-new.json");
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  log(`Detailed results saved to: ${path.basename(resultsFile)}`, "info");

  if (testResults.failed > 0) process.exit(1);
  process.exit(0);
}

async function main() {
  log("TEACHER API TEST SUITE (NEW)", "bold");
  log(`Base URL: ${BASE_URL}`, "info");
  log(`Teacher: ${TEACHER_EMAIL}`, "info");

  const token = await login();

  const profile = await testTeacherProfile(token);

  await testTeacherProfileUpdate(token);

  await testTeacherTimetable(token, profile?.id);

  // Exam marks read/write are conditional if env vars not provided
  const hasExamConfig = Boolean(TEACHER_EXAM_ID && TEACHER_MARKS_STUDENT_ID && TEACHER_MARKS_SUBJECT_ID);

  if (!hasExamConfig) {
    log(
      "Skipping exam marks READ/WRITE because TEACHER_EXAM_ID / TEACHER_MARKS_STUDENT_ID / TEACHER_MARKS_SUBJECT_ID env vars are not set.",
      "warning"
    );
  } else {
    await testTeacherExamsMarksGet(token, TEACHER_EXAM_ID, TEACHER_MARKS_STUDENT_ID);
    await testTeacherExamsMarksPost(token, TEACHER_EXAM_ID, TEACHER_MARKS_STUDENT_ID, TEACHER_MARKS_SUBJECT_ID);
    await testTeacherExamsMarksGet(token, TEACHER_EXAM_ID, TEACHER_MARKS_STUDENT_ID);
  }

  printSummary();
}

main().catch((error) => {
  log(`Unexpected error: ${error.message}`, "error");
  process.exit(1);
});

