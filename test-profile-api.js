/**
 * Test Teacher Profile API
 * GET /api/users/profile
 */

const BASE_URL = 'http://localhost:3000';

const teacherCredentials = {
  login: 'sajoodali@gmail.com',
  password: '111111'
};

async function testProfile() {
  console.log('='.repeat(60));
  console.log('TESTING /api/users/profile');
  console.log('='.repeat(60));

  try {
    // Login first
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherCredentials)
    });

    const loginData = await loginRes.json();
    
    if (!loginRes.ok || !loginData.success) {
      console.log('❌ Login Failed');
      return;
    }

    const token = loginData.accessToken;
    console.log('✅ Login Successful\n');

    // Test Profile API
    console.log('Testing GET /api/users/profile...\n');

    const profileRes = await fetch(`${BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const profileData = await profileRes.json();

    console.log('Status:', profileRes.status);
    console.log('Response:', JSON.stringify(profileData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProfile();
