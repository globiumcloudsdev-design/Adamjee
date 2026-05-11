/**
 * Teacher -> Assignment -> Student Visibility test
 *
 * Goal:
 * 1) Login as TEACHER
 * 2) Create an assignment for a teacher class/section/subject
 * 3) Login as STUDENT and verify assignment is visible in GET /api/assignments
 *
 * Required env:
 *  - NEXT_PUBLIC_API_URL (optional, default http://localhost:3000)
 *  - TEACHER_EMAIL
 *  - TEACHER_PASSWORD
 * Optional:
 *  - STUDENT_EMAIL
 *  - STUDENT_PASSWORD
 */

import http from "node:http";

const HOST = process.env.API_HOST || "localhost";
const PORT = Number(process.env.API_PORT || 3000);

const TEACHER_EMAIL = process.env.TEACHER_EMAIL || "sajoodali@gmail.com";
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || "111111";

const STUDENT_EMAIL = process.env.STUDENT_EMAIL || "";
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD || "";

function requestJson(method, path, body = null, headers = {}) {
  const options = {
    hostname: HOST,
    port: PORT,
    path,
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data || "{}");
        } catch {}
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function printResponse(label, response) {
  console.log(`\n${label}`);
  console.log("Status:", response.status);
  if (response?.data !== undefined) {
    console.log("Response:", JSON.stringify(response.data, null, 2));
  }
}

async function login(loginPath, loginBody) {
  const res = await requestJson("POST", loginPath, loginBody);
  printResponse(`POST ${loginPath}`, res);

  if (res.status !== 200) {
    throw new Error(`Login failed with status ${res.status}: ${res.data?.error || ""}`);
  }

  const token = res.data?.accessToken;
  if (!token) throw new Error("Missing accessToken in login response");

  return { token, user: res.data?.user || null };
}

async function fetchTeacherTarget(token) {
  const myClassesRes = await requestJson(
    "GET",
    "/api/teacher/my-classes",
    null,
    { Authorization: `Bearer ${token}` }
  );
  printResponse("GET /api/teacher/my-classes", myClassesRes);

  if (myClassesRes.status !== 200 || !myClassesRes.data?.success) {
    throw new Error("Failed to fetch teacher my-classes");
  }

  const myClasses = Array.isArray(myClassesRes.data?.data) ? myClassesRes.data.data : [];
  const selectedClass = myClasses.find((x) => x.classId && x.sectionId) || myClasses[0];
  if (!selectedClass) throw new Error("Teacher has no class/section");

  const class_id = selectedClass.classId || selectedClass.class_id;
  const section_id = selectedClass.sectionId || selectedClass.section_id;
  if (!class_id || !section_id) throw new Error("Missing class_id/section_id for teacher class");

  let subject_id = selectedClass.subjectId || selectedClass.subject_id || null;

  if (!subject_id) {
    const subjectsRes = await requestJson(
      "GET",
      `/api/subjects?class_id=${class_id}`,
      null,
      { Authorization: `Bearer ${token}` }
    );
    printResponse("GET /api/subjects?class_id=...", subjectsRes);

    const subjects = Array.isArray(subjectsRes.data)
      ? subjectsRes.data
      : Array.isArray(subjectsRes.data?.subjects)
        ? subjectsRes.data.subjects
        : Array.isArray(subjectsRes.data?.data)
          ? subjectsRes.data.data
          : [];

    subject_id = subjects[0]?.id || null;
  }

  if (!subject_id) throw new Error("No subject found for teacher class/section");

  return {
    class_id,
    section_id,
    subject_id,
  };
}

async function createAssignment(token, payload) {
  const due_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const res = await requestJson(
    "POST",
    "/api/assignments",
    {
      class_id: payload.class_id,
      section_id: payload.section_id,
      subject_id: payload.subject_id,
      title: "Automated Teacher Assignment Visibility Test",
      description: "Created by test-assignments-student-visibility.js",
      due_date,
      total_marks: 20,
    },
    { Authorization: `Bearer ${token}` }
  );
  printResponse("POST /api/assignments", res);

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Assignment create failed with status ${res.status}`);
  }

  const assignment = res.data?.assignment;
  if (!assignment?.id) throw new Error("Create response missing assignment.id");

  return assignment;
}

async function main() {
  console.log("\n=== Teacher -> Assignment -> Student Visibility Test ===\n");

  if (!TEACHER_EMAIL || !TEACHER_PASSWORD) {
    throw new Error("Set TEACHER_EMAIL and TEACHER_PASSWORD");
  }

  if (!STUDENT_EMAIL || !STUDENT_PASSWORD) {
    throw new Error(
      "Set STUDENT_EMAIL and STUDENT_PASSWORD in env for this script (student academic_info must be present)."
    );
  }

  // 1) Teacher create
  console.log("Logging in as teacher...");
  const teacher = await login("/api/auth/login", { login: TEACHER_EMAIL, password: TEACHER_PASSWORD });

  console.log("Fetching teacher target class/section/subject...");
  const target = await fetchTeacherTarget(teacher.token);

  console.log("Creating assignment...");
  const assignment = await createAssignment(teacher.token, target);

  console.log("\nAssignment created:");
  console.log(JSON.stringify({
    assignment_id: assignment.id || assignment._id,
    subject_id: assignment.subject_id,
    class_id: assignment.class_id,
    section_id: assignment.section_id,
  }, null, 2));

  // 2) Student visibility
  console.log("\nLogging in as student...");
  const student = await login("/api/auth/login", { login: STUDENT_EMAIL, password: STUDENT_PASSWORD });

  const academicInfo = student.user?.details?.academic_info || {};
  console.log("Student academic_info snapshot:");
  console.log(JSON.stringify({
    class_id: academicInfo.class_id,
    section_id: academicInfo.section_id,
    subjects: academicInfo.subjects?.map((s) => ({ id: s.id, name: s.name })) || [],
  }, null, 2));

  console.log("\nFetching assignments as student (GET /api/assignments)...");
  const listRes = await requestJson(
    "GET",
    "/api/assignments",
    null,
    { Authorization: `Bearer ${student.token}` }
  );
  printResponse("GET /api/assignments (student)", listRes);

  if (listRes.status !== 200 || !listRes.data?.success) {
    throw new Error(`Failed to fetch assignments for student: ${listRes.data?.error || ""}`);
  }

  const assignments = Array.isArray(listRes.data?.data) ? listRes.data.data : [];

  const visible = assignments.some((a) => String(a.id || a._id) === String(assignment.id || assignment._id));

  if (!visible) {
    console.error("\n❌ Assignment is NOT visible to student.");
    console.error("Root-cause checklist:");
    console.error("- student.details.academic_info.subjects[].id must include assignment.subject_id");
    console.error("- student.details.academic_info.class_id/section_id must match assignment class/section");
    process.exitCode = 1;
    return;
  }

  console.log("\n✅ Assignment IS visible to student.");
}

main().catch((e) => {
  console.error("\n❌ Test failed:", e?.message || e);
  process.exitCode = 1;
});

