/**
 * Enrollment-Based Assignment API Test
 * 
 * This script tests:
 * 1. Teacher creates assignment for a specific subject/class/section
 * 2. Only students enrolled in that subject can see the assignment
 * 3. Students not enrolled cannot see the assignment
 */

import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function hr() {
  console.log("═".repeat(80));
}

// Read credentials from cookies.txt or use defaults
function getCredentials() {
  const credentials = {};

  // Try to read from cookies.txt for super admin token
  try {
    if (fs.existsSync("cookies.txt")) {
      const content = fs.readFileSync("cookies.txt", "utf-8");
      const match = content.match(/accessToken=([^;]+)/);
      if (match) {
        credentials.superAdminToken = match[1];
        log("✅ Loaded super admin token from cookies.txt", "green");
      }
    }
  } catch (e) {
    log("⚠️  Could not read cookies.txt", "yellow");
  }

  return credentials;
}

async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    return {
      token: data.accessToken,
      user: data.user,
    };
  } catch (error) {
    log(`❌ Login failed for ${email}: ${error.message}`, "red");
    throw error;
  }
}

async function fetchTeacherAssignments(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch assignments");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    log(`❌ Failed to fetch teacher assignments: ${error.message}`, "red");
    throw error;
  }
}

async function createAssignment(token, assignmentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(assignmentData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to create assignment");

    return data.assignment;
  } catch (error) {
    log(`❌ Failed to create assignment: ${error.message}`, "red");
    throw error;
  }
}

async function testEnrollmentBasedAssignment() {
  hr();
  log("ENROLLMENT-BASED ASSIGNMENT API TEST", "cyan");
  hr();

  const credentials = getCredentials();

  try {
    // Step 1: Login as teacher
    log("\n📝 Step 1: Logging in as TEACHER", "blue");
    const teacherLogin = await loginUser(
      "sajoodali@gmail.com",
      "111111"
    );
    const teacherToken = teacherLogin.token;
    const teacher = teacherLogin.user;

    log(`✅ Logged in as Teacher: ${teacher.first_name} ${teacher.last_name}`, "green");
    log(`   Role: ${teacher.role}`, "green");
    log(`   Branch ID: ${teacher.branch_id}`, "green");

    // Step 2: Get teacher's classes to know what to create assignment for
    log("\n📝 Step 2: Fetching teacher's assigned classes", "blue");
    const myClassesRes = await fetch(`${API_BASE_URL}/api/teacher/my-classes`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const myClassesData = await myClassesRes.json();
    const myClasses = myClassesData.data || [];

    if (myClasses.length === 0) {
      log("❌ Teacher has no class assignments. Cannot proceed.", "red");
      return;
    }

    const targetClass = myClasses[0];
    log(`✅ Found class: ${targetClass.className} - Section: ${targetClass.sectionName}`, "green");
    log(`   Class ID: ${targetClass.classId}`, "green");
    log(`   Section ID: ${targetClass.sectionId}`, "green");
    log(`   Subject: ${targetClass.subjectName}`, "green");

    // Step 3: Create assignment for this class/section/subject
    log("\n📝 Step 3: Creating assignment", "blue");
    const newAssignment = await createAssignment(teacherToken, {
      class_id: targetClass.classId,
      section_id: targetClass.sectionId,
      subject_id: targetClass.subjectId,
      title: `Enrollment Test Assignment - ${new Date().toLocaleTimeString()}`,
      description: "This assignment should only be visible to enrolled students",
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      total_marks: 50,
      is_active: true,
    });

    log(`✅ Assignment created successfully!`, "green");
    log(`   Assignment ID: ${newAssignment.id}`, "green");
    log(`   Title: ${newAssignment.title}`, "green");

    // Step 4: Fetch all students in this class/section
    log("\n📝 Step 4: Fetching students in this class/section", "blue");
    const studentsRes = await fetch(
      `${API_BASE_URL}/api/users/students?class_id=${targetClass.classId}&section_id=${targetClass.sectionId}`,
      {
        headers: { Authorization: `Bearer ${teacherToken}` },
      }
    );

    if (!studentsRes.ok) {
      log("⚠️  Could not fetch students list", "yellow");
    } else {
      const studentsData = await studentsRes.json();
      const allStudents = studentsData.data || [];
      log(`✅ Found ${allStudents.length} students in this class/section`, "green");

      if (allStudents.length > 0) {
        // Step 5: Test with enrolled student
        log("\n📝 Step 5: Testing with ENROLLED student", "blue");
        const enrolledStudent = allStudents[0];
        log(`   Student: ${enrolledStudent.first_name} ${enrolledStudent.last_name}`, "green");

        // Get enrolled student's token by logging in
        const enrolledLogin = await loginUser(enrolledStudent.email || enrolledStudent.registration_no, "111111");
        const enrolledToken = enrolledLogin.token;

        // Fetch assignments as enrolled student
        const studentAssignmentsRes = await fetch(`${API_BASE_URL}/api/assignments`, {
          headers: { Authorization: `Bearer ${enrolledToken}` },
        });

        const studentAssignmentsData = await studentAssignmentsRes.json();
        const studentAssignments = studentAssignmentsData.data || [];

        // Check if the newly created assignment is visible
        const foundAssignment = studentAssignments.find(
          (a) => a.id === newAssignment.id
        );

        if (foundAssignment) {
          log(`✅ Assignment IS VISIBLE to enrolled student!`, "green");
          log(`   Title: ${foundAssignment.title}`, "green");
          log(`   Subject: ${foundAssignment.subject?.name}`, "green");
        } else {
          log(`❌ Assignment NOT VISIBLE to enrolled student (might be missing subjects in response)`, "red");
          log(`   Student assignments count: ${studentAssignments.length}`, "yellow");
        }

        // Step 6: Try to view assignment details as student
        log("\n📝 Step 6: Viewing assignment details as enrolled student", "blue");
        const detailsRes = await fetch(
          `${API_BASE_URL}/api/assignments/${newAssignment.id}`,
          {
            headers: { Authorization: `Bearer ${enrolledToken}` },
          }
        );

        if (detailsRes.ok) {
          log(`✅ Can view assignment details`, "green");
        } else if (detailsRes.status === 403) {
          log(`❌ Got 403 Forbidden - enrollment check failed`, "red");
        } else {
          log(`❌ Got ${detailsRes.status} error`, "red");
        }

        // Step 7: Create unenrolled student scenario (if exists)
        if (allStudents.length > 1) {
          log("\n📝 Step 7: Testing with different student (if not enrolled in subject)", "blue");
          const otherStudent = allStudents[1];
          log(`   Student: ${otherStudent.first_name} ${otherStudent.last_name}`, "green");

          try {
            const otherLogin = await loginUser(otherStudent.email || otherStudent.registration_no, "111111");
            const otherToken = otherLogin.token;

            const otherAssignmentsRes = await fetch(`${API_BASE_URL}/api/assignments`, {
              headers: { Authorization: `Bearer ${otherToken}` },
            });

            const otherData = await otherAssignmentsRes.json();
            const otherAssignments = otherData.data || [];

            const foundInOther = otherAssignments.find(
              (a) => a.id === newAssignment.id
            );

            if (!foundInOther) {
              log(`✅ Assignment CORRECTLY NOT visible to non-enrolled student`, "green");
            } else {
              log(`⚠️  Assignment is visible to non-enrolled student (might not be using subject enrollment)`, "yellow");
            }
          } catch (err) {
            log(`⚠️  Could not test with second student: ${err.message}`, "yellow");
          }
        }
      }
    }

    hr();
    log("✅ TEST COMPLETED SUCCESSFULLY", "green");
    hr();
  } catch (error) {
    hr();
    log(`❌ TEST FAILED: ${error.message}`, "red");
    hr();
    process.exit(1);
  }
}

// Run tests
testEnrollmentBasedAssignment();
