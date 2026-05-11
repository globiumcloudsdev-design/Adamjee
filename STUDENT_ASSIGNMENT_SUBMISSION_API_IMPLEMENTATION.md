# Student Assignment and Submission API Implementation

## Summary
This implementation adds student-focused assignment viewing and submission endpoints, supports super-admin setup for timetable and exams, and adds admin details on the login page.

## Implemented APIs

### 1. List Student Assignments
- Endpoint: `GET /api/student/assignments`
- Auth: `STUDENT`
- Query params:
  - `page` (default `1`)
  - `limit` (default `20`, max `100`)
  - `status` (`submitted | pending | overdue`)
  - `subject_id`
- Response:
  - Student-enrolled, active assignments for the logged-in student class/section.
  - Includes `submission_status` and current student's `submission` snapshot.

### 2. Get Student Assignment Detail
- Endpoint: `GET /api/student/assignments/:id`
- Auth: `STUDENT`
- Response:
  - Assignment detail with class/section/subject/teacher.
  - Current student's submission (if available).

### 3. Submit or Resubmit Assignment
- Endpoint: `POST /api/student/assignments/:id/submit`
- Auth: `STUDENT`
- Body:
```json
{
  "submission_text": "My answer",
  "submission_url": "https://...",
  "submission_public_id": "cloudinary_public_id"
}
```
- Rules:
  - Student must belong to matching branch/class/section and enrolled subject.
  - At least one of `submission_text` or `submission_url` is required.
  - If submission exists and is not graded, it updates (resubmission).
  - If already graded, update is blocked.

### 4. List Student Submissions
- Endpoint: `GET /api/student/submissions`
- Auth: `STUDENT`
- Query params:
  - `assignment_id`
  - `status`
- Response:
  - Student's own submissions with assignment + subject/class/section/teacher context.

## Existing API Fixes

### Assignment Creation Role Fix
- File: `src/app/api/assignments/route.js`
- Change:
  - `POST /api/assignments` now allows `TEACHER` in role guard to match existing business logic.

### Submission List Filter Fix
- File: `src/app/api/submissions/route.js`
- Changes:
  - Fixed teacher filtering to use `Op.in` correctly.
  - Added `STUDENT` access to list own submissions.

### Super Admin Timetable Creation Support
- File: `src/app/api/timetable/route.js`
- Changes:
  - `POST /api/timetable` now supports both `SUPER_ADMIN` and `BRANCH_ADMIN`.
  - For `SUPER_ADMIN`, `branch_id` is required in payload.

### Super Admin Exam Branch Fix
- File: `src/app/api/exams/route.js`
- Changes:
  - For `SUPER_ADMIN`, exam now uses `branch_id` from request body.
  - Added validation to ensure target branch is present.

## Login Page Admin Details

### Public Admin Details API
- Endpoint: `GET /api/auth/admin-details`
- Auth: Public
- Returns active `SUPER_ADMIN` and `BRANCH_ADMIN` basic details.

### Login UI Integration
- File: `src/app/login/page.js`
- Change:
  - Fetches `/api/auth/admin-details` and displays admin contact details in login card.

## Student Search by Email
Use:
- `GET /api/users/students?q=nomanirshad0324@gmail.com` with super-admin token.

## Test Script
A full flow script was added:
- File: `test-student-assignment-submission-superadmin.js`
- Covers:
  - super-admin login
  - student login
  - search student by email
  - super-admin creation flow for teacher/assignment/exam/timetable
  - student assignment list/detail/submit/list-submissions

Run:
```bash
node test-student-assignment-submission-superadmin.js
```

Optional env overrides:
- `BASE_URL`
- `SUPER_ADMIN_LOGIN`
- `SUPER_ADMIN_PASSWORD`
- `STUDENT_LOGIN`
- `STUDENT_PASSWORD`
