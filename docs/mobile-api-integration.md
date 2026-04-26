**Mobile App — Backend API Integration Guide (React Native Expo)**

Yeh document backend APIs ko React Native (Expo) mobile app se integrate karne ka seedha sa guide hai. Roman-Urdu main instructions aur clear examples diye gaye hain.

**Overview:**
- **Purpose:**: Backend APIs ko mobile app se kaise call karna hai, authentication/authorization, file uploads, aur OC agent (server/automation) ke through integration.
- **Audience:** Mobile developer (React Native Expo) aur OC agent integrator.

**Base URL**:
- **Base:** https://your-backend.example.com/api
- **Versioning (agar ho):** /v1/...

**Authentication**:
- **Type:** JWT bearer tokens (usual). Login endpoint se token milega.
- **Login (POST /auth/login):** body: { "email": "", "password": "" }
- **Response:** { "token": "<jwt>", "user": { ... } }
- **Header for authenticated calls:** Authorization: Bearer <token>

**Token storage (React Native Expo)**
- Recommended: `expo-secure-store` for production; fallback `@react-native-async-storage/async-storage` for quick use.
- Example (expo-secure-store):

```js
import * as SecureStore from 'expo-secure-store';

async function saveToken(token) {
  await SecureStore.setItemAsync('authToken', token);
}
async function getToken() {
  return await SecureStore.getItemAsync('authToken');
}
```

**Common headers**
- Content-Type: application/json
- Authorization: Bearer <token>
- For file uploads: Content-Type will be multipart/form-data (let fetch set the boundary)

**Key Endpoints (examples)**
- POST /api/auth/login — login, returns token
- GET /api/users/me — get profile (auth)
- GET /api/students — list students (auth)
- POST /api/attendance/mark — mark attendance (auth)
- POST /api/upload — file upload (auth)

---

**Examples**

cURL — login

```bash
curl -X POST "https://your-backend.example.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"secret"}'
```

Fetch (login + subsequent call)

```js
// login
const login = async (email, password) => {
  const res = await fetch('https://your-backend.example.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (res.ok) {
    await saveToken(data.token); // see token storage above
  }
  return data;
};

// authenticated call
const fetchStudents = async () => {
  const token = await getToken();
  const res = await fetch('https://your-backend.example.com/api/students', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
};
```

Axios example

```js
import axios from 'axios';

const api = axios.create({ baseURL: 'https://your-backend.example.com/api' });
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// use: await api.get('/students');
```

File upload (React Native Expo) — image/file

```js
// pick file with expo-image-picker or other
const uploadFile = async (uri, filename, mimeType = 'image/jpeg') => {
  const token = await getToken();
  const form = new FormData();
  form.append('file', { uri, name: filename, type: mimeType });

  const res = await fetch('https://your-backend.example.com/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return res.json();
};
```

Notes: Do NOT set `Content-Type` manually for FormData; let fetch set boundary.

---

**OC Agent Integration (how the OC agent should call APIs)**
- If the OC agent is a server/service that will call backend APIs (on behalf of UI or for automation), prefer one of these approaches:
  - **Service account + API Key:** Create a service API key with limited scope. OC agent includes `x-api-key: <key>` header. Backend validates key and maps to a service user.
  - **JWT Service Token:** Create a long-lived JWT for the agent (signed by same auth system). Agent sends `Authorization: Bearer <service-jwt>`.
- **Permissions:** Create a role for the OC agent with minimal required scopes (read-only vs write). Avoid using admin tokens.
- **IP/ACL (optional):** Restrict API key usage to known agent IPs (if possible).
- **How to call:** Example header for agent using API key:

```
x-api-key: <SERVICE_KEY>
Authorization: Bearer <optional-jwt>
```

- **Agent flow:** Agent requests resources or posts data exactly like the mobile app; if the agent is acting on behalf of a user, include an identifier (user_id) in the payload and use signing/verification as needed.

---

**Testing & Postman**
- Use Postman or Insomnia to test endpoints first.
- Steps:
  1. POST /auth/login -> copy token.
  2. Set header `Authorization: Bearer <token>` for subsequent requests.
  3. Test file upload with form-data body.

**Common Errors & Troubleshooting**
- 401 Unauthorized: Token missing/expired — refresh or re-login.
- 403 Forbidden: Role/permission issue — check user scopes.
- 415 Unsupported Media Type: Wrong Content-Type for upload.
- CORS: Mobile apps usually avoid CORS; if using webviews or web-based flows, ensure backend CORS allows origin.
- SSL: Use HTTPS in production; self-signed certs will fail on devices.

**Versioning & Rate Limits**
- Prefix endpoints with version: /api/v1/...
- Backend may enforce rate limits — handle 429 responses by retry/backoff.

**Security Best Practices**
- Use `expo-secure-store` for tokens.
- Do not log tokens or sensitive data.
- Use short-lived JWTs with refresh tokens if available.
- Validate SSL on device; do not disable certificate checks.

**Example Minimal React Native Flow (summary)**
- Login screen: call /auth/login -> store token securely -> navigate to app.
- API client: centralize fetch/axios with token injection.
- Error handling: on 401 -> navigate to Login (clear token).

---

**Where to find endpoints in repo**
- Check `src/app/api` and backend `controllers` for exact endpoint paths and payloads.

**If you want, next I can:**
- Add concrete examples for the exact endpoints in your backend (I can scan `src/backend/controllers/` and auto-populate payload examples).


---

Document created for quick integration. If you want Urdu-to-English translation or to include exact endpoints from the repo, tell me and I'll scan the controllers and update this doc.
