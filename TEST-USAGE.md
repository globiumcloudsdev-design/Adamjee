# Assignment Delete API Test - Usage Guide

## Quick Start

### 1. Configure Environment

Create a `.env` file or add to your existing `.env.local`:

```bash
# Required
TEACHER_EMAIL=teacher@example.com
TEACHER_PASSWORD=your_password

# Optional
NEXT_PUBLIC_API_URL=http://localhost:3000
ASSIGNMENT_ID=specific-uuid-here  # If not provided, first assignment will be used
```

### 2. List Teacher's Assignments (Optional - Find IDs First)

```bash
npm run test:assignments:list
```

This will display all assignments for the teacher with their IDs.

### 3. Run Delete Test

```bash
npm run test:assignment:delete
```

The script will:
- Login as teacher
- Fetch assignments list
- Select an assignment to delete (first one or specified by `ASSIGNMENT_ID`)
- Delete the assignment via DELETE `/api/assignments/:id`
- Verify the assignment is gone (expects 404)

## Test Script Details

- **File:** `test-assignment-delete.js`
- **Framework:** Native Node.js (ESM) with `fetch` API
- **Output:** Colored console output with test step breakdown
- **Exit Codes:**
  - `0` = Test passed
  - `1` = Test failed

## Test Flow

1. **TEST 1:** Validate environment variables
2. **TEST 2:** Teacher login (POST `/api/auth/login`)
3. **TEST 3:** Fetch assignments (GET `/api/assignments`)
4. **TEST 4:** Delete assignment (DELETE `/api/assignments/:id`)
5. **TEST 5:** Verify deletion (GET `/api/assignments/:id` expects 404)

## API Permissions Required

The teacher must be the creator of the assignment. The delete endpoint enforces:
- `TEACHER.teacher_id === currentUser.id` (owner check)
- Or `SUPER_ADMIN` / `BRANCH_ADMIN` roles

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No token provided" | Check teacher credentials (email/password) |
| "Forbidden" | Teacher must own the assignment |
| "Not found" | Assignment ID doesn't exist |
| Connection refused | Ensure API server is running on `NEXT_PUBLIC_API_URL` |
