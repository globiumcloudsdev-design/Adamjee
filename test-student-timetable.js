/**
 * Student Timetable API test
 *
 * Goal:
 * - Login as STUDENT
 * - Call GET /api/student/timetable WITHOUT query params
 * - Validate success + basic structure
 */

import http from "node:http";

const HOST = process.env.API_HOST || "localhost";
const PORT = Number(process.env.API_PORT || 3000);

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

  return new Promise((resolve, reject) => {t
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
    console.log(JSON.stringify(response.data, null, 2));
  }
}

async function login() {
  if (!STUDENT_EMAIL || !STUDENT_PASSWORD) {
    throw new Error("Set STUDENT_EMAIL and STUDENT_PASSWORD env vars for this script.");
  }

  console.log(`Logging in as student: ${STUDENT_EMAIL}`);
  const res = await requestJson("POST", "/api/auth/login", {
    login: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
  });

  printResponse("POST /api/auth/login", res);

  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.data?.error || ""} (status ${res.status})`);
  }

  const token = res.data?.accessToken;
  if (!token) throw new Error("Missing accessToken in login response");

  return { token, user: res.data?.user || null };
}

async function main() {
  console.log("\n=== Student Timetable API Test ===\n");

  const { token, user } = await login();

  const academicInfo = user?.details?.academic_info || {};
  console.log("Student academic_info used for auto-detect:");
  console.log(
    JSON.stringify(
      {
        class_id: academicInfo.class_id,
        section_id: academicInfo.section_id,
        subjects: academicInfo.subjects?.map((s) => ({ id: s.id, name: s.name })) || [],
      },
      null,
      2
    )
  );

  console.log("\nCalling GET /api/student/timetable (no params)...");
  const ttRes = await requestJson(
    "GET",
    "/api/student/timetable",
    null,
    { Authorization: `Bearer ${token}` }
  );

  printResponse("GET /api/student/timetable", ttRes);

  if (ttRes.status !== 200 || !ttRes.data?.success) {
    throw new Error(`Timetable fetch failed: ${ttRes.data?.error || ""} (status ${ttRes.status})`);
  }

  const data = Array.isArray(ttRes.data?.data) ? ttRes.data.data : [];
  if (data.length === 0) {
    console.log("⚠️ Timetable returned empty data array.");
  } else {
    const sample = data[0];
    console.log("\nTimetable sample entry:");
    console.log(
      JSON.stringify(
        {
          day: sample.day,
          start_time: sample.start_time,
          end_time: sample.end_time,
          subject: sample.subject,
          teacher: sample.teacher,
          class: sample.class,
          section: sample.section,
          roomNumber: sample.roomNumber,
        },
        null,
        2
      )
    );
  }

  console.log("\n✅ Student timetable test completed.");
}

main().catch((e) => {
  console.error("\n❌ Test failed:", e?.message || e);
  process.exitCode = 1;
});

