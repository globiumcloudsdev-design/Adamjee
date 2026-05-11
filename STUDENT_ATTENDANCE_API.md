# Student Attendance API — Implementation Guide

Overview
- Purpose: APIs to record, query, and manage student attendance (single + bulk + self check-in).
- Base path: `/api/attendances` and `/api/students/:studentId/attendances`
- Auth: Bearer token (JWT). Role-based checks: `admin`, `teacher`, `staff`, `student` (limited).

Model (Attendance record)
- `id` (uuid / integer)
- `studentId` (uuid)
- `date` (YYYY-MM-DD)
- `status` ("present" | "absent" | "late" | "excused")
- `checkInTime` (ISO timestamp, optional)
- `checkOutTime` (ISO timestamp, optional)
- `classId`, `sectionId`, `subjectId` (optional)
- `source` ("manual" | "self" | "system")
- `reason` (string, optional)
- `createdBy` (user id)
- `createdAt`, `updatedAt`, `deletedAt` (timestamps)

Validation rules
- `studentId`, `date`, and `status` are required for creation.
- `date` must be ISO date (YYYY-MM-DD).
- `status` allowed values: present, absent, late, excused.
- `checkInTime` / `checkOutTime` must be valid ISO timestamps and `checkOutTime` >= `checkInTime` when both provided.

Common responses
- Success create: `201 Created` with attendance object.
- Success read/list: `200 OK` with object or paginated list.
- Update: `200 OK` with updated object.
- Delete: `204 No Content` (or `200` with `{deleted: true}` for soft delete).
- Validation error: `400 Bad Request` with `{errors: [...]}`.
- Auth error: `401 Unauthorized`.
- Permission denied: `403 Forbidden`.
- Not found: `404 Not Found`.

Endpoints

1) Create attendance (single)
- POST `/api/attendances`
- Auth: `Bearer` (teacher/staff/admin)
- Body (JSON):
```
{
  "studentId": "uuid",
  "date": "2026-05-11",
  "status": "present",
  "checkInTime": "2026-05-11T08:10:00Z",
  "checkOutTime": "2026-05-11T12:00:00Z",
  "classId": "uuid",
  "sectionId": "uuid",
  "subjectId": "uuid",
  "source": "manual",
  "reason": "" 
}
```
- Response `201`:
```
{
  "id": 123,
  "studentId": "uuid",
  "date": "2026-05-11",
  "status": "present",
  "checkInTime": "2026-05-11T08:10:00Z",
  "checkOutTime": "2026-05-11T12:00:00Z",
  "createdBy": "user-uuid",
  "createdAt": "2026-05-11T08:10:12Z"
}
```

2) Update attendance
- PUT `/api/attendances/:id`
- Auth: `Bearer` (teacher/staff/admin)
- Body: any updatable fields (status, times, reason)
- Response `200` with updated object.

3) Get single attendance
- GET `/api/attendances/:id`
- Auth: `Bearer` (teachers/staff/admin; students can access their own records)
- Response `200` with object.

4) List / query attendances
- GET `/api/attendances`
- Auth: `Bearer` (teacher/staff/admin)
- Query params:
  - `studentId`, `classId`, `sectionId`, `subjectId`
  - `date` (exact) or `dateFrom` & `dateTo`
  - `status`
  - `page` (default 1), `limit` (default 25), `sort` (e.g., `date:desc`)
- Response `200`:
```
{
  "data": [ ...attendance objects... ],
  "meta": {"page":1,"limit":25,"total":234}
}
```

5) Delete attendance (soft)
- DELETE `/api/attendances/:id`
- Auth: `Bearer` (admin/staff)
- Response `204 No Content` or `200` with `{deleted: true}`.

6) Bulk attendance for a class (single date)
- POST `/api/attendances/bulk`
- Auth: `Bearer` (teacher/staff/admin)
- Body:
```
{
  "classId": "uuid",
  "sectionId": "uuid",
  "date": "2026-05-11",
  "records": [
    {"studentId":"s1","status":"present"},
    {"studentId":"s2","status":"absent","reason":"sick"}
  ]
}
```
- Response `200` with summary `{ created: X, updated: Y, errors: [...] }`.
- Behaviour: validate students belong to class/section; atomic vs partial configurable (recommend partial with errors returned).

7) Student attendance history
- GET `/api/students/:studentId/attendances`
- Auth: `Bearer` (admin/teacher/staff) or student themselves
- Query params: `dateFrom`, `dateTo`, `page`, `limit`
- Response `200` paginated list.

8) Self check-in (student mobile)
- POST `/api/attendances/checkin`
- Auth: `Bearer` (student)
- Body:
```
{ "studentId": "uuid", "timestamp": "2026-05-11T08:05:00Z", "deviceId": "device-123" }
```
- Behaviour: create or update today's attendance record (status -> `present`, set `checkInTime`). Rate-limit and anti-spoof checks recommended (geolocation or device binding).
- Response `201` or `200` with attendance.

9) Self check-out
- POST `/api/attendances/checkout`
- Auth: `Bearer` (student)
- Body: `{ "studentId": "uuid", "timestamp": "2026-05-11T12:05:00Z" }`
- Behaviour: update existing record's `checkOutTime`.

Error handling and edge cases
- Duplicate entry detection: if same `studentId` + `date` exists and `source` is `manual`, return `409 Conflict` or perform update based on `upsert` flag.
- Timezone: store timestamps in UTC; `date` should be local school date normalized server-side.
- Late/midnight crossing: if `checkInTime` is before `date` due to timezone, normalize.
- Concurrency: bulk operations should use transactions; return partial errors with per-record messages.

Security & permissions
- Only authorized roles can create/update for others.
- Students may only self-checkin/out for their own id.
- Audit: record `createdBy`, `updatedBy` and keep soft-deletes and `deletedAt`.

Implementation notes (Next.js / Node.js style handlers)
- Validate input with a schema (Joi, Zod) at controller layer.
- Use service layer to handle business rules (belonging checks, upsert logic, transaction for bulk).
- Emit events on attendance create/update for downstream workflows (notifications, fee/records).
- Tests: unit for validation and service logic; integration tests for route authorization and payload flows (see tests/* for examples).

Examples (curl)
- Create:
```
curl -X POST https://example.com/api/attendances \
 -H "Authorization: Bearer $TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"studentId":"s1","date":"2026-05-11","status":"present"}'
```

- Query student history:
```
curl -H "Authorization: Bearer $TOKEN" "https://example.com/api/students/s1/attendances?dateFrom=2026-05-01&dateTo=2026-05-31"
```

Tips and recommended defaults
- Pagination defaults: `page=1`, `limit=25`, max limit 200.
- Bulk endpoint should accept `upsert` boolean to decide create vs update.
- When storing `status`, prefer enums in DB to avoid inconsistent values.
- Provide webhook or message queue integration for real-time processing (attendance tallies, alerts).

Files to link for implementation (place implementation here in repo)
- Controller idea: `src/app/api/attendances/route.js` (or follow existing API patterns in `/src/app/api`)
- Tests reference: `test-student-attendance.js` (use to ensure parity with expected behaviours)

---

If you want, I can scaffold route handlers for these endpoints in `src/app/api/attendances` and `src/app/api/students/[studentId]/attendances` next.