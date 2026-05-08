# Staff Attendance Self Check-in / Check-out

This folder adds self-service endpoints for authenticated staff.

## Endpoints
- `POST /api/staff-attendance/check-in`
  - Sets `staff_attendances.check_in = now()`
  - Sets `status = PRESENT`
  - Creates record for `{staff_id, date}` if missing
  - Fails if already checked in for today

- `POST /api/staff-attendance/check-out`
  - Requires a record exists for today
  - Requires `check_in` to be set
  - Sets `staff_attendances.check_out = now()`
  - Sets `status = PRESENT`
  - Fails if already checked out for today

## Notes
- `staff_id` is taken from `request.user.id`.
- `date` is server-side computed as today (`YYYY-MM-DD`) in ISO local/server time.

