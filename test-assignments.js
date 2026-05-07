import http from "node:http";

const HOST = process.env.API_HOST || "localhost";
const PORT = Number(process.env.API_PORT || 3000);
const TEACHER_EMAIL = process.env.TEACHER_EMAIL || "sajoodali@gmail.com";
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || "111111";

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
  console.log("Response:", JSON.stringify(response.data, null, 2));
}

async function loginTeacher() {
  console.log("Logging in as teacher:", TEACHER_EMAIL);
  const response = await requestJson("POST", "/api/auth/login", {
    login: TEACHER_EMAIL,
    password: TEACHER_PASSWORD,
  });

  printResponse("POST /api/auth/login", response);

  if (response.status !== 200) {
    throw new Error(`Teacher login failed with status ${response.status}`);
  }

  const token = response.data?.accessToken;
  if (!token) {
    throw new Error("Login response did not include accessToken");
  }

  return { token, user: response.data?.user || null };
}

async function fetchTeacherAssignmentTarget(token) {
  console.log("\nFetching teacher class and section assignments...");
  const myClassesResponse = await requestJson(
    "GET",
    "/api/teacher/my-classes",
    null,
    { Authorization: `Bearer ${token}` },
  );

  printResponse("GET /api/teacher/my-classes", myClassesResponse);

  if (myClassesResponse.status !== 200 || !myClassesResponse.data?.success) {
    throw new Error("Failed to fetch teacher class assignments");
  }

  const myClasses = Array.isArray(myClassesResponse.data?.data)
    ? myClassesResponse.data.data
    : [];

  const selectedClass = myClasses.find((item) => item.classId && item.sectionId) || myClasses[0];
  if (!selectedClass) {
    throw new Error("Teacher has no class/section assignments");
  }

  const class_id = selectedClass.classId || selectedClass.class_id;
  const section_id = selectedClass.sectionId || selectedClass.section_id;
  if (!class_id || !section_id) {
    throw new Error("Teacher class assignment is missing class_id or section_id");
  }

  let subject_id = selectedClass.subjectId || selectedClass.subject_id || null;
  if (!subject_id) {
    const subjectsResponse = await requestJson(
      "GET",
      `/api/subjects?class_id=${class_id}`,
      null,
      { Authorization: `Bearer ${token}` },
    );

    printResponse("GET /api/subjects?class_id=...", subjectsResponse);

    const subjects = Array.isArray(subjectsResponse.data)
      ? subjectsResponse.data
      : Array.isArray(subjectsResponse.data?.subjects)
        ? subjectsResponse.data.subjects
        : Array.isArray(subjectsResponse.data?.data)
          ? subjectsResponse.data.data
          : [];

    subject_id = subjects[0]?.id || null;
  }

  if (!subject_id) {
    throw new Error("No subject found for the selected teacher class");
  }

  return {
    class_id,
    section_id,
    subject_id,
    class_name: selectedClass.className || selectedClass.name || "N/A",
    section_name: selectedClass.sectionName || "N/A",
    subject_name: selectedClass.subject || "N/A",
  };
}

async function createAssignment(token, payload) {
  console.log("\nCreating assignment...");
  const due_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const response = await requestJson(
    "POST",
    "/api/assignments",
    {
      class_id: payload.class_id,
      section_id: payload.section_id,
      subject_id: payload.subject_id,
      title: "Automated Teacher Assignment Test",
      description: "Created by test-assignments.js",
      due_date,
      total_marks: 20,
    },
    { Authorization: `Bearer ${token}` },
  );

  printResponse("POST /api/assignments", response);
  return response;
}

async function runAssignmentsTests() {
  try {
    console.log("Starting teacher assignment create test\n");

    const login = await loginTeacher();
    const target = await fetchTeacherAssignmentTarget(login.token);

    console.log("\nSelected teacher assignment target:");
    console.log(
      JSON.stringify(
        {
          class_id: target.class_id,
          section_id: target.section_id,
          subject_id: target.subject_id,
          class_name: target.class_name,
          section_name: target.section_name,
          subject_name: target.subject_name,
        },
        null,
        2,
      ),
    );

    const createResponse = await createAssignment(login.token, target);

    if (createResponse.status < 200 || createResponse.status >= 300) {
      throw new Error(
        `Assignment create failed with status ${createResponse.status}`,
      );
    }

    const assignment = createResponse.data?.assignment;
    if (!assignment?.id) {
      throw new Error("Create response did not include assignment.id");
    }

    const implementationGuide = {
      endpoint: "POST /api/assignments",
      auth: "Bearer teacher accessToken from /api/auth/login",
      requiredPayload: {
        class_id: target.class_id,
        section_id: target.section_id,
        subject_id: target.subject_id,
        title: "string",
        description: "string",
        due_date: "YYYY-MM-DD",
        total_marks: 20,
      },
      successResponseShape: {
        success: true,
        assignment: {
          id: assignment.id,
          class_id: target.class_id,
          section_id: target.section_id,
          subject_id: target.subject_id,
        },
      },
    };

    console.log("\nImplementation guide:");
    console.log(JSON.stringify(implementationGuide, null, 2));

    console.log("\nAssignment created successfully.");
  } catch (error) {
    console.error("\nTest failed:", error.message);
    console.log("\nTroubleshooting:");
    console.log("1. Ensure the dev server is running on port 3000.");
    console.log("2. Confirm sajoodali@gmail.com / 111111 is a valid teacher account.");
    console.log("3. Make sure the teacher has at least one class and section in /api/teacher/my-classes.");
  }
}

runAssignmentsTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
