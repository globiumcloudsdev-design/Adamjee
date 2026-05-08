import { NextResponse } from "next/server";
import { format } from "date-fns";
import { Op } from "sequelize";
import { getCurrentUser } from "@/lib/auth";
import { Attendance, User, Timetable, Section } from "@/backend/models/postgres";
import NotificationService from "@/backend/services/NotificationService";

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { branch_id } = await req.json();
    const finalBranchId = user.role === "BRANCH_ADMIN" ? user.branch_id : branch_id;

    if (!finalBranchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    const today = new Date();
    const dateStr = format(today, "yyyy-MM-dd");
    const dayName = format(today, "EEEE"); // e.g. "Monday"

    // 1. Get all students of this branch
    const students = await User.findAll({
      where: {
        branch_id: finalBranchId,
        role: "STUDENT",
        is_active: true,
      },
      attributes: ["id", "details", "first_name", "last_name"],
    });

    // 2. Get all timetables of this branch to identify active sections today
    const timetables = await Timetable.findAll({
      where: {
        branch_id: finalBranchId,
      },
    });

    // Map: section_id -> Set of subjectIds active today
    const activeSectionsToday = new Map();
    timetables.forEach(tt => {
      const periods = Array.isArray(tt.periods) ? tt.periods : [];
      periods.forEach(p => {
        if (p.day === dayName && p.subjectId) {
          if (!activeSectionsToday.has(tt.section_id)) {
            activeSectionsToday.set(tt.section_id, new Set());
          }
          activeSectionsToday.get(tt.section_id).add(String(p.subjectId));
        }
      });
    });

    // 3. Find students who SHOULD have been present today
    const studentsWithClassesToday = students.filter(student => {
      const subjects = student.details?.academic_info?.subjects || [];
      return subjects.some(s => {
        const activeSubjectsInThisSection = activeSectionsToday.get(String(s.section_id));
        return activeSubjectsInThisSection && activeSubjectsInThisSection.has(String(s.id));
      });
    });

    if (studentsWithClassesToday.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No students have scheduled classes for today.",
        processedCount: 0
      });
    }

    // 4. Check existing attendance for these students today
    const existingAttendances = await Attendance.findAll({
      where: {
        date: dateStr,
        student_id: studentsWithClassesToday.map(s => s.id),
      },
      attributes: ["student_id"],
    });

    const attendedStudentIds = new Set(existingAttendances.map(a => a.student_id));
    
    // 5. Identify students who are ABSENT (scheduled but no record)
    const absentStudents = studentsWithClassesToday.filter(s => !attendedStudentIds.has(s.id));

    if (absentStudents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All scheduled students already have attendance marked.",
        processedCount: 0
      });
    }

    // 6. Bulk Mark Absent
    const absentRecords = absentStudents.map(s => ({
      student_id: s.id,
      branch_id: finalBranchId,
      date: dateStr,
      status: "ABSENT",
      marked_by: user.id,
      remarks: "Auto-marked as absent (No class attendance recorded)"
    }));

    await Attendance.bulkCreate(absentRecords);

    // 7. Send Notifications
    (async () => {
      try {
        for (const s of absentStudents) {
          await NotificationService.sendToUsers([s.id], {
            title: "Today Absent Notification",
            message: `Your child ${s.first_name} ${s.last_name} was Absent Today.`,
            type: "attendance",
            branchId: finalBranchId,
            sentBy: user.id,
          });
        }
      } catch (err) {
        console.error("Auto-Absent Notification Error:", err);
      }
    })();

    return NextResponse.json({
      success: true,
      message: `Successfully processed auto-absent for ${absentStudents.length} students.`,
      processedCount: absentStudents.length,
      students: absentStudents.map(s => `${s.first_name} ${s.last_name}`)
    });

  } catch (error) {
    console.error("Auto-Mark Absent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
