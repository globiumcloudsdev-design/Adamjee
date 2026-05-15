#!/usr/bin/env node

/**
 * Comprehensive Teacher Dashboard API Test Suite
 * 
 * Tests all teacher-related APIs:
 * - Login
 * - Dashboard
 * - My Classes
 * - Timetable
 * - Exams
 * 
 * Usage: node test-teachers-api.js
 * 
 * Credentials:
 * - Email: shoaibrazamemon@gmail.com
 * - Password: 12345678
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TEACHER_EMAIL = "shoaibrazamemon@gmail.com";
const TEACHER_PASSWORD = "12345678";

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
  testStart("Login Teacher");
  try {
    const response = await request(
      "POST",
      "/api/auth/login",
      { login: TEACHER_EMAIL, password: TEACHER_PASSWORD }
    );

    if (response.status === 200 && response.data?.accessToken) {
      testPass("Login Teacher", {
        user: response.data.user?.first_name + " " + response.data.user?.last_name,
        role: response.data.user?.role,
        email: response.data.user?.email,
        branch: response.data.user?.branch?.name,
      });
      return response.data.accessToken;
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("Login Teacher", error.message);
    process.exit(1);
  }
}

// ==================== TEACHER DASHBOARD API ====================

async function testTeacherDashboard(token) {
  section("TEACHER DASHBOARD API");

  testStart("GET /api/teacher/dashboard");
  try {
    const response = await request("GET", "/api/teacher/dashboard", null, token);

    if (response.status === 200 && response.data?.success) {
      const dashboardData = response.data.data;
      testPass("GET /api/teacher/dashboard", {
        stats: {
          classes: dashboardData?.stats?.classes,
          students: dashboardData?.stats?.students,
          attendance: dashboardData?.stats?.attendance,
          exams: dashboardData?.stats?.exams,
        },
        my_classes: {
          count: dashboardData?.myClasses?.length || 0,
          sample: dashboardData?.myClasses?.[0] ? {
            class_name: dashboardData?.myClasses[0].className,
            section_name: dashboardData?.myClasses[0].sectionName,
            subject: dashboardData?.myClasses[0].subject,
            group_name: dashboardData?.myClasses[0].groupName,
            student_count: dashboardData?.myClasses[0].studentCount,
          } : null,
        },
        branch: dashboardData?.branchInfo?.name,
        upcoming_exams: dashboardData?.upcomingExams?.length || 0,
      });
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("GET /api/teacher/dashboard", error.message);
  }
}

// ==================== TEACHER MY CLASSES API ====================

async function testTeacherMyClasses(token) {
  section("TEACHER MY CLASSES API");

  testStart("GET /api/teacher/my-classes");
  try {
    const response = await request("GET", "/api/teacher/my-classes", null, token);

    if (response.status === 200 && response.data?.success) {
      const classesData = response.data.data || [];
      testPass("GET /api/teacher/my-classes", {
        total_classes: classesData.length,
        classes: classesData.map(cls => ({
          class: cls.className,
          section: cls.sectionName,
          subject: cls.subject,
          group: cls.groupName,
          academic_year: cls.academicYear,
          student_count: cls.studentCount,
        })),
        sample_class: classesData[0] ? {
          class_name: classesData[0].className,
          section_name: classesData[0].sectionName,
          subject: classesData[0].subject,
          student_count: classesData[0].studentCount,
        } : null,
      });
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("GET /api/teacher/my-classes", error.message);
  }
}

// ==================== TEACHER EXAMS API ====================

async function testTeacherExams(token) {
  section("TEACHER EXAMS API");

  testStart("GET /api/teacher/exams");
  try {
    const response = await request("GET", "/api/teacher/exams", null, token);

    if (response.status === 200 && response.data?.success) {
      const examsData = response.data.exams || [];
      testPass("GET /api/teacher/exams", {
        total_exams: examsData.length,
        exams: examsData.map(exam => ({
          name: exam.name,
          status: exam.status,
          class: exam.class?.name,
          section: exam.section?.name,
          academic_year: exam.academicYear?.name,
          subjects_count: exam.subjects?.length || 0,
        })) || [],
        exam_statuses: {
          scheduled: examsData.filter(e => e.status === 'scheduled').length || 0,
          ongoing: examsData.filter(e => e.status === 'ongoing').length || 0,
          completed: examsData.filter(e => e.status === 'completed').length || 0,
        },
      });
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("GET /api/teacher/exams", error.message);
  }
}

// ==================== TEACHER TIMETABLE API ====================

async function testTeacherTimetable(token) {
  section("TEACHER TIMETABLE API");

  testStart("GET /api/teacher/timetable");
  try {
    const response = await request("GET", "/api/teacher/timetable", null, token);

    if (response.status === 200 && response.data?.success) {
      const timetableData = response.data.data || [];
      testPass("GET /api/teacher/timetable", {
        total_timetables: timetableData.length,
        timetables: timetableData.map(tt => ({
          day: tt.day,
          class: tt.class_name,
          section: tt.section_name,
          group: tt.group_name,
          academic_year: tt.academic_year_name,
          periods_assigned: tt.total_periods_assigned,
        })) || [],
        sample_timetable: timetableData[0] ? {
          day: timetableData[0].day,
          class_name: timetableData[0].class_name,
          section_name: timetableData[0].section_name,
          periods: timetableData[0].periods?.map(p => ({
            period_number: p.periodNumber,
            time: `${p.startTime} - ${p.endTime}`,
            subject: p.subjectName,
            room: p.roomNumber,
          })) || [],
        } : null,
      });
    } else {
      throw new Error(`Status: ${response.status}, ${response.data?.error}`);
    }
  } catch (error) {
    testFail("GET /api/teacher/timetable", error.message);
  }
}

// ==================== SUMMARY ====================

function printSummary() {
  section("TEST SUMMARY");
  
  const total = testResults.passed + testResults.failed;
  const passPercentage = ((testResults.passed / total) * 100).toFixed(2);

  log(`\nTotal Tests: ${total}`, "info");
  log(`Passed: ${testResults.passed}`, "success");
  log(`Failed: ${testResults.failed}`, "error");
  log(`Pass Rate: ${passPercentage}%\n`, testResults.failed === 0 ? "success" : "warning");

  if (testResults.failed > 0) {
    log("\nFailed Tests:", "error");
    testResults.tests
      .filter(t => t.status === "FAIL")
      .forEach(t => {
        log(`  • ${t.name}: ${t.error}`, "error");
      });
  }

  // Save results to file
  const resultsFile = path.join(__dirname, "test-results-teachers.json");
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  log(`\nDetailed results saved to: test-results-teachers.json`, "info");

  process.exit(testResults.failed === 0 ? 0 : 1);
}

// ==================== MAIN EXECUTION ====================

async function main() {
  log("Teacher API Test Suite", "bold");
  log(`Base URL: ${BASE_URL}`, "info");
  log(`Credentials: ${TEACHER_EMAIL}`, "info");

  // Login
  const token = await login();

  // Run all tests
  await testTeacherDashboard(token);
  await testTeacherMyClasses(token);
  await testTeacherExams(token);
  await testTeacherTimetable(token);

  // Print summary
  printSummary();
}

main().catch(error => {
  log(`\nUnexpected error: ${error.message}`, "error");
  process.exit(1);
});
