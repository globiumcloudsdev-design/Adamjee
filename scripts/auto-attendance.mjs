/**
 * Auto-Attendance Script
 * This script marks employees as absent if they haven't marked attendance by 6 PM PKT.
 * Run this script via cron job: 0 18 * * * node scripts/auto-attendance.mjs
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables manually to avoid extra dependencies
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadEnv = (filePath) => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value;
      }
    });
  }
};

loadEnv(path.resolve(__dirname, '../.env.local'));
loadEnv(path.resolve(__dirname, '../.env'));

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Define Models (since we are running outside Next.js context, we might need to define them or import them carefully)
// To avoid issues with Next.js aliases and complex imports, we'll define simple versions or use the existing ones if possible.
// But importing from @/backend/... won't work here easily without extra setup.
// So we'll use standard mongoose model definitions.

const UserSchema = new mongoose.Schema({
  role: String,
  status: String,
  branchId: mongoose.Schema.Types.ObjectId,
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const AttendanceSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  branchId: mongoose.Schema.Types.ObjectId,
  date: Date,
  status: String,
  remarks: String,
  isManualEntry: Boolean,
  approvalStatus: String,
});
const EmployeeAttendance = mongoose.models.EmployeeAttendance || mongoose.model('EmployeeAttendance', AttendanceSchema);

const EventSchema = new mongoose.Schema({
  title: String,
  eventType: String,
  startDate: Date,
  endDate: Date,
  status: String,
});
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Get current time in Pakistan (UTC+5)
    const pktTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(new Date());

    const parts = {};
    pktTime.forEach(({ type, value }) => { parts[type] = value; });

    const today = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00.000Z`);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const dayOfWeek = new Date(`${parts.year}-${parts.month}-${parts.day}`).getDay();

    console.log(`Current PKT Date: ${parts.year}-${parts.month}-${parts.day}`);
    console.log(`Current PKT Hour: ${parts.hour}`);

    // 2. Check if it's Sunday
    if (dayOfWeek === 0) {
      console.log('Today is Sunday. Skipping auto-attendance.');
      process.exit(0);
    }

    // 3. Check if it's a holiday
    const holiday = await Event.findOne({
      eventType: 'holiday',
      startDate: { $lte: tomorrow },
      endDate: { $gte: today },
      status: { $ne: 'cancelled' }
    });

    if (holiday) {
      console.log(`Today is a holiday: ${holiday.title}. Skipping auto-attendance.`);
      process.exit(0);
    }

    // 4. Find all employees
    const employees = await User.find({
      role: { $in: ['teacher', 'staff', 'branch_admin'] },
      status: 'active'
    });

    console.log(`Found ${employees.length} active employees.`);

    let markedCount = 0;
    let skippedCount = 0;

    for (const employee of employees) {
      const existingAttendance = await EmployeeAttendance.findOne({
        userId: employee._id,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      });

      if (!existingAttendance) {
        await EmployeeAttendance.create({
          userId: employee._id,
          branchId: employee.branchId,
          date: today,
          status: 'absent',
          remarks: 'Automatically marked absent (No attendance recorded by 6 PM PKT)',
          isManualEntry: false,
          approvalStatus: 'approved'
        });
        markedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ Process completed.`);
    console.log(`Marked Absent: ${markedCount}`);
    console.log(`Already Marked: ${skippedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error running auto-attendance:', error);
    process.exit(1);
  }
}

run();
