/**
 * Teacher API Login Test Script
 * Tests login with teacher credentials and provides documentation
 */

const BASE_URL = 'http://localhost:3000';

const teacherCredentials = {
  login: 'sajoodali@gmail.com',
  password: '111111',
  role: 'Teacher'
};

async function testTeacherLogin() {
  console.log('='.repeat(60));
  console.log('TEACHER API LOGIN TEST');
  console.log('='.repeat(60));
  console.log('\n📋 Credentials Provided:');
  console.log(`   Email: ${teacherCredentials.login}`);
  console.log(`   Password: ${teacherCredentials.password}`);
  console.log(`   Role: ${teacherCredentials.role}`);
  console.log('\n🚀 Testing Login API...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: teacherCredentials.login,
        password: teacherCredentials.password
      })
    });

    const data = await response.json();

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log('\n👤 User Details:');
      console.log(`   ID: ${data.user.id}`);
      console.log(`   Name: ${data.user.first_name} ${data.user.last_name}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   Registration No: ${data.user.registration_no}`);
      console.log('\n🔑 Tokens:');
      console.log(`   Access Token: ${data.accessToken?.substring(0, 50)}...`);
      console.log(`   Refresh Token: (HttpOnly Cookie Set)`);
      console.log('\n🎯 Permissions:', data.user.permissions);

      // Test authenticated endpoints
      await testAuthenticatedEndpoints(data.accessToken);
    } else {
      console.log('\n❌ LOGIN FAILED!');
      console.log('Error:', data.error);
    }

  } catch (error) {
    console.error('\n❌ Request Failed:', error.message);
    console.log('\n⚠️ Make sure the server is running on port 3002');
    console.log('   Run: npm run dev');
  }
}

async function testAuthenticatedEndpoints(accessToken) {
  console.log('\n' + '='.repeat(60));
  console.log('TESTING AUTHENTICATED ENDPOINTS');
  console.log('='.repeat(60));

  const endpoints = [
    { path: '/api/auth/me', method: 'GET', name: 'Get Current User' },
    { path: '/api/academic-years', method: 'GET', name: 'Get Academic Years' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log(`\n🔗 ${endpoint.name} (${endpoint.path})`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${response.ok}`);
      if (response.ok) {
        console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        console.log(`   Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`\n🔗 ${endpoint.name} (${endpoint.path})`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Run the test
testTeacherLogin();
