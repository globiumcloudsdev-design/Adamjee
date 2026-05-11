# Student API Documentation (student/exam/fees)

> Note: This doc is built by checking repo implementation under `src/app/api/*` and shared mappings in `src/constants/api-endpoints.js`.

---

## Auth Context
All student endpoints are protected by auth middleware (`withAuth` / `getCurrentUser`).
- Student role can access only its own data (server-side guards in routes like `/student/fees-vouchers`).

---

## 1) Student Profile (GET/UPDATE)
### Endpoint
- **GET** `/student/profile`
- **PUT** `/student/profile`
- **POST** `/student/profile/avatar`

### Where it is defined
- `src/constants/api-endpoints.js`
  - `API_ENDPOINTS.STUDENT.PROFILE.GET  = "/student/profile"`
  - `API_ENDPOINTS.STUDENT.PROFILE.UPDATE = "/student/profile"`
  - `API_ENDPOINTS.STUDENT.PROFILE.AVATAR = "/student/profile/avatar"`

### Implementation status in this repo
- In current scan, `src/app/api/student/profile/*` route files are **not present**.
- So the backend implementation cannot be verified from `src/app/api` folder in this workspace.

### Check against `/api/users/...` (important)
- Repo me actual profile implementation milti hai:
  - **GET** `/api/users/profile`
  - **PUT** `/api/users/profile`
  - File: `src/app/api/users/profile/route.js`

#### What it does (implementation)
- Reads authenticated user id from `req.user.id` (via `withAuth`).
- `GET /api/users/profile`:
  - returns user full profile + included `branch`.
- `PUT /api/users/profile`:
  - updates `first_name/last_name/email/phone` + merges `details`
  - supports avatar update if `avatar` is provided as `data:image/...` (Cloudinary upload).

#### Conclusion for `/student/profile`
- `src/constants/api-endpoints.js` me `/student/profile` mapping exists.
- Current scan me `/student/profile` backend route file nahi mila.
- Actual profile implementation available hai:
  - **GET/PUT** `/api/users/profile` (file: `src/app/api/users/profile/route.js`)

✅ Kya student ki profile `/api/users/profile` se fetch hoti hai?
- **Backend level:** haan, `/api/users/profile` authenticated user ka profile return karta hai.
- **Frontend call level:** is scan me `src/` ke andar `/student/profile` ya `API_ENDPOINTS.STUDENT.PROFILE.*` usage (components/pages) ka evidence nahi mila, isliye exact routing (frontend alias/redirect) confirm karna baki hai.

✅ Action for verification (recommended)
1. Browser DevTools > Network me dekhna: student UI profile open karte waqt request kis URL pe ja rahi hai (`/student/profile` vs `/api/users/profile`).
2. If request `/api/users/profile` pe ja rahi ho, then `/student/profile` mapping frontend alias/unused hoga.

---

## 2) Fees Voucher (Student)
### 2.1 Fees overview (summary)
- **GET** `/student/dashboard`

**Implementation:** `src/app/api/student/dashboard/route.js`

**What it returns (high level):**
- `data.fees.total_due`, `total_paid`, `total_fine`, `total_remaining`
- counts by status: `unpaid_vouchers`, `partial_vouchers`, `paid_vouchers`, `overdue_vouchers`
- `upcoming_dues` + `vouchers_count`

### 2.2 List student fee vouchers (filtered + pagination)
- **GET** `/student/fees-vouchers`

**Implementation:** `src/app/api/student/fees-vouchers/route.js`

**Query params (optional):**
- `studentId` (server allows only if user.role !== STUDENT guard passes)
- `status` in `PAID | UNPAID | PARTIAL | OVERDUE`
- `page` (default `1`)
- `limit` (default `20`)

**Student access rule (server-side):**
- If `user.role === STUDENT` then `studentId` must equal `user.id`, otherwise **403**.

**Response:**
- `data.vouchers[]` with fields like:
  - `id`, `voucher_no`, `amount_due`, `paid_amount`, `fine_amount`, `remaining_amount`
  - `status`, `fee_type`, `due_date`, `paid_date`, `month`, `remarks`
  - included: `class`, `section`, `academic_year`, `branch`
  - `payment_history`
- `data.pagination` with `page/limit/total/pages`

> ✅ This is the main endpoint students need to view their fee vouchers.

---

## 3) Exams (Student)
### 3.1 Student exam schedule
- **GET** `/student/schedule/exams`

**Mapping:** `src/constants/api-endpoints.js`
- `API_ENDPOINTS.STUDENT.SCHEDULE.EXAMS = "/student/schedule/exams"`

**Implementation status in current scan:**
- I could not find `src/app/api/student/schedule/exams/route.js` in this workspace.

### 3.2 Teacher/admin exam system endpoints (NOT included in this doc)
This workspace contains exam management + marks endpoints under `src/app/api/exams/...`, but as per your instruction:
- **This document intentionally excludes teacher/exam management endpoints.**

---

## Implementation checklist (for you)
1. Verify `/student/profile` implementation exists under `src/app/api/**`.
2. Verify whether `/student/profile` internally calls/uses any `/api/users/...` route.
3. Verify `/student/schedule/exams` route file exists and returns exam list for authenticated STUDENT.
4. Confirm which endpoints frontend calls from student UI.

