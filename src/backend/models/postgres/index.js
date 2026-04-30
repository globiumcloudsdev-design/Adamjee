import sequelize from "../../config/database.js";
import AcademicYear from "./AcademicYear.model.js";
import Group from "./Group.model.js";
import Class from "./Class.model.js";
import Section from "./Section.model.js";
import Subject from "./Subject.model.js";
import Branch from "./Branch.model.js";
import User from "./User.model.js";
import Policy from "./Policy.model.js";
import StaffAttendance from "./StaffAttendance.model.js";
import Attendance from "./Attendance.model.js";
import Expense from "./Expense.model.js";
import Timetable from "./TimeTable.model.js";
import LeaveRequest from "./LeaveRequest.model.js";
import FeeVoucher from "./FeeVoucher.model.js";
import Exam from "./Exam.model.js";
import ExamMark from "./ExamMark.model.js";

const models = {
  AcademicYear,
  Group,
  Class,
  Section,
  Subject,
  Branch,
  User,
  Expense,
  Policy,
  StaffAttendance,
  Attendance,
  Timetable,
  LeaveRequest,
  FeeVoucher,
  Exam,
  ExamMark,
};


// Run associations
Object.values(models).forEach((model) => {
  if (model.associate) model.associate(models);
});


export {
  sequelize,
  models,
  AcademicYear,
  Group,
  Class,
  Section,
  Subject,
  Branch,
  User,
  Expense,
  Policy,
  StaffAttendance,
  Attendance,
  Timetable,
  LeaveRequest,
  FeeVoucher,
  Exam,
  ExamMark,
};


export default models;
