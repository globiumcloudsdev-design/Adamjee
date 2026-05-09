import fs from "node:fs/promises";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const COOKIES_FILE = process.env.COOKIE_JAR || "cookies.txt";

const TEST_STUDENT = {
  first_name: "API",
  last_name: "Student",
  email: `api.student.${Date.now()}@example.com`,
  phone: `0300${Math.floor(1000000 + Math.random() * 9000000)}`,
  password: "Student@123",
};

const STUDENT_CONTEXT = {
  branch_id: "d17d3e03-5231-4e3c-8e0c-c8c649794f66",
  academic_year_id: "a01bf3f0-a144-420f-8513-5cd554532f5f",
  class_id: "78382d1f-e583-4dd4-9a23-d2121c90f2ac",
  section_id: "299a1bd4-5659-46a9-9a4f-85254c78da1b",
  subject_id: "e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
};

function printHeading(title) {
  console.log(`\n${"=".repeat(18)} ${title} ${"=".repeat(18)}`);
}

async function requestJson(method, path, body = null, headers = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Keep raw text if the server does not return JSON.
  }

  return { response, data, text };
}

async function getRefreshTokenFromCookieJar() {
  const cookieJar = await fs.readFile(COOKIES_FILE, "utf8");
  const refreshLine = cookieJar
    .split(/\r?\n/)
    .find((line) => line.includes("refreshToken"));

  if (!refreshLine) {
    throw new Error(`refreshToken not found in ${COOKIES_FILE}`);
  }

  const columns = refreshLine.split("\t");
  return columns[columns.length - 1];
}

async function getSuperAdminToken() {
  const refreshToken = await getRefreshTokenFromCookieJar();
  const refreshResponse = await requestJson(
    "POST",
    "/api/auth/refresh",
    {},
    { Cookie: `refreshToken=${refreshToken}` },
  );

  printHeading("Refresh Token");
  console.log("Status:", refreshResponse.response.status);
  console.log(JSON.stringify(refreshResponse.data, null, 2));

  if (!refreshResponse.response.ok || !refreshResponse.data?.accessToken) {
    throw new Error("Failed to obtain super-admin access token");
  }

  return refreshResponse.data.accessToken;
}

async function createStudent(accessToken) {
  const payload = {
    ...TEST_STUDENT,
    ...STUDENT_CONTEXT,
    subjects: [{ id: STUDENT_CONTEXT.subject_id, fee: 1000 }],
    password: TEST_STUDENT.password,
  };

  const studentResponse = await requestJson(
    "POST",
    "/api/users/students",
    payload,
    { Authorization: `Bearer ${accessToken}` },
  );

  printHeading("Create Student");
  console.log("Status:", studentResponse.response.status);
  console.log(JSON.stringify(studentResponse.data, null, 2));

  if (!studentResponse.response.ok || !studentResponse.data?.student?.id) {
    throw new Error("Failed to create test student");
  }

  return studentResponse.data.student;
}

async function createAssignment(accessToken) {
  const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const assignmentResponse = await requestJson(
    "POST",
    "/api/assignments",
    {
      ...STUDENT_CONTEXT,
      title: "Automated Submission Test",
      description: "Created by test-submissions.js",
      due_date: dueDate,
      total_marks: 25,
    },
    { Authorization: `Bearer ${accessToken}` },
  );

  printHeading("Create Assignment");
  console.log("Status:", assignmentResponse.response.status);
  console.log(JSON.stringify(assignmentResponse.data, null, 2));

  if (!assignmentResponse.response.ok || !assignmentResponse.data?.assignment?.id) {
    throw new Error("Failed to create test assignment");
  }

  return assignmentResponse.data.assignment;
}

async function loginStudent(email, password) {
  const loginResponse = await requestJson("POST", "/api/auth/login", {
    login: email,
    password,
  });

  printHeading("Student Login");
  console.log("Status:", loginResponse.response.status);
  console.log(JSON.stringify(loginResponse.data, null, 2));

  return loginResponse;
}

async function submitAssignment(token, assignmentId) {
  const submitResponse = await requestJson(
    "POST",
    `/api/assignments/${assignmentId}/submit`,
    {
      submission_text: "Submitted by automated test script.",
    },
    { Authorization: `Bearer ${token}` },
  );

  printHeading("Submit Assignment");
  console.log("Status:", submitResponse.response.status);
  console.log(JSON.stringify(submitResponse.data, null, 2));

  return submitResponse;
}

async function main() {
  console.log("Running submission API test against", API_BASE_URL);
  console.log("Note: parent auth is not implemented in the current backend, so this script uses a student account.");

  const adminToken = await getSuperAdminToken();
  await createStudent(adminToken);
  const assignment = await createAssignment(adminToken);

  const loginResponse = await loginStudent(TEST_STUDENT.email, TEST_STUDENT.password);
  if (!loginResponse.response.ok || !loginResponse.data?.accessToken) {
    throw new Error("Student login failed; cannot complete submission test");
  }

  await submitAssignment(loginResponse.data.accessToken, assignment.id);
}

main().catch((error) => {
  console.error("\nTest failed:", error.message);
  process.exitCode = 1;
});