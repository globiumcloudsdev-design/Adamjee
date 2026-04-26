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
import Expense from "./Expense.model.js";

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
};

export default models;
