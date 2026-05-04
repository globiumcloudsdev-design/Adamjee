import fs from 'fs';

const PORT = 3000; // Assuming default Next.js port
const BASE_URL = `http://localhost:${PORT}`;

const TEACHER_ENDPOINTS = [
  { method: 'GET', path: '/api/teacher/dashboard' },
  { method: 'GET', path: '/api/teacher/my-classes' },
  { method: 'GET', path: '/api/teacher/classes' },
  { method: 'GET', path: '/api/teacher/students' },
  { method: 'POST', path: '/api/teacher/attendance/mark' },
  { method: 'GET', path: '/api/teacher/attendance/view' },
  { method: 'POST', path: '/api/teacher/assignments' },
  { method: 'GET', path: '/api/teacher/assignments' },
  { method: 'POST', path: '/api/teacher/exams' },
  { method: 'GET', path: '/api/teacher/exams' },
  { method: 'GET', path: '/api/teacher/leave' },
  { method: 'GET', path: '/api/teacher/payroll/list' }
];

async function testEndpoint({ method, path }, token) {
  const url = `${BASE_URL}${path}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers,
    });
    
    return {
      path,
      method,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    };
  } catch (error) {
    return {
      path,
      method,
      status: 'Error',
      ok: false,
      statusText: error.message
    };
  }
}

async function runTests() {
  const token = process.argv[2]; // Read token from command line arguments
  
  console.log(`Starting Teacher API Endpoint Tests on ${BASE_URL}...\n`);
  
  if (!token) {
    console.log('⚠️ No Authorization token provided! You will likely get 401 Unauthorized for protected routes.');
    console.log('To test properly, pass a valid token as an argument:');
    console.log('node test-teacher-apis.js "YOUR_JWT_TOKEN"\n');
  } else {
    console.log('✅ Testing with provided Authorization token.\n');
  }
  
  const results = [];
  
  for (const endpoint of TEACHER_ENDPOINTS) {
    process.stdout.write(`Testing [${endpoint.method}] ${endpoint.path} ... `);
    const result = await testEndpoint(endpoint, token);
    console.log(`${result.status} ${result.statusText}`);
    results.push(result);
  }
  
  console.log('\n--- Test Summary ---');
  const success = results.filter(r => r.ok);
  const authErrors = results.filter(r => r.status === 401 || r.status === 403);
  const notFound = results.filter(r => r.status === 404);
  const errors = results.filter(r => r.status === 'Error');
  
  console.log(`Total Endpoints Tested: ${results.length}`);
  console.log(`Successful (2xx): ${success.length}`);
  console.log(`Auth Errors (401/403): ${authErrors.length}`);
  console.log(`Not Found (404): ${notFound.length}`);
  console.log(`Connection Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nWarning: Could not connect to the server. Make sure your Next.js dev server is running on port 3000.');
  }
}

runTests();
