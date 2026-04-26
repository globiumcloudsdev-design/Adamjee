# Teacher Mock Data

This folder contains centralized mock data for the teacher dashboard application.

## Structure

```
src/data/teacher/
├── students.js      # All student data organized by class code
├── assignments.js   # All assignment data organized by class code
├── classes.js       # All class data (imports students & assignments)
└── index.js         # Main export file with helper functions
```

## Usage

### Importing All Data

```javascript
import { mockClasses, mockStudents, mockAssignments } from "@/data/teacher";
```

### Importing Specific Data

```javascript
// Only classes
import { mockClasses } from "@/data/teacher/classes";

// Only students
import { mockStudents } from "@/data/teacher/students";

// Only assignments
import { mockAssignments } from "@/data/teacher/assignments";
```

### Using Helper Functions

```javascript
import {
  getStudentCount,
  getActiveAssignmentsCount,
  calculateAverageAttendance,
} from "@/data/teacher";

// Get student count for a class
const count = getStudentCount("MATH101"); // Returns 10

// Get active assignments count
const activeCount = getActiveAssignmentsCount("CS102"); // Returns number of active assignments

// Calculate average attendance
const avgAttendance = calculateAverageAttendance("PHY201"); // Returns calculated percentage
```

## Data Structure

### Classes (`mockClasses`)

Array of class objects with the following structure:

```javascript
{
  _id: "1",
  name: "Advanced Mathematics",
  code: "MATH101",
  subject: "Mathematics",
  grade: "10th",
  section: "A",
  studentCount: 10,
  attendanceRate: 94,
  schedule: [
    { day: "Monday", startTime: "11:00", endTime: "13:00" }
  ],
  room: "Room 101",
  semester: "Spring 2025",
  description: "...",
  lastTopic: "...",
  nextTopic: "...",
  assignments: [...],  // Imported from mockAssignments
  students: [...]      // Imported from mockStudents
}
```

### Students (`mockStudents`)

Object with class codes as keys, each containing an array of student objects:

```javascript
{
  MATH101: [
    {
      id: 1,
      name: "Ahmed Ali",
      roll: "101",
      attendance: "98%",
      email: "ahmed.ali@ease.edu",
      phone: "+92 300 1234567",
      performance: "Excellent",
      avatar: "AA",
      grade: "A+",
      behavior: "Outstanding",
      joinedDate: "Jan 2024",
      parentName: "Ali Khan",
      parentPhone: "+92 300 1234560",
    },
  ];
}
```

### Assignments (`mockAssignments`)

Object with class codes as keys, each containing an array of assignment objects:

```javascript
{
  MATH101: [
    {
      id: 1,
      title: "Algebra Problem Set 1",
      dueDate: "2025-12-25",
      status: "Active",
      submissions: 28,
      total: 32,
      type: "Homework",
      description: "...",
      maxPoints: 100,
    },
  ];
}
```

## Available Classes

Current mock data includes:

1. **MATH101** - Advanced Mathematics (10th Grade)
2. **PHY201** - Physics & Mechanics (11th Grade)
3. **CHEM301** - Organic Chemistry (12th Grade)
4. **CS102** - Computer Science (11th Grade)
5. **ENG201** - English Literature (10th Grade)
6. **BUS301** - Business Studies (12th Grade)
7. **BIO202** - Biology & Life Sciences (11th Grade)
8. **ISL101** - Islamic Studies (9th Grade)

## Notes

- All student data includes parent contact information
- All assignments include detailed descriptions and max points
- Student count in each class object is automatically set based on array length
- Attendance rates are calculated from student data where possible

## Future Enhancements

- Add more realistic grade distributions
- Include attendance history for each student
- Add submission details for assignments
- Include class performance analytics
