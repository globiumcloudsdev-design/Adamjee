/**
 * Student Assignment Submission API Test Script
 */
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const STUDENT_EMAIL = "nomanirshad0324@gmail.com";
const STUDENT_PASSWORD = "Noman123";

async function main() {
  console.log("═".repeat(60));
  console.log("STUDENT ASSIGNMENT SUBMISSION TEST");
  console.log("═".repeat(60));

  try {
    // Step 1: Login
    console.log(`\n🔐 Logging in as Student: ${STUDENT_EMAIL}`);
    const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: STUDENT_EMAIL, password: STUDENT_PASSWORD }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginData.error} (Status: ${loginRes.status})`);
    }

    const { accessToken, user } = loginData;
    console.log(`✅ Logged in: ${user.first_name} ${user.last_name} (${user.role})`);
    console.log(`   ID: ${user.id}`);
    
    // Check academic info
    const academicInfo = user.details?.academic_info || {};
    console.log(`   Academic Info: Class ${academicInfo.class_id || 'N/A'}, Section ${academicInfo.section_id || 'N/A'}`);

    // Step 2: Fetch assignments for this student
    // We'll try to fetch all assignments first
    console.log("\n📋 Fetching available assignments...");
    const assignRes = await fetch(`${API_BASE_URL}/api/assignments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const assignData = await assignRes.json();
    if (!assignRes.ok) {
      throw new Error(`Failed to fetch assignments: ${assignData.error}`);
    }

    const assignments = assignData.data || assignData.assignments || [];
    if (assignments.length === 0) {
      console.log("ℹ️ No assignments found. Cannot proceed with submission test.");
      process.exit(0);
    }

    console.log(`✅ Found ${assignments.length} assignment(s)`);
    
    // Step 3: Find and submit a fresh assignment
    let submitted = false;
    for (let i = 0; i < assignments.length; i++) {
      const target = assignments[i];
      console.log(`\n🎯 Testing Assignment [${i+1}/${assignments.length}]: "${target.title}"`);

      console.log("📤 Submitting...");
      const submitRes = await fetch(`${API_BASE_URL}/api/assignments/${target.id || target._id}/submit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}` 
        },
        body: JSON.stringify({
          submission_text: "Automated test submission.",
          submission_url: "https://example.com/test.pdf",
          submission_public_id: "test_id"
        }),
      });

      const submitData = await submitRes.json();
      if (submitRes.ok) {
        console.log("✅ Submission Successful!");
        console.log("   Submission Details:", JSON.stringify(submitData.submission, null, 2));
        submitted = true;
        break;
      } else if (submitData.error === "Already submitted") {
        console.log(`ℹ️ Already submitted "${target.title}". Moving to next...`);
      } else {
        console.error(`❌ Submission Error: ${submitData.error}`);
      }
    }

    if (!submitted) {
      console.log("\nℹ️ No pending assignments found for this student to submit.");
    }

    console.log("\n" + "═".repeat(60));
    console.log("TEST COMPLETED");
    console.log("═".repeat(60));

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();
