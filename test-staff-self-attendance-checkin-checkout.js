/*
  Test script for Staff Self Attendance check-in / check-out APIs.

  Usage:
    node test-staff-self-attendance-checkin-checkout.js

  What it does:
   - Authenticates using your existing cookies.txt (accessToken) if available
     (the script tries to reuse cookies + Authorization header logic).
   - Calls:
       POST /api/staff-attendance/check-in
       POST /api/staff-attendance/check-out
   - Logs JSON responses.

  Note:
   - This repo uses Next.js route handlers protected by withAuth middleware.
   - You must have an auth token (accessToken) available in cookies.txt or by setting
     env var ACCESS_TOKEN.
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// If you're using Next.js in dev, route handlers must be reachable.
// Make sure your server is running before executing this script.
// (kept for documentation)
const NEXT_APP_RUNNING_HINT = true;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || '';

function loadAccessTokenFromCookiesTxt() {
  try {
    const p = path.join(__dirname, 'cookies.txt');
    if (!fs.existsSync(p)) return '';
    const content = fs.readFileSync(p, 'utf8');

    // Attempt to find something like accessToken=...
    const match = content.match(/accessToken=([^;\r\n]+)/i);
    if (match && match[1]) return match[1].trim();
  } catch (e) {}
  return '';
}

function nowIso() {
  return new Date().toISOString();
}

async function postJson(url, body, token) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });

  let json;
  try {
    json = await res.json();
  } catch (e) {
    json = { parseError: String(e), text: await res.text().catch(() => '') };
  }

  return { status: res.status, ok: res.ok,  json };
}

(async () => {
  console.log('=== Staff Self Attendance Check-in/Check-out API Test ===');
  console.log('BASE_URL:', BASE_URL);
  const token = ACCESS_TOKEN || loadAccessTokenFromCookiesTxt();

  if (!token) {
    console.error('Missing access token. Provide ACCESS_TOKEN env var or ensure cookies.txt contains accessToken=...');
    process.exit(1);
  }

  console.log('Token present:', token ? 'yes' : 'no');
  console.log('Time:', nowIso());

  // CHECK-IN
  const checkInUrl = `${BASE_URL}/api/staff-attendance/check-in`;
  console.log('\n[1] POST check-in =>', checkInUrl);
  const inResp = await postJson(checkInUrl, {}, token);
  console.log('Response:', JSON.stringify(inResp, null, 2));

  // CHECK-OUT
  const checkOutUrl = `${BASE_URL}/api/staff-attendance/check-out`;
  console.log('\n[2] POST check-out =>', checkOutUrl);
  const outResp = await postJson(checkOutUrl, {}, token);
  console.log('Response:', JSON.stringify(outResp, null, 2));

  console.log('\n=== Done ===');
})();

