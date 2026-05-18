# API Documentation

This document covers the authenticated teacher/staff API flow used for login and staff attendance.

## Authentication

Most endpoints require an `Authorization` header with a Bearer access token returned by `/api/auth/login`.

```http
Authorization: Bearer <accessToken>
```

The login endpoint also sets an HTTP-only `refreshToken` cookie.

---

## 1) Login

### `POST /api/auth/login`

Authenticates a user with email/registration number and password.

### Request Body

```json
{
  "login": "shoaibrazamemon@gmail.com",
  "password": "12345678"
}
```

`login` can be either the user email or registration number.

### Success Response

```json
{
  "success": true,
  "user": {
    "id": "...",
    "first_name": "Shoaib",
    "last_name": "Raza",
    "email": "shoaibrazamemon@gmail.com",
    "phone": "...",
    "registration_no": "TCH-...",
    "role": "TEACHER",
    "avatar_url": null,
    "is_active": true,
    "permissions": []
  },
  "accessToken": "<jwt>"
}
```

### Notes

- Returns `400` if `login` or `password` is missing.
- Returns `401` for invalid credentials or disabled accounts.
- Sets `refreshToken` cookie on success.

---

## 2) Current User

### `GET /api/auth/me`

Returns the authenticated user attached by the auth middleware.

### Headers

```http
Authorization: Bearer <accessToken>
```

### Success Response

```json
{
  "user": {
    "id": "...",
    "role": "TEACHER"
  }
}
```

---

## 3) Teacher Self Attendance Status

### `GET /api/staff-attendance/me/status`

Returns whether the authenticated staff member is checked in today and the current day record.

### Headers

```http
Authorization: Bearer <accessToken>
```

### Success Response

```json
{
  "success": true,
  "data": {
    "isCheckedIn": true,
    "todayRecord": {
      "id": "...",
      "date": "2026-05-18",
      "checkInTime": "2026-05-18T08:41:13.659Z",
      "checkOutTime": "2026-05-18T08:41:16.119Z",
      "totalHours": null,
      "location": null,
      "status": "present"
    }
  }
}
```

### Notes

- Allowed roles: `STAFF`, `TEACHER`, `SUPER_ADMIN`, `BRANCH_ADMIN`
- Returns `404` if the staff user cannot be found.

---

## 4) Teacher Self Attendance History

### `GET /api/staff-attendance/me/history`

Returns attendance history plus basic statistics for the authenticated staff member.

### Headers

```http
Authorization: Bearer <accessToken>
```

### Query Parameters

#### Monthly filter

```http
/api/staff-attendance/me/history?filterType=monthly&month=5&year=2026
```

#### Date filter

```http
/api/staff-attendance/me/history?filterType=date&date=2026-05-18
```

If filters are missing or invalid, the API falls back to the last 30 days.

### Success Response

```json
{
  "success": true,
  "data": {
    "statistics": {
      "presentDays": 3,
      "absentDays": 0,
      "lateDays": 0,
      "attendancePercentage": 100
    },
    "records": [
      {
        "id": "...",
        "date": "2026-05-18",
        "status": "present",
        "checkInTime": "2026-05-18T08:41:13.659Z",
        "checkOutTime": "2026-05-18T08:41:16.119Z",
        "workingHours": 0
      }
    ]
  }
}
```

### Notes

- Allowed roles: `STAFF`, `TEACHER`, `SUPER_ADMIN`, `BRANCH_ADMIN`
- Records are sorted by newest date first.

---

## 5) Check In

### `POST /api/staff-attendance/check-in`

Creates or updates today's attendance check-in for the authenticated staff member.

### Headers

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Request Body

```json
{
  "latitude": 24.8607,
  "longitude": 67.0011,
  "remarks": "Arrived at campus"
}
```

`latitude` and `longitude` are accepted by the endpoint, but the current implementation primarily stores attendance timestamps and remarks.

### Success Response

```json
{
  "success": true,
  "message": "Checked in successfully",
  "data": {
    "id": "...",
    "staff_id": "...",
    "date": "2026-05-18",
    "check_in": "2026-05-18T08:41:13.659Z",
    "status": "PRESENT",
    "late_minutes": 0,
    "remarks": "Checked in at 1:41:13 pm"
  }
}
```

### Common Errors

- `400` if already checked in for the day.
- `401` if the token is missing or invalid.
- `404` if the staff user cannot be found.

---

## 6) Check Out

### `POST /api/staff-attendance/check-out`

Marks the authenticated staff member as checked out for today.

### Headers

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Request Body

```json
{
  "latitude": 24.8607,
  "longitude": 67.0011,
  "remarks": "Leaving for the day"
}
```

### Success Response

```json
{
  "success": true,
  "message": "Checked out successfully",
  "data": {
    "id": "...",
    "staff_id": "...",
    "date": "2026-05-18",
    "check_in": "2026-05-18T08:41:13.659Z",
    "check_out": "2026-05-18T08:41:16.119Z",
    "total_working_hours": "0 hours 0 minutes",
    "overtime_minutes": 0,
    "early_exit_minutes": 0,
    "status": "PRESENT",
    "remarks": "..."
  }
}
```

### Common Errors

- `400` if there is no check-in record for today.
- `400` if the user has not checked in yet.
- `400` if the user already checked out.
- `401` if the token is missing or invalid.
- `404` if the staff user cannot be found.

---

## Quick Flow

1. Call `POST /api/auth/login`
2. Save `accessToken`
3. Use `Authorization: Bearer <accessToken>` for the staff attendance endpoints
4. Call `POST /api/staff-attendance/check-in`
5. Call `GET /api/staff-attendance/me/status` or `GET /api/staff-attendance/me/history`
6. Call `POST /api/staff-attendance/check-out`

---

## Tested Teacher Account

The following account was used during verification in this workspace:

- Email: `shoaibrazamemon@gmail.com`
- Password: `12345678`

Use this only in the local/test environment.
