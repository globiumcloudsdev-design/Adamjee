import fs from 'fs';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MTFlYzZmNi0xZTcxLTRjOGUtOGJjMy0xNWUxOTIwMGY5MDkiLCJyb2xlIjoiVEVBQ0hFUiIsImVtYWlsIjoic2Fqb29kYWxpQGdtYWlsLmNvbSIsImJyYW5jaF9pZCI6ImQxN2QzZTAzLTUyMzEtNGUzYy04ZTBjLWM4YzY0OTc5NGY2NiIsImlhdCI6MTc3NzcyMTM1MCwiZXhwIjoxNzc4MzI2MTUwfQ.3b8XWkzboHXFd7bH3Vmvaxc5aAGPRkXdmhLbTtv7LvM";

const WORKING_ENDPOINTS = [
  '/api/teacher/dashboard',
  '/api/teacher/my-classes',
  '/api/teacher/exams'
];

async function dumpData() {
  console.log("Fetching data from successful Teacher API endpoints...\n");

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  };

  for (const path of WORKING_ENDPOINTS) {
    console.log(`=================================================`);
    console.log(`Fetching: GET ${path}`);
    console.log(`=================================================`);
    try {
      const response = await fetch(`${BASE_URL}${path}`, { headers });
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.log(`Error fetching ${path}:`, error.message);
    }
    console.log("\n");
  }
}

dumpData();
