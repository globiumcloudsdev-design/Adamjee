import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Sequelize } from 'sequelize';
import pg from 'pg';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: console.log
});

// Import models to ensure they are registered
import AcademicYear from './src/backend/models/postgres/AcademicYear.model.js';
import Group from './src/backend/models/postgres/Group.model.js';
import Class from './src/backend/models/postgres/Class.model.js';
import Section from './src/backend/models/postgres/Section.model.js';
import Subject from './src/backend/models/postgres/Subject.model.js';
import Branch from './src/backend/models/postgres/Branch.model.js';
import User from './src/backend/models/postgres/User.model.js';
import Expense from './src/backend/models/postgres/Expense.model.js';
import Policy from './src/backend/models/postgres/Policy.model.js';
import StaffAttendance from './src/backend/models/postgres/StaffAttendance.model.js';
import Attendance from './src/backend/models/postgres/Attendance.model.js';
import Timetable from './src/backend/models/postgres/TimeTable.model.js';
import LeaveRequest from './src/backend/models/postgres/LeaveRequest.model.js';
import FeeVoucher from './src/backend/models/postgres/FeeVoucher.model.js';

const triggerSync = async () => {
  try {
    console.log("🔄 Starting Direct Alter Sync via NeonDB...");
    await sequelize.sync({ alter: true });
    console.log("✅ Direct Sync complete.");
    process.exit(0);
  } catch (e) {
    console.error("❌ Direct Sync failed:", e);
    process.exit(1);
  }
};

triggerSync();
