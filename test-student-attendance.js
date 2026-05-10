/*
  Student self attendance API test script

  Coverage:
  - Auth context using ACCESS_TOKEN/cookies.txt or student credentials
  - GET /api/student/attendance history
  - Filters: monthly, date, status
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const STUDENT_EMAIL = process.env.STUDENT_EMAIL || "";
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD || "";
const ENV_ACCESS_TOKEN = process.env.ACCESS_TOKEN || "";

function loadTokenFromCookiesTxt() {
  try {
    const filePath = path.join(__dirname, "cookies.txt");
    if (!fs.existsSync(filePath)) return "";

    const content = fs.readFileSync(filePath, "utf8");
    const match = content.match(/accessToken=([^;\r\n]+)/i);
    return match?.[1]?.trim() || "";
  } catch {
    return "";
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    date: now.toISOString().split("T")[0],
  };
}

async function loginAsStudent() {
  if (!STUDENT_EMAIL || !STUDENT_PASSWORD) {
    throw new Error("Missing token and student credentials. Set ACCESS_TOKEN or STUDENT_EMAIL/STUDENT_PASSWORD.");
  }

  const loginResponse = await requestJson(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      login: STUDENT_EMAIL,
      password: STUDENT_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed with status ${loginResponse.status}: ${JSON.stringify(loginResponse.body)}`);
  }

  const token = loginResponse.body?.accessToken;
  if (!token) {
    throw new Error("Login succeeded but accessToken is missing");
  }

  return token;
}

async function getAuthToken() {
  if (ENV_ACCESS_TOKEN) return ENV_ACCESS_TOKEN;

  const cookieToken = loadTokenFromCookiesTxt();
  if (cookieToken) return cookieToken;

  return loginAsStudent();
}

async function runAttendanceRequest(token, queryString, label) {
  const url = `${BASE_URL}/api/student/attendance${queryString ? `?${queryString}` : ""}`;
  const response = await requestJson(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`\n${label}`);
  console.log("URL:", url);
  console.log("Status:", response.status);
  console.log(JSON.stringify(response.body, null, 2));

  if (!response.ok || !response.body?.success) {
    throw new Error(`${label} failed with status ${response.status}`);
  }

  return response.body;
}

(async () => {
  console.log("=== Student Attendance API Test ===");
  console.log("BASE_URL:", BASE_URL);

  const token = await getAuthToken();
  if (!token) {
    throw new Error("Unable to get access token");
  }

  const { month, year, date } = getCurrentMonthYear();

  await runAttendanceRequest(token, `filterType=monthly&month=${month}&year=${year}&page=1&limit=10`, "[1] Monthly history");
  await runAttendanceRequest(token, `filterType=date&date=${date}`, "[2] Date filter");
  await runAttendanceRequest(token, "filterType=all&status=present&page=1&limit=5", "[3] Status filter");

  console.log("\nPASS: Student attendance history, filters, and auth context verified.");
})().catch((error) => {
  console.error("\nFAIL:", error?.message || error);
  process.exitCode = 1;
});
