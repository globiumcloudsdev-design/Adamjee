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
const STUDENT_EMAIL = "nomanirshad0342@gmail.com";
const STUDENT_PASSWORD = "Noman123";
const ENV_ACCESS_TOKEN = process.env.ACCESS_TOKEN || "";

function loadAuthTokensFromCookiesTxt() {
  const tokens = { accessToken: "", refreshToken: "" };

  try {
    const filePath = path.join(__dirname, "cookies.txt");
    if (!fs.existsSync(filePath)) return tokens;

    const content = fs.readFileSync(filePath, "utf8");

    const inlineAccess = content.match(/accessToken=([^;\r\n]+)/i)?.[1]?.trim() || "";
    const inlineRefresh = content.match(/refreshToken=([^;\r\n]+)/i)?.[1]?.trim() || "";

    tokens.accessToken = inlineAccess;
    tokens.refreshToken = inlineRefresh;

    // Netscape cookie format fallback: last two columns are cookie name and value
    if (!tokens.accessToken || !tokens.refreshToken) {
      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && (!line.startsWith("#") || line.startsWith("#HttpOnly_")));

      for (const line of lines) {
        const parts = line.split("\t");
        if (parts.length < 7) continue;

        const name = parts[5];
        const value = parts[6] || "";

        if (name === "accessToken" && !tokens.accessToken) {
          tokens.accessToken = value.trim();
        }

        if (name === "refreshToken" && !tokens.refreshToken) {
          tokens.refreshToken = value.trim();
        }
      }
    }
  } catch {
    return { accessToken: "", refreshToken: "" };
  }

  return tokens;
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

  const { accessToken, refreshToken } = loadAuthTokensFromCookiesTxt();
  if (accessToken) return accessToken;

  if (refreshToken) {
    const refreshResponse = await requestJson(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
    });

    if (refreshResponse.ok && refreshResponse.body?.accessToken) {
      return refreshResponse.body.accessToken;
    }
  }

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
  await runAttendanceRequest(token, "filterType=all&status=present&page=1&limit=5", "[3] Status present");
  await runAttendanceRequest(token, "filterType=all&status=absent&page=1&limit=5", "[4] Status absent");
  await runAttendanceRequest(token, "filterType=all&status=leave&page=1&limit=5", "[5] Status leave");

  console.log("\nPASS: Student attendance history, filters, auth context, and statuses verified.");
})().catch((error) => {
  console.error("\nFAIL:", error?.message || error);
  process.exitCode = 1;
});
