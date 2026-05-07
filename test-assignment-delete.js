/**
 * Assignment Delete API Test Script
 *
 * This script tests the complete teacher assignment deletion flow:
 * 1. Teacher login authentication
 * 2. Fetch assignments to find a target assignment ID
 * 3. Delete the assignment
 * 4. Verify deletion
 *
 * Usage:
 *   npm run test:assignment:delete
 *
 * Environment variables (.env):
 *   NEXT_PUBLIC_API_URL    - API base URL (default: http://localhost:3000)
 *   TEACHER_EMAIL          - Teacher's email/registration number
 *   TEACHER_PASSWORD       - Teacher's password
 *   ASSIGNMENT_ID          - Optional: specific assignment ID to delete (otherwise first found assignment)
 */

import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const TEACHER_EMAIL = process.env.TEACHER_EMAIL || "";
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || "";
const ASSIGNMENT_ID = process.env.ASSIGNMENT_ID || "";

class TestResult {
  constructor() {
    this.totalTests = 0;
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  addTest(name, passed, message = "") {
    this.totalTests++;
    if (passed) this.passed++;
    else this.failed++;

    const status = passed ? "✅ PASS" : "❌ FAIL";
    this.results.push({ name, passed, message });
    console.log(`${status} - ${name}${message ? `: ${message}` : ""}`);
  }

  summary() {
    console.log("\n" + "═".repeat(60));
    console.log("TEST SUMMARY");
    console.log("═".repeat(60));
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / this.totalTests) * 100).toFixed(1)}%`);
    console.log("═".repeat(60));
    return this.failed === 0;
  }
}

class AssignmentDeleteTest {
  constructor() {
    this.accessToken = null;
    this.user = null;
    this.testResult = new TestResult();
  }

  async request(method, endpoint, body = null, headers = {}) {
    const options = {
      method,
      headers: {
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    return { response, data };
  }

  testLogin() {
    console.log("\n" + "─".repeat(50));
    console.log("TEST 1: Teacher Login");
    console.log("─".repeat(50));

    if (!TEACHER_EMAIL || !TEACHER_PASSWORD) {
      this.testResult.addTest("Validate environment variables", false, "TEACHER_EMAIL and TEACHER_PASSWORD required");
      return false;
    }

    this.testResult.addTest("Validate environment variables", true);
    return true;
  }

  async login() {
    const { response, data } = await this.request("POST", "/api/auth/login", {
      login: TEACHER_EMAIL,
      password: TEACHER_PASSWORD,
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${data.error || "Unknown error"} (Status: ${response.status})`);
    }

    this.accessToken = data.accessToken;
    this.user = data.user;

    this.testResult.addTest(
      "Teacher login returns access token",
      !!this.accessToken,
      `User: ${this.user?.first_name} ${this.user?.last_name}, Role: ${this.user?.role}`
    );

    return data;
  }

  async listAssignments(teacherId = null) {
    console.log("\n" + "─".repeat(50));
    console.log("TEST 2: List Assignments");
    console.log("─".repeat(50));

    let url = "/api/assignments";
    if (teacherId) {
      url += `?teacher_id=${teacherId}`;
    }

    const { response, data } = await this.request("GET", url);

    if (!response.ok) {
      throw new Error(`Failed to fetch assignments: ${data.error || "Unknown error"}`);
    }

    const assignments = data.data || data.assignments || [];
    this.testResult.addTest(
      "Fetch assignments list (GET /api/assignments)",
      response.ok,
      `Found ${assignments.length} assignment(s)`
    );

    if (assignments.length > 0) {
      console.log("\n📋 Assignments found:");
      assignments.forEach((a, idx) => {
        console.log(`  ${idx + 1}. ${a.title} (ID: ${a.id})`);
        console.log(`     Class: ${a.class?.name || "N/A"}, Subject: ${a.subject?.name || "N/A"}, Due: ${a.due_date}`);
      });
    }

    return assignments;
  }

  validateAssignmentSelection(assignments, assignmentId) {
    console.log("\n" + "─".repeat(50));
    console.log("TEST 3: Assignment Selection Validation");
    console.log("─".repeat(50));

    if (assignments.length === 0) {
      this.testResult.addTest("Assignments available for deletion", false, "No assignments found for this teacher");
      return false;
    }

    this.testResult.addTest("Assignments available for deletion", true, `${assignments.length} assignment(s) found`);

    const target = assignmentId || assignments[0].id;
    const selected = assignmentId
      ? assignments.find(a => a.id === assignmentId)
      : assignments[0];

    if (selected) {
      console.log(`✅ Selected assignment: "${selected.title}" (ID: ${target})`);
      this.testResult.addTest("Selected valid assignment", true, selected.title);
      return true;
    } else {
      this.testResult.addTest("Selected valid assignment", false, `Assignment ID ${target} not found in teacher's assignments`);
      return false;
    }
  }

  async deleteAssignment(assignmentId) {
    console.log("\n" + "─".repeat(50));
    console.log("TEST 4: Delete Assignment");
    console.log("─".repeat(50));

    const { response, data } = await this.request("DELETE", `/api/assignments/${assignmentId}`);

    if (!response.ok) {
      const errorMsg = data.error || "Unknown error";
      this.testResult.addTest("Delete assignment (DELETE /api/assignments/:id)", false, `${errorMsg} (Status: ${response.status})`);
      throw new Error(`Delete failed: ${errorMsg}`);
    }

    this.testResult.addTest(
      "Delete assignment (DELETE /api/assignments/:id)",
      true,
      `Assignment ${assignmentId} deleted successfully`
    );

    return data;
  }

  async verifyDeletion(assignmentId) {
    console.log("\n" + "─".repeat(50));
    console.log("TEST 5: Verify Deletion");
    console.log("─".repeat(50));

    const { response } = await this.request("GET", `/api/assignments/${assignmentId}`);

    const deleted = response.status === 404;
    this.testResult.addTest("Assignment no longer exists (404)", deleted);

    if (!deleted) {
      console.log(`⚠️ Assignment still accessible (Status: ${response.status})`);
    } else {
      console.log(`✅ Assignment confirmed deleted`);
    }

    return deleted;
  }

  async run() {
    console.log("═".repeat(60));
    console.log("ASSIGNMENT DELETE API TEST SUITE");
    console.log("═".repeat(60));

    // Validate env vars first
    if (!this.testLogin()) {
      console.error("\n❌ Cannot proceed: Missing required environment variables.");
      console.log("Set TEACHER_EMAIL and TEACHER_PASSWORD in your .env file.");
      process.exit(1);
    }

    try {
      // Login
      await this.login();

      // Fetch assignments
      const assignments = await this.listAssignments(this.user.id);

      // Validate we have an assignment to delete
      if (!this.validateAssignmentSelection(assignments, ASSIGNMENT_ID)) {
        console.log("\nℹ️ No assignments available for deletion. Exiting.");
        const success = this.testResult.summary();
        process.exit(success ? 0 : 1);
      }

      const targetId = ASSIGNMENT_ID || assignments[0].id;

      // Delete
      await this.deleteAssignment(targetId);

      // Verify
      await this.verifyDeletion(targetId);

      // Summary
      const success = this.testResult.summary();
      process.exit(success ? 0 : 1);

    } catch (error) {
      console.error("\n❌ Unexpected error:", error.message);
      const success = this.testResult.summary();
      process.exit(1);
    }
  }
}

// Run
const test = new AssignmentDeleteTest();
test.run();
