/**
 * Test the live API to check if submission_count & total_students are returned
 */
const API_BASE = "http://localhost:3000";

async function testApi() {
  console.log("Testing live assignment list API...\n");
  
  // 1. Login
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: "nomanirshad0324@gmail.com", password: "Noman123" })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  
  if (!token) {
    console.error("Login failed:", loginData);
    return;
  }
  console.log("✅ Logged in as:", loginData.user?.role, loginData.user?.first_name);

  // 2. Fetch assignments
  const res = await fetch(`${API_BASE}/api/assignments`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  
  console.log("\nHTTP Status:", res.status);
  console.log("Response success:", data.success);
  console.log("Total assignments:", data.data?.length);
  
  if (data.data?.length > 0) {
    const first = data.data[0];
    console.log("\n--- First Assignment ---");
    console.log("Title:", first.title);
    console.log("submission_count:", first.submission_count, "(type:", typeof first.submission_count, ")");
    console.log("total_students:", first.total_students, "(type:", typeof first.total_students, ")");
    console.log("\nAll keys on first assignment:", Object.keys(first).join(", "));
  }
  
  // Show summary
  console.log("\n--- All Assignments Summary ---");
  data.data?.forEach(a => {
    console.log(`  "${a.title}": ${a.submission_count} / ${a.total_students}`);
  });
}

testApi().catch(console.error).finally(() => process.exit());
