/**
 * Teacher Assignments Lister - Utility script
 *
 * Lists all assignments belonging to the logged-in teacher.
 * Useful for finding assignment IDs before running delete test.
 *
 * Usage:
 *   npm run test:assignments:list
 *
 * Environment variables:
 *   NEXT_PUBLIC_API_URL    - API base URL (default: http://localhost:3000)
 *   TEACHER_EMAIL          - Teacher's email/registration number
 *   TEACHER_PASSWORD       - Teacher's password
 */

import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const TEACHER_EMAIL = process.env.TEACHER_EMAIL || "";
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || "";

async function main() {
  console.log("═".repeat(60));
  console.log("TEACHER ASSIGNMENTS LISTER");
  console.log("═".repeat(60));

  // Validate credentials
  if (!TEACHER_EMAIL || !TEACHER_PASSWORD) {
    console.error("❌ Error: TEACHER_EMAIL and TEACHER_PASSWORD environment variables are required.");
    console.log("Create a .env file with these variables or set them in your shell.");
    process.exit(1);
  }

  try {
    // Step 1: Login
    console.log(`\n🔐 Logging in as: ${TEACHER_EMAIL}`);
    const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: TEACHER_EMAIL, password: TEACHER_PASSWORD }),
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginData.error} (Status: ${loginRes.status})`);
    }

    const { accessToken, user } = loginData;
    console.log(`✅ Logged in: ${user.first_name} ${user.last_name} (${user.role})`);

    // Step 2: Fetch assignments
    console.log("\n📋 Fetching teacher's assignments...");
    const assignRes = await fetch(`${API_BASE_URL}/api/assignments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const assignData = await assignRes.json();

    if (!assignRes.ok) {
      throw new Error(`Failed to fetch assignments: ${assignData.error} (Status: ${assignRes.status})`);
    }

    const assignments = assignData.data || assignData.assignments || [];

    if (assignments.length === 0) {
      console.log("ℹ️ No assignments found for this teacher.");
      process.exit(0);
    }

    console.log(`\n✅ Found ${assignments.length} assignment(s):\n`);

    assignments.forEach((a, idx) => {
      console.log(`${idx + 1}. ${a.title}`);
      console.log(`   ID: ${a.id}`);
      console.log(`   Subject: ${a.subject?.name || "N/A"} | Class: ${a.class?.name || "N/A"} | Section: ${a.section?.name || "N/A"}`);
      console.log(`   Due Date: ${a.due_date} | Total Marks: ${a.total_marks || 0} | Active: ${a.is_active}`);
      console.log(`   Created: ${new Date(a.created_at).toLocaleDateString()}`);
      console.log("");
    });

    console.log("═".repeat(60));
    console.log("Use ASSIGNMENT_ID environment variable to target a specific assignment for deletion.");
    console.log("Example: ASSIGNMENT_ID=<uuid> npm run test:assignment:delete");
    console.log("═".repeat(60));

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();
