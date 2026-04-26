// Teacher Mock Data - Main Export File
export { mockClasses } from "./classes";
export { mockStudents } from "./students";
export { mockAssignments } from "./assignments";

// Helper function to get student count for a class
export const getStudentCount = (classCode) => {
  const students = mockStudents[classCode];
  return students ? students.length : 0;
};

// Helper function to get active assignments count
export const getActiveAssignmentsCount = (classCode) => {
  const assignments = mockAssignments[classCode];
  if (!assignments) return 0;
  return assignments.filter((a) => a.status === "Active").length;
};

// Helper function to calculate average attendance for a class
export const calculateAverageAttendance = (classCode) => {
  const students = mockStudents[classCode];
  if (!students || students.length === 0) return 0;

  const total = students.reduce((sum, student) => {
    const attendance = parseInt(student.attendance);
    return sum + attendance;
  }, 0);

  return Math.round(total / students.length);
};
