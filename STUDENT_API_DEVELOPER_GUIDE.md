# Student Dashboard API - Developer Integration Guide

## Overview

The Student Dashboard API provides complete access to student profile and dashboard data through a single enhanced endpoint. All endpoints are secured with JWT authentication and include comprehensive filtering and pagination support.

---

## Architecture

### Data Flow

```
Frontend/App
    ↓
Authentication (JWT Token)
    ↓
Student Endpoints
    ├→ /api/student/profile (Enhanced with dashboard)
    ├→ /api/student/dashboard
    ├→ /api/student/fees-vouchers
    ├→ /api/student/attendance
    ├→ /api/student/assignments
    ├→ /api/student/submissions
    ├→ /api/student/timetable
    └→ /api/exams
    ↓
Database
    ├→ Users (Student profiles)
    ├→ FeeVouchers (Payment records)
    ├→ Attendance (Daily records)
    ├→ Assignments (Assignment details)
    ├→ AssignmentSubmissions (Submission records)
    ├→ Timetables (Class schedules)
    └→ Exams (Exam schedules)
```

---

## Implementation Details

### 1. Enhanced Profile Endpoint

**File:** `src/app/api/student/profile/route.js`

**Key Features:**
- Aggregates data from multiple tables
- Calculates statistics in real-time
- Returns both profile and dashboard data
- Optimized for single API call

**Database Queries:**
```
SELECT * FROM users WHERE id = {studentId}
SELECT * FROM fee_vouchers WHERE student_id = {studentId}
SELECT * FROM attendances WHERE student_id = {studentId} AND date >= {30 days ago}
SELECT * FROM assignments WHERE class_id = {studentClass} AND section_id = {studentSection}
SELECT * FROM assignment_submissions WHERE student_id = {studentId}
```

**Calculation Logic:**
```javascript
// Fee Statistics
fees.total_due = SUM(amount_due)
fees.total_paid = SUM(paid_amount)
fees.total_remaining = total_due + total_fine - total_paid
fees.status_counts = COUNT grouped by status

// Attendance Percentage
attendance.percentage = (present_days / total_days - holidays) * 100

// Assignment Statistics
assignments.pending = total - submitted
assignments.approved = COUNT(status = 'APPROVED')
assignments.rejected = COUNT(status = 'REJECTED')
```

---

## API Specifications

### Authentication Header

All requests must include:
```
Authorization: Bearer {access_token}
```

Token Format: JWT (JSON Web Token)
- Obtained via `/api/auth/login`
- Valid for 24 hours (default)
- Refresh via `/api/auth/refresh`

### Response Format

**Success Response (200 OK):**
```json
{
  "success": true,
  "user": { ... },
  "dashboard": { ... }
}
```

**Error Response (4xx/5xx):**
```json
{
  "error": "Error message",
  "status": 400
}
```

### Content-Type

- Request: `application/json`
- Response: `application/json`

---

## Endpoint Details

### Profile API (Enhanced)

**Endpoint:** `GET /api/student/profile`

**Response Structure:**
```json
{
  "success": boolean,
  "user": {
    "id": "uuid",
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "phone": "string",
    "avatar_url": "string|null",
    "role": "STUDENT",
    "registration_no": "string",
    "is_active": boolean,
    "branch": {
      "id": "uuid",
      "name": "string",
      "code": "string"
    },
    "academic_info": {
      "class_id": "uuid",
      "class_name": "string",
      "section_id": "uuid",
      "section_name": "string",
      "roll_no": "string",
      "subjects": [
        {
          "id": "uuid",
          "name": "string"
        }
      ]
    }
  },
  "dashboard": {
    "fees": {
      "total_due": number,
      "total_paid": number,
      "total_fine": number,
      "total_remaining": number,
      "unpaid_count": number,
      "partial_count": number,
      "paid_count": number,
      "overdue_count": number
    },
    "attendance": {
      "total_days": number,
      "present_days": number,
      "absent_days": number,
      "late_days": number,
      "leave_days": number,
      "holiday_days": number,
      "percentage": number
    },
    "assignments": {
      "total": number,
      "submitted": number,
      "pending": number,
      "approved": number,
      "rejected": number
    }
  }
}
```

---

## Implementation Examples

### 1. Frontend - React Hooks

```jsx
import { useState, useEffect } from 'react';

function useStudentProfile(token) {
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/student/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setProfile(data.user);
        setDashboard(data.dashboard);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  return { profile, dashboard, loading, error };
}

// Usage in component
export function StudentDashboard() {
  const token = localStorage.getItem('accessToken');
  const { profile, dashboard, loading, error } = useStudentProfile(token);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <h1>{profile.first_name} {profile.last_name}</h1>
      
      <div className="stats">
        <div className="stat-card">
          <h3>Attendance</h3>
          <p className="percentage">{dashboard.attendance.percentage}%</p>
          <small>{dashboard.attendance.present_days} days present</small>
        </div>

        <div className="stat-card">
          <h3>Fees Due</h3>
          <p className="amount">Rs. {dashboard.fees.total_remaining}</p>
          <small>{dashboard.fees.unpaid_count} unpaid vouchers</small>
        </div>

        <div className="stat-card">
          <h3>Assignments</h3>
          <p className="count">{dashboard.assignments.submitted}/{dashboard.assignments.total}</p>
          <small>{dashboard.assignments.pending} pending</small>
        </div>
      </div>
    </div>
  );
}
```

### 2. Frontend - Axios

```javascript
import axios from 'axios';

class StudentProfileService {
  constructor(baseURL = 'http://localhost:3000') {
    this.api = axios.create({ baseURL });
  }

  setAuthToken(token) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async getProfile() {
    try {
      const response = await this.api.get('/api/student/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  }

  async getDashboard() {
    try {
      const response = await this.api.get('/api/student/dashboard');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      throw error;
    }
  }

  async getFees(filters = {}) {
    try {
      const response = await this.api.get('/api/student/fees-vouchers', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch fees:', error);
      throw error;
    }
  }

  async getAttendance(filters = {}) {
    try {
      const response = await this.api.get('/api/student/attendance', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      throw error;
    }
  }
}

// Usage
const service = new StudentProfileService();
service.setAuthToken(token);

const profileData = await service.getProfile();
const dashboardData = await service.getDashboard();
const feesData = await service.getFees({ status: 'UNPAID' });
```

### 3. Backend - Node.js/Express

```javascript
const express = require('express');
const axios = require('axios');

const router = express.Router();

// Proxy profile endpoint
router.get('/student-profile', async (req, res) => {
  try {
    const response = await axios.get(
      'http://localhost:3000/api/student/profile',
      {
        headers: {
          'Authorization': req.headers.authorization
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.message
    });
  }
});

module.exports = router;
```

### 4. Mobile - React Native

```javascript
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';

export function StudentDashboardScreen({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator />;

  return (
    <ScrollView>
      <Text style={styles.name}>
        {data.user.first_name} {data.user.last_name}
      </Text>

      <View style={styles.statsContainer}>
        <StatCard
          title="Attendance"
          value={`${data.dashboard.attendance.percentage}%`}
          subtitle={`${data.dashboard.attendance.present_days} days`}
        />
        <StatCard
          title="Fees"
          value={`Rs. ${data.dashboard.fees.total_remaining}`}
          subtitle={`${data.dashboard.fees.unpaid_count} pending`}
        />
        <StatCard
          title="Assignments"
          value={data.dashboard.assignments.submitted}
          subtitle={`of ${data.dashboard.assignments.total}`}
        />
      </View>
    </ScrollView>
  );
}
```

---

## Performance Considerations

### Query Optimization

**Current Implementation:**
- Uses single database transaction per request
- Aggregates counts in application layer
- Caches branch data

**Optimization Tips:**
```javascript
// Use database aggregation for large datasets
const feeStats = await FeeVoucher.findAll({
  where: { student_id: studentId },
  attributes: [
    'status',
    [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    [sequelize.fn('SUM', sequelize.col('amount_due')), 'total_due']
  ],
  group: ['status']
});

// Index frequently used columns
// CREATE INDEX idx_student_id ON fee_vouchers(student_id);
// CREATE INDEX idx_attendance_student ON attendances(student_id, date);
```

### Caching Strategy

```javascript
// Redis caching example
const redis = require('redis');
const client = redis.createClient();

async function getStudentProfileCached(studentId, token) {
  const cacheKey = `profile:${studentId}`;
  
  // Try cache first
  const cached = await client.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch from API
  const data = await getStudentProfile(studentId, token);

  // Cache for 5 minutes
  await client.setex(cacheKey, 300, JSON.stringify(data));

  return data;
}
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP'
});

router.get('/api/student/profile', limiter, handler);
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-login and get new token |
| 403 Forbidden | Insufficient permissions | Ensure user is STUDENT role |
| 404 Not Found | Student doesn't exist | Verify student ID exists |
| 500 Server Error | Database connection issue | Check database connection |

### Error Response Handling

```javascript
async function handleApiRequest(url, token) {
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        // Handle unauthorized
        refreshToken();
      } else if (response.status === 403) {
        // Handle forbidden
        showAccessDeniedMessage();
      } else if (response.status === 404) {
        // Handle not found
        showNotFoundMessage();
      } else {
        throw new Error(errorData.error);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}
```

---

## Security Best Practices

### Token Storage
```javascript
// ✅ GOOD: Use HttpOnly cookies (server-side)
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});

// ⚠️ CAUTION: localStorage (vulnerable to XSS)
localStorage.setItem('accessToken', token);
```

### Input Validation
```javascript
// Validate query parameters
const { page = 1, limit = 20 } = req.query;

if (isNaN(page) || page < 1) {
  return res.status(400).json({ error: 'Invalid page' });
}

if (isNaN(limit) || limit < 1 || limit > 100) {
  return res.status(400).json({ error: 'Invalid limit' });
}
```

### CORS Configuration
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## Testing & Validation

### Unit Tests
```javascript
describe('Student Profile API', () => {
  it('should return student profile with dashboard', async () => {
    const response = await request(app)
      .get('/api/student/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.dashboard).toBeDefined();
    expect(response.body.dashboard.fees).toBeDefined();
    expect(response.body.dashboard.attendance).toBeDefined();
  });

  it('should return 401 without token', async () => {
    const response = await request(app)
      .get('/api/student/profile');

    expect(response.status).toBe(401);
  });
});
```

### Integration Tests
```javascript
// See test-student-dashboard.js for full examples
```

---

## Troubleshooting

### Profile Returns Empty Dashboard
```javascript
// Check if student has records in dependent tables
SELECT COUNT(*) FROM fee_vouchers WHERE student_id = '{studentId}';
SELECT COUNT(*) FROM attendances WHERE student_id = '{studentId}';
SELECT COUNT(*) FROM assignments WHERE class_id = '{classId}';
```

### Attendance Percentage is 0
```javascript
// Ensure attendance records exist
SELECT * FROM attendances 
WHERE student_id = '{studentId}' 
AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### Fees Total Mismatch
```javascript
// Verify fee voucher calculations
SELECT 
  SUM(amount_due) as total_due,
  SUM(paid_amount) as total_paid,
  SUM(fine_amount) as total_fine
FROM fee_vouchers 
WHERE student_id = '{studentId}';
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-11 | Initial release with profile, dashboard, fees, attendance, assignments APIs |
| 1.1 | TBD | Add exam marks endpoint |
| 1.2 | TBD | Add performance analytics |

---

## Support

For issues or questions:
1. Check `STUDENT_PROFILE_API_DOCUMENTATION.md` for endpoint details
2. Review `test-student-dashboard.js` for working examples
3. Check backend logs: `docker logs app-server`
4. Check database for data availability

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-11  
**Status:** Production Ready
