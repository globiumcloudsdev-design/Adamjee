import fetch from 'node-fetch';

/**
 * Student login -> fetch /api/users/profile
 *
 * Usage:
 *   ts-node student_profile_test.ts
 * or
 *   node student_profile_test.ts
 *
 * Config (optional):
 *   - BASE_URL: your app origin (e.g. http://localhost:3000)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const LOGIN = 'shoaibrazamemon@gmail.com';
const PASSWORD = '12345678';

function pickStudentFields(user: any) {
  const details = user?.details || {};
  const academicInfo = details.academic_info || {};
  const guardian = academicInfo.guardian || details.guardian || null;
  const parent = academicInfo.parent || details.parent || null;

  const classValue = academicInfo.class_name || academicInfo.class || details.class_name || details.class || user?.class || user?.class_name || null;
  const sectionValue = academicInfo.section_name || academicInfo.section || details.section_name || details.section || user?.section || user?.section_name || null;
  const grNo = academicInfo.roll_no || details.roll_no || user?.roll_no || user?.registration_no || null;

  return {
    name: [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || null,
    fatherName: details.father_name || academicInfo.father_name || parent?.name || null,
    grNo,
    class: classValue,
    section: sectionValue,
    email: user?.email || null,
    phone: user?.phone || null,
    parentOrGuardian: parent || guardian,
    guardianType: details.guardian_type || academicInfo.guardian_type || (parent ? 'parent' : guardian ? 'guardian' : null),
  };
}

async function main() {
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // IMPORTANT: login endpoint expects { login, password }
    body: JSON.stringify({ login: LOGIN, password: PASSWORD }),
    // Note: refreshToken is set as httpOnly cookie; fetch in Node needs cookie support
    // for subsequent authenticated requests.
  });

  const loginText = await loginRes.text();
  let loginJson: any;
  try {
    loginJson = JSON.parse(loginText);
  } catch {
    // ignore
  }

  console.log('Login status:', loginRes.status);
  console.log('Login response:', loginJson ?? loginText);

  if (!loginRes.ok || !loginJson?.success) {
    throw new Error('Login failed; aborting profile fetch');
  }

  const accessToken = loginJson.accessToken;
  if (!accessToken) {
    throw new Error('accessToken missing in login response');
  }

  // /api/users/profile uses custom JWT auth middleware; it expects Authorization header.
  const profileRes = await fetch(`${BASE_URL}/api/users/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const profileText = await profileRes.text();
  let profileJson: any;
  try {
    profileJson = JSON.parse(profileText);
  } catch {
    // ignore
  }

  console.log('Profile status:', profileRes.status);
  console.log('Profile response:', profileJson ?? profileText);

  if (profileJson?.success && profileJson?.user) {
    const user = profileJson.user;
    const extracted = pickStudentFields(user);

    console.log('Requested fields snapshot:', JSON.stringify(extracted, null, 2));

    const details = user.details || {};
    const academicInfo = details.academic_info || {};
    const guardian = academicInfo.guardian || details.guardian || null;
    const parent = academicInfo.parent || details.parent || null;

    const requestedChecks = {
      name: Boolean(extracted.name),
      fatherName: Boolean(extracted.fatherName),
      grNo: Boolean(extracted.grNo),
      class: Boolean(extracted.class),
      section: Boolean(extracted.section),
      email: Boolean(extracted.email),
      phone: Boolean(extracted.phone),
      parentOrGuardian: Boolean(parent || guardian),
      contactName: Boolean(parent?.name || guardian?.name),
      relation: Boolean(parent?.relation || guardian?.relation),
    };

    console.log('Field presence:', JSON.stringify(requestedChecks, null, 2));
    console.log('Role:', user.role);
  }

  if (!profileRes.ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exitCode = 1;
});

