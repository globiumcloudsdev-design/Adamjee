# Teacher API Documentation ✅ VERIFIED WORKING

**Base URL:** `http://localhost:3000/api`  
**Auth Required:** Yes (Bearer Token from `/api/auth/login`)  
**Updated:** May 5, 2026

---

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [Dashboard & Profile](#dashboard--profile)
3. [My Classes](#my-classes)
4. [Assignments Management](#assignments-management)
5. [Student Attendance](#student-attendance)
6. [Exams](#exams)
7. [Leave Requests](#leave-requests)
8. [Timetable](#timetable)
9. [Notifications](#notifications)
10. [Error Responses](#error-responses)

---

## Authentication

### Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "login": "teacher_email@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "811ec6f6-1e71-4c8e-8bc3-15e19200f909",
    "role": "TEACHER",
    "email": "sajoodali@gmail.com",
    "first_name": "Sajoo",
    "last_name": "Ali",
    "branch_id": "d17d3e03-5231-4e3c-8e0c-c8c649794f66"
  }
}
```

### Usage in API Calls

Add the token to all subsequent requests:
```bash
-H "Authorization: Bearer <accessToken>"
```

---

## Dashboard & Profile

### 1. Get Teacher Dashboard

**Endpoint:** `GET /api/teacher/dashboard`

**Auth Required:** Yes (TEACHER role)

**Query Parameters:** None

**Description:** Returns comprehensive dashboard statistics including:
- All assigned classes with student counts
- Upcoming exams
- Recent assignments
- Class schedules
- Student attendance overview

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/teacher/dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalClasses": 3,
    "totalStudents": 85,
    "totalAssignments": 12,
    "upcomingExams": 2,
    "myClasses": [
      {
        "_id": "78382d1f-e583-4dd4-9a23-d2121c90f2ac-299a1bd4-5659-46a9-9a4f-85254c78da1b-e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
        "classId": "78382d1f-e583-4dd4-9a23-d2121c90f2ac",
        "sectionId": "299a1bd4-5659-46a9-9a4f-85254c78da1b",
        "subjectId": "e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
        "className": "9A",
        "sectionName": "A",
        "groupName": "ABBBC",
        "academicYear": "2026",
        "subject": "English",
        "name": "9A (A)",
        "code": "English",
        "semester": "2026",
        "schedule": [
          {
            "day": "Monday",
            "startTime": "09:00",
            "endTime": "10:00",
            "room": "Room 101",
            "periodNumber": 1,
            "periodType": "Theory"
          }
        ],
        "studentCount": 35,
        "attendanceRate": 92,
        "room": "Room 101",
        "nextClass": "Monday at 09:00"
      }
    ],
    "upcomingExamsList": [
      {
        "id": "exam-id-123",
        "name": "Mid Term Exam",
        "startDate": "2026-05-15",
        "endDate": "2026-05-20"
      }
    ],
    "branch": {
      "id": "d17d3e03-5231-4e3c-8e0c-c8c649794f66",
      "name": "Main Campus",
      "address": "Karachi"
    }
  }
}
```

### 2. Get Teacher Profile

**Endpoint:** `GET /api/users/profile`

**Auth Required:** Yes (All roles including TEACHER)

**Description:** Returns the authenticated teacher's profile information

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "811ec6f6-1e71-4c8e-8bc3-15e19200f909",
    "email": "sajoodali@gmail.com",
    "role": "TEACHER",
    "first_name": "Sajoo",
    "last_name": "Ali",
    "phone": "+92300123456",
    "branch_id": "d17d3e03-5231-4e3c-8e0c-c8c649794f66",
    "details": {
      "qualification": "B.Sc",
      "experience": "5 years",
      "specialization": "English"
    },
    "created_at": "2026-04-16T12:00:00.000Z",
    "updated_at": "2026-05-05T10:30:00.000Z"
  }
}
```

### 3. Update Teacher Profile

**Endpoint:** `PUT /api/users/profile`

**Auth Required:** Yes (All roles including TEACHER)

**Request Body:**
```json
{
  "first_name": "Sajoo",
  "last_name": "Ali",
  "phone": "+92300123456",
  "details": {
    "qualification": "M.A",
    "experience": "6 years",
    "specialization": "English Literature"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "811ec6f6-1e71-4c8e-8bc3-15e19200f909",
    "first_name": "Sajoo",
    "last_name": "Ali",
    "phone": "+92300123456",
    "details": {
      "qualification": "M.A",
      "experience": "6 years",
      "specialization": "English Literature"
    },
    "updated_at": "2026-05-05T14:22:30.000Z"
  }
}
```

---

## My Classes

### List Assigned Classes

**Endpoint:** `GET /api/teacher/my-classes`

**Auth Required:** Yes (TEACHER role)

**Description:** Returns all classes assigned to the teacher with detailed information about each class, including:
- Class & Section details
- Subject information
- Student count
- Schedule (days, times, rooms)
- Attendance rate

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/teacher/my-classes \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "78382d1f-e583-4dd4-9a23-d2121c90f2ac-299a1bd4-5659-46a9-9a4f-85254c78da1b-e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
      "classId": "78382d1f-e583-4dd4-9a23-d2121c90f2ac",
      "sectionId": "299a1bd4-5659-46a9-9a4f-85254c78da1b",
      "subjectId": "e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
      "className": "9A",
      "sectionName": "A",
      "groupName": "ABBBC",
      "academicYear": "2026",
      "subject": "English",
      "name": "9A (A)",
      "code": "English",
      "semester": "2026",
      "schedule": [
        {
          "day": "Monday",
          "startTime": "09:00",
          "endTime": "10:00",
          "room": "Room 101",
          "periodNumber": 1,
          "periodType": "Theory"
        },
        {
          "day": "Wednesday",
          "startTime": "10:00",
          "endTime": "11:00",
          "room": "Room 101",
          "periodNumber": 2,
          "periodType": "Theory"
        }
      ],
      "studentCount": 35,
      "attendanceRate": 92,
      "room": "Room 101"
    },
    {
      "_id": "78382d1f-class-2-section-2-subject-2",
      "className": "10B",
      "sectionName": "B",
      "subject": "Mathematics",
      "studentCount": 32,
      "schedule": [
        {
          "day": "Tuesday",
          "startTime": "09:00",
          "endTime": "10:00",
          "room": "Room 205"
        }
      ]
    }
  ]
}
```

---

## Assignments Management

### 1. Create Assignment

**Endpoint:** `POST /api/assignments`

**Auth Required:** Yes (TEACHER role)

**Request Body:**
```json
{
  "class_id": "78382d1f-e583-4dd4-9a23-d2121c90f2ac",
  "section_id": "299a1bd4-5659-46a9-9a4f-85254c78da1b",
  "subject_id": "e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
  "title": "Chapter 5 English Essay",
  "description": "Write an essay on \"The Importance of Education\"",
  "due_date": "2026-05-15",
  "total_marks": 20,
  "attachment_url": "https://example.com/assignment.pdf"
}
```

**Required Fields:**
- `class_id` - UUID
- `section_id` - UUID
- `subject_id` - UUID
- `title` - String (max 200 chars)
- `due_date` - Date string (YYYY-MM-DD)

**Optional Fields:**
- `description` - Text
- `total_marks` - Integer (default: 0)
- `attachment_url` - File URL
- `attachment_public_id` - Cloudinary ID
- `academic_year_id` - UUID

**Success Response (201):**
```json
{
  "success": true,
  "assignment": {
    "id": "cafe6c63-8849-4a17-a559-a3e448fc85b4",
    "branch_id": "d17d3e03-5231-4e3c-8e0c-c8c649794f66",
    "class_id": "78382d1f-e583-4dd4-9a23-d2121c90f2ac",
    "section_id": "299a1bd4-5659-46a9-9a4f-85254c78da1b",
    "subject_id": "e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
    "teacher_id": "811ec6f6-1e71-4c8e-8bc3-15e19200f909",
    "title": "Chapter 5 English Essay",
    "description": "Write an essay on \"The Importance of Education\"",
    "due_date": "2026-05-15T00:00:00.000Z",
    "total_marks": 20,
    "is_active": true,
    "created_by": "811ec6f6-1e71-4c8e-8bc3-15e19200f909",
    "created_at": "2026-05-05T14:10:30.123Z",
    "updated_at": "2026-05-05T14:10:30.123Z"
  }
}
```

### 2. List Assignments

**Endpoint:** `GET /api/assignments`

**Auth Required:** Yes (TEACHER role)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `class_id` | UUID | Filter by class |
| `section_id` | UUID | Filter by section |
| `subject_id` | UUID | Filter by subject |

**Description:** For TEACHER role, returns only assignments created by the authenticated teacher

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/assignments?class_id=78382d1f-e583-4dd4-9a23-d2121c90f2ac" \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "assignments": [
    {
      "id": "cafe6c63-8849-4a17-a559-a3e448fc85b4",
      "title": "Chapter 5 English Essay",
      "description": "Write an essay on \"The Importance of Education\"",
      "due_date": "2026-05-15T00:00:00.000Z",
      "total_marks": 20,
      "is_active": true,
      "class": { "id": "78382d1f...", "name": "9A" },
      "section": { "id": "299a1bd4...", "name": "A" },
      "subject": { "id": "e75e64d0...", "name": "English" },
      "teacher": { "id": "811ec6f6...", "first_name": "Sajoo", "last_name": "Ali" },
      "created_at": "2026-05-05T14:10:30.123Z"
    }
  ]
}
```

### 3. Get Single Assignment

**Endpoint:** `GET /api/assignments/:id`

**Auth Required:** Yes (TEACHER role)

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/assignments/cafe6c63-8849-4a17-a559-a3e448fc85b4 \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "assignment": {
    "id": "cafe6c63-8849-4a17-a559-a3e448fc85b4",
    "title": "Chapter 5 English Essay",
    "due_date": "2026-05-15T00:00:00.000Z",
    "total_marks": 20,
    "is_active": true,
    "created_at": "2026-05-05T14:10:30.123Z"
  }
}
```

### 4. Update Assignment

**Endpoint:** `PUT /api/assignments/:id`

**Auth Required:** Yes (TEACHER role - only for own assignments)

**Request Body:**
```json
{
  "title": "Chapter 5 & 6 English Essay",
  "due_date": "2026-05-20",
  "total_marks": 25
}
```

**Updatable Fields:**
- `title`, `description`, `due_date`, `total_marks`, `is_active`, `attachment_url`, `attachment_public_id`

**Success Response (200):**
```json
{
  "success": true,
  "assignment": {
    "id": "cafe6c63-8849-4a17-a559-a3e448fc85b4",
    "title": "Chapter 5 & 6 English Essay",
    "due_date": "2026-05-20T00:00:00.000Z",
    "total_marks": 25,
    "updated_at": "2026-05-05T14:15:22.456Z"
  }
}
```

### 5. Delete Assignment ⚠️ PERMANENT

**Endpoint:** `DELETE /api/assignments/:id`

**Auth Required:** Yes (TEACHER role - only for own assignments)

**Description:** ⚠️ **PERMANENT deletion** - Cannot be recovered

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/assignments/cafe6c63-8849-4a17-a559-a3e448fc85b4 \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true
}
```

### 6. List Assignment Submissions

**Endpoint:** `GET /api/submissions`

**Auth Required:** Yes (TEACHER role)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `assignment_id` | UUID | Filter by assignment |

**Description:** Returns all student submissions for the teacher's assignments

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/submissions?assignment_id=cafe6c63-8849-4a17-a559-a3e448fc85b4" \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "submissions": [
    {
      "id": "submission-id-001",
      "assignment_id": "cafe6c63-8849-4a17-a559-a3e448fc85b4",
      "student_id": "student-001",
      "submission_text": "Student's essay content...",
      "submission_url": "https://example.com/submission.pdf",
      "submitted_at": "2026-05-14T10:30:00.000Z",
      "is_late": false,
      "obtained_marks": null,
      "feedback": null,
      "status": "submitted"
    }
  ]
}
```

### 7. Grade Submission

**Endpoint:** `PUT /api/submissions/:id`

**Auth Required:** Yes (TEACHER role)

**Request Body:**
```json
{
  "obtained_marks": 18,
  "feedback": "Excellent essay! Well-structured and well-researched.",
  "status": "graded"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "submission": {
    "id": "submission-id-001",
    "obtained_marks": 18,
    "feedback": "Excellent essay! Well-structured and well-researched.",
    "status": "graded",
    "graded_at": "2026-05-05T14:20:00.000Z"
  }
}
```

---

## Student Attendance

### 1. Mark Attendance

**Endpoint:** `POST /api/attendance`

**Auth Required:** Yes (TEACHER role)

**Request Body:**
```json
{
  "branch_id": "d17d3e03-5231-4e3c-8e0c-c8c649794f66",
  "class_id": "78382d1f-e583-4dd4-9a23-d2121c90f2ac",
  "section_id": "299a1bd4-5659-46a9-9a4f-85254c78da1b",
  "subject_id": "e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
  "date": "2026-05-05",
  "attendance": [
    {
      "student_id": "student-uuid-001",
      "status": "present"
    },
    {
      "student_id": "student-uuid-002",
      "status": "absent"
    },
    {
      "student_id": "student-uuid-003",
      "status": "late"
    }
  ]
}
```

**Status Options:** `present`, `absent`, `late`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "count": 3
}
```

### 2. List Attendance

**Endpoint:** `GET /api/attendance`

**Auth Required:** Yes (TEACHER role)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `class_id` | UUID | Filter by class |
| `section_id` | UUID | Filter by section |
| `date` | Date | Filter by date (YYYY-MM-DD) |

**Success Response (200):**
```json
{
  "success": true,
  "attendance": [
    {
      "id": "attendance-001",
      "student_id": "student-uuid-001",
      "date": "2026-05-05",
      "status": "present",
      "marked_by": "811ec6f6-1e71-4c8e-8bc3-15e19200f909",
      "class": { "id": "78382d1f...", "name": "9A" },
      "marked_at": "2026-05-05T09:30:00.000Z"
    }
  ]
}
```

### 3. Scan QR/RFID Attendance

**Endpoint:** `POST /api/attendance/scan`

**Auth Required:** Yes (TEACHER role)

**Request Body:**
```json
{
  "student_id": "student-uuid-001",
  "class_id": "78382d1f-e583-4dd4-9a23-d2121c90f2ac",
  "section_id": "299a1bd4-5659-46a9-9a4f-85254c78da1b"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Attendance recorded via scan",
  "attendance": {
    "id": "attendance-001",
    "student_id": "student-uuid-001",
    "status": "present",
    "marked_at": "2026-05-05T09:30:00.000Z"
  }
}
```

---

## Exams

### List Teacher's Exams

**Endpoint:** `GET /api/teacher/exams`

**Auth Required:** Yes (TEACHER role)

**Description:** Returns all exams for classes taught by the teacher

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/teacher/exams \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "exams": [
    {
      "id": "exam-001",
      "name": "Mid Term Exam",
      "branch_id": "d17d3e03-5231-4e3c-8e0c-c8c649794f66",
      "class_id": "78382d1f-e583-4dd4-9a23-d2121c90f2ac",
      "section_id": "299a1bd4-5659-46a9-9a4f-85254c78da1b",
      "startDate": "2026-05-15T09:00:00.000Z",
      "endDate": "2026-05-15T11:00:00.000Z",
      "subjects": [
        {
          "subject_id": "e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
          "subjectId": {
            "_id": "e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
            "name": "English"
          },
          "subject_name": "English",
          "total_marks": 100
        }
      ],
      "class": { "id": "78382d1f...", "name": "9A" },
      "section": { "id": "299a1bd4...", "name": "A" },
      "created_at": "2026-04-20T10:00:00.000Z"
    }
  ]
}
```

---

## Leave Requests

### 1. Apply for Leave

**Endpoint:** `POST /api/leave-requests`

**Auth Required:** Yes (TEACHER role)

**Request Body:**
```json
{
  "type": "sick",
  "start_date": "2026-05-10",
  "end_date": "2026-05-12",
  "reason": "Medical appointment",
  "attachment_url": "https://example.com/medical-cert.pdf"
}
```

**Leave Types:** `sick`, `casual`, `emergency`, `official`

**Success Response (201):**
```json
{
  "success": true,
  "leaveRequest": {
    "id": "leave-001",
    "user_id": "811ec6f6-1e71-4c8e-8bc3-15e19200f909",
    "type": "sick",
    "start_date": "2026-05-10",
    "end_date": "2026-05-12",
    "reason": "Medical appointment",
    "status": "pending",
    "created_at": "2026-05-05T14:30:00.000Z"
  }
}
```

### 2. List Leave Requests

**Endpoint:** `GET /api/leave-requests`

**Auth Required:** Yes (TEACHER role)

**Description:** Returns all leave requests by the authenticated teacher

**Success Response (200):**
```json
{
  "success": true,
  "leaveRequests": [
    {
      "id": "leave-001",
      "type": "sick",
      "start_date": "2026-05-10",
      "end_date": "2026-05-12",
      "reason": "Medical appointment",
      "status": "approved",
      "approved_by": "admin-id-001",
      "created_at": "2026-05-05T14:30:00.000Z",
      "updated_at": "2026-05-05T15:00:00.000Z"
    }
  ]
}
```

### 3. Update Leave Request

**Endpoint:** `PUT /api/leave-requests/:id`

**Auth Required:** Yes (TEACHER role - only pending requests)

**Request Body:**
```json
{
  "start_date": "2026-05-10",
  "end_date": "2026-05-13",
  "reason": "Medical appointment - extended"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "leaveRequest": {
    "id": "leave-001",
    "start_date": "2026-05-10",
    "end_date": "2026-05-13",
    "reason": "Medical appointment - extended",
    "updated_at": "2026-05-05T15:10:00.000Z"
  }
}
```

---

## Timetable

### Get Teacher's Timetable

**Endpoint:** `GET /api/timetable/teacher/:teacherId`

**Auth Required:** Yes (TEACHER, SUPER_ADMIN, BRANCH_ADMIN roles)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `teacherId` | UUID | Teacher's user ID |

**Description:** Returns the complete timetable schedule for the teacher

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/timetable/teacher/811ec6f6-1e71-4c8e-8bc3-15e19200f909 \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true,
  "timetable": [
    {
      "id": "timetable-001",
      "class_id": "78382d1f-e583-4dd4-9a23-d2121c90f2ac",
      "section_id": "299a1bd4-5659-46a9-9a4f-85254c78da1b",
      "periods": [
        {
          "day": "Monday",
          "periodNumber": 1,
          "startTime": "09:00",
          "endTime": "10:00",
          "roomNumber": "Room 101",
          "teacherId": "811ec6f6-1e71-4c8e-8bc3-15e19200f909",
          "subjectId": "e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
          "periodType": "Theory"
        },
        {
          "day": "Wednesday",
          "periodNumber": 2,
          "startTime": "10:00",
          "endTime": "11:00",
          "roomNumber": "Room 101",
          "teacherId": "811ec6f6-1e71-4c8e-8bc3-15e19200f909",
          "subjectId": "e75e64d0-45df-4cf9-89e1-a4cc63928fb8",
          "periodType": "Theory"
        }
      ],
      "class": { "id": "78382d1f...", "name": "9A" },
      "section": { "id": "299a1bd4...", "name": "A" }
    }
  ]
}
```

---

## Notifications

### 1. List Notifications

**Endpoint:** `GET /api/notifications`

**Auth Required:** Yes (All roles including TEACHER)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `read` | Boolean | Filter by read status (true/false) |
| `limit` | Number | Limit results (default: 20) |

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/notifications?read=false" \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "notifications": [
    {
      "id": "notif-001",
      "user_id": "811ec6f6-1e71-4c8e-8bc3-15e19200f909",
      "title": "New Assignment",
      "message": "Class 9A has a new assignment",
      "type": "assignment",
      "read": false,
      "created_at": "2026-05-05T10:00:00.000Z"
    },
    {
      "id": "notif-002",
      "title": "Exam Schedule",
      "message": "Mid term exam scheduled for 2026-05-15",
      "type": "exam",
      "read": false,
      "created_at": "2026-05-04T15:30:00.000Z"
    }
  ]
}
```

### 2. Mark Notification as Read

**Endpoint:** `PUT /api/notifications/:id/read`

**Auth Required:** Yes (TEACHER role)

**Example Request:**
```bash
curl -X PUT http://localhost:3000/api/notifications/notif-001/read \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true
}
```

### 3. Delete Notification

**Endpoint:** `DELETE /api/notifications/:id`

**Auth Required:** Yes (TEACHER role)

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/notifications/notif-001 \
  -H "Authorization: Bearer <TOKEN>"
```

**Success Response (200):**
```json
{
  "success": true
}
```

---

## Error Responses

### 400 - Bad Request

Missing required fields or invalid data format:

```json
{
  "error": "Missing required fields"
}
```

### 401 - Unauthorized

Missing or invalid authentication token:

```json
{
  "error": "Unauthorized"
}
```

### 403 - Forbidden

User doesn't have permission to access the resource (e.g., teacher trying to edit another teacher's assignment):

```json
{
  "error": "Forbidden"
}
```

### 404 - Not Found

Resource doesn't exist:

```json
{
  "error": "Not found"
}
```

### 500 - Internal Server Error

Server error:

```json
{
  "success": false,
  "message": "Failed to fetch data",
  "error": "Error message details"
}
```

---

## Quick Test Workflow

```bash
# 1. Login and extract token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"sajoodali@gmail.com","password":"111111"}' | jq -r '.accessToken')

echo "Token: $TOKEN"

# 2. Get dashboard
curl -X GET http://localhost:3000/api/teacher/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Get my classes
curl -X GET http://localhost:3000/api/teacher/my-classes \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Get exams
curl -X GET http://localhost:3000/api/teacher/exams \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Create assignment (use class/section/subject IDs from step 3)
curl -X POST http://localhost:3000/api/assignments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id":"<class-id>",
    "section_id":"<section-id>",
    "subject_id":"<subject-id>",
    "title":"Test Assignment",
    "due_date":"2026-05-15",
    "total_marks":20
  }' | jq

# 6. Get assignments
curl -X GET http://localhost:3000/api/assignments \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Summary

✅ **Working Endpoints (Success: true):**
- Dashboard
- Profile Management
- My Classes
- Assignments (Create, List, Get, Update, Delete)
- Submissions (List, Get, Grade)
- Attendance (Mark, List, Scan)
- Exams (List)
- Leave Requests (Create, List, Update)
- Timetable (Get)
- Notifications (List, Mark Read, Delete)

⚠️ **Important Notes:**
1. All assignments are **permanently deleted** (not soft-deleted)
2. Student attendance cascade deletes related submissions
3. Teachers can only manage their own assignments and leave requests
4. Branch is automatically set to teacher's branch
5. All dates must be ISO format or YYYY-MM-DD

