# Assignment Enrollment Filtering & Timetable API - Implementation Guide

## Overview
This document describes the implementation of enrollment-based filtering for assignments and the enhanced student timetable API.

---

## 1. Assignment Enrollment Filtering Implementation

### What Changed
The Teacher Assignment API now enforces enrollment-based filtering. Students can **only view and submit assignments if they are enrolled in the relevant subject/class/section**.

### Modified Endpoints

#### 1.1 GET /api/assignments - List Assignments
**File:** `src/app/api/assignments/route.js`

**Changes:**
- For STUDENT role: Added post-fetch filtering
- Extracts enrolled subject IDs from `student.details.academic_info.subjects[].id`
- Filters assignments to show only those matching enrolled subjects

**Behavior:**
- Teachers/Admins: See all assignments for their branch/filter
- Students: See only assignments for subjects they're enrolled in

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Math Assignment 1",
      "subject_id": "uuid",
      "class_id": "uuid",
      "section_id": "uuid",
      "due_date": "2026-05-15",
      "submission_count": 5,
      "total_students": 20,
      "teacher": {
        "id": "uuid",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  ]
}
```

#### 1.2 GET /api/assignments/[id] - View Assignment Details
**File:** `src/app/api/assignments/[id]/route.js`

**Changes:**
- Added enrollment validation for STUDENT role
- Checks 4 conditions:
  1. Student enrolled in assignment's subject_id
  2. Student in same class_id
  3. Student in same section_id
  4. Student in same branch_id

**Response:**
- ✅ 200 OK: If all conditions pass
- ❌ 403 Forbidden: If enrollment check fails
- ❌ 404 Not Found: If assignment doesn't exist

**Example Error:**
```json
{
  "success": false,
  "error": "Forbidden"
}
```

#### 1.3 POST /api/assignments/[id]/submit - Submit Assignment
**File:** `src/app/api/assignments/[id]/submit/route.js`

**Changes:**
- Added enrollment validation before allowing submission
- Same 4-point validation as GET [id]

**Response:**
- ✅ 201 Created: Submission successful
- ❌ 403 Forbidden: Not enrolled in assignment's subject/class/section
- ❌ 400 Bad Request: Already submitted or invalid data

**Example Error:**
```json
{
  "error": "You are not enrolled in this assignment's subject/class/section"
}
```

### How Enrollment Works
Enrollment data is stored in the student's user record:

```javascript
// User.details.academic_info structure
{
  class_id: "uuid",           // Student's class
  section_id: "uuid",         // Student's section
  subjects: [                 // Array of enrolled subjects
    {
      id: "uuid",            // Subject ID
      name: "Mathematics",   // Subject name
      fee: 5000             // Subject fee
    },
    {
      id: "uuid",
      name: "Physics",
      fee: 4000
    }
  ],
  roll_no: "001",
  total_fee: 9000,
  discount: 1000,
  payable_fee: 8000
}
```

---

## 2. Student Timetable API Enhancement

### What Changed
The student timetable API now:
- **Auto-detects** student's class/section from their profile (for STUDENT role)
- Organizes periods by day and time
- Works with explicit class_id/section_id params (for TEACHER/ADMIN)

### Endpoint
**GET /api/student/timetable**

**File:** `src/app/api/student/timetable/route.js`

### Parameters

#### For STUDENT Role (Auto-detect)
```bash
GET /api/student/timetable
Authorization: Bearer <student-token>
```
- No parameters required
- Auto-fetches from `student.details.academic_info.class_id` and `section_id`

#### For TEACHER/ADMIN (Explicit)
```bash
GET /api/student/timetable?class_id=<uuid>&section_id=<uuid>
Authorization: Bearer <token>
```

### Response Format
```json
{
  "success": true,
  "message": "Timetable fetched successfully",
  "data": [
    {
      "id": "uuid-0",
      "day": "Monday",
      "start_time": "09:00",
      "end_time": "10:00",
      "subject": {
        "id": "uuid",
        "name": "Mathematics"
      },
      "teacher": {
        "id": "uuid",
        "name": "Mr. John Doe"
      },
      "class": {
        "id": "uuid",
        "name": "Class 10"
      },
      "section": {
        "id": "uuid",
        "name": "A"
      },
      "roomNumber": "101",
      "periodType": "Theory"
    }
  ]
}
```

### Error Responses

**Missing class_id or section_id (when not auto-detected):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "class_id": "class_id is required",
    "section_id": "section_id is required"
  }
}
```

**Invalid UUID format:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "class_id": "class_id must be a valid UUID"
  }
}
```

---

## 3. Testing

### Test Scripts Provided

#### 3.1 test-assignment-comprehensive.js
Tests assignment creation and filtering:
```bash
node test-assignment-comprehensive.js
```

**Tests:**
- ✅ Teacher can create assignments
- ✅ Teacher can view their assignments
- ✅ Assignments are stored with proper metadata
- ✅ Enrollment filtering structure is in place

#### 3.2 test-enrollment-assignment.js
Detailed enrollment filtering test:
```bash
node test-enrollment-assignment.js
```

**Tests:**
- ✅ Teacher creates assignment for specific subject/class/section
- ✅ Enrolled students can see assignment
- ✅ Non-enrolled students cannot see assignment (when subject enrollment is verified)

#### 3.3 test-student-timetable.js
Student timetable API test:
```bash
node test-student-timetable.js
```

**Tests:**
- ✅ Student auto-detects their class/section
- ✅ Timetable is fetched and organized by day
- ✅ Teacher can fetch any class timetable
- ✅ Data structure is valid

---

## 4. API Usage Examples

### Create Assignment (Teacher)
```bash
curl -X POST http://localhost:3000/api/assignments \
  -H "Authorization: Bearer <teacher-token>" \
  -H "Content-Type: application/json" \
  -d {
    "class_id": "uuid",
    "section_id": "uuid",
    "subject_id": "uuid",
    "title": "Math Assignment 1",
    "description": "Chapter 5-7",
    "due_date": "2026-05-15",
    "total_marks": 50,
    "is_active": true
  }
```

### Get Assignments (Student - Auto-filtered)
```bash
curl http://localhost:3000/api/assignments \
  -H "Authorization: Bearer <student-token>"
```
Response includes only assignments for student's enrolled subjects.

### View Assignment Details (Student - Enrollment Check)
```bash
curl http://localhost:3000/api/assignments/<assignment-id> \
  -H "Authorization: Bearer <student-token>"
```
Returns 403 if student is not enrolled in the assignment's subject.

### Submit Assignment (Student - Enrollment Check)
```bash
curl -X POST http://localhost:3000/api/assignments/<assignment-id>/submit \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d {
    "submission_text": "My answer",
    "submission_url": "https://...",
    "submission_public_id": "..."
  }
```

### Get Timetable (Student - Auto-detect)
```bash
curl http://localhost:3000/api/student/timetable \
  -H "Authorization: Bearer <student-token>"
```

### Get Timetable (Teacher - Explicit)
```bash
curl "http://localhost:3000/api/student/timetable?class_id=<uuid>&section_id=<uuid>" \
  -H "Authorization: Bearer <teacher-token>"
```

---

## 5. Implementation Notes

### No Breaking Changes
✅ All existing endpoints work unchanged
✅ Response formats preserved
✅ Routes unchanged
✅ Auth middleware unchanged
✅ Teachers/Admins completely unaffected

### Backward Compatibility
- Assignments can still be queried with filters
- Teachers/Admins see all assignments
- Students see filtered results automatically
- Error codes follow REST standards

### Performance
- POST-filtering for students (fetches all, filters in memory)
- Optimal for small enrollment counts
- Alternative: Use raw JSONB queries if performance needed

### Data Requirements
- Students must have `details.academic_info.subjects[]` populated
- Each subject must have `id` field
- Timetable periods must have all required fields

---

## 6. Troubleshooting

### Student sees no assignments
1. ✅ Check student has `details.academic_info.class_id` and `section_id`
2. ✅ Check student has `details.academic_info.subjects[].id` array
3. ✅ Verify assignment's `subject_id` matches student's enrolled subject

### Student gets 403 accessing assignment
1. ✅ Check student is enrolled in assignment's subject
2. ✅ Check student is in correct class and section
3. ✅ Check student is in correct branch

### Timetable returns empty
1. ✅ Check student has class_id and section_id in academic_info
2. ✅ Check timetables exist for that class/section in database
3. ✅ Check periods array is not empty

---

## 7. Future Enhancements

- Add subject-based filtering at query level (JSONB operators)
- Cache enrollment data for performance
- Add bulk enrollment import
- Assignment submission notifications
- Timetable conflict detection
- Export timetable as PDF/iCal

---

## Support

For issues or questions, check:
1. Test scripts output
2. Database enrollment records
3. Assignment-subject-class-section relationships
4. Student academic_info completeness
