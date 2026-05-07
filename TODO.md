# TODO

## Timetable: Student timetable API
- [ ] Fix `src/app/api/student/timetable/route.js` to use `TimeTable.periods` JSONB (instead of nonexistent `day/start_time/end_time/subject/teacher` columns)
- [ ] Parse periods, join subjectId -> Subject.name and teacherId -> User name/email
- [ ] Keep response shape `{ day, start_time, end_time, subject, teacher, class, section }`
- [ ] Validate `class_id` and `section_id` as UUID
- [ ] Sort by day order (Mon-Sat) then start_time
- [ ] Quick runtime check by calling endpoint (manual/terminal) if project has a test harness

