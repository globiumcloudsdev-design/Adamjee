import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Attendance, User, Branch } from "@/backend/models/postgres";
import { Op } from "sequelize";

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { qr, date, attendanceType, subjectId, eventId } = await req.json();

    if (!qr) {
      return NextResponse.json({ error: "QR Data is required" }, { status: 400 });
    }

    let qrData = qr;
    let studentId = null;
    let registrationNo = null;

    // Handle JSON formatted QR data
    if (typeof qr === 'string' && qr.startsWith('{') && qr.endsWith('}')) {
      try {
        const parsed = JSON.parse(qr);
        studentId = parsed.id || null;
        registrationNo = parsed.registrationNumber || parsed.registration_no || null;
      } catch (e) {
        // Not JSON, treat as raw string
        registrationNo = qr;
      }
    } else {
      registrationNo = qr;
      // If it looks like a UUID, also try it as studentId
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(qr)) {
        studentId = qr;
      }
    }

    // Find student by registration_no or id
    const whereClause = {
      role: 'STUDENT',
      [Op.or]: []
    };

    if (registrationNo) {
      whereClause[Op.or].push({ registration_no: registrationNo });
    }
    
    if (studentId) {
      whereClause[Op.or].push({ id: studentId });
    }

    // If both are null, we can't find the student
    if (whereClause[Op.or].length === 0) {
      return NextResponse.json({ error: "Invalid QR data" }, { status: 400 });
    }

    const student = await User.findOne({
      where: whereClause,
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const todayDate = date || new Date().toISOString().split('T')[0];

    // Check if attendance already marked for today/subject/event
    const existingAttendance = await Attendance.findOne({
      where: {
        student_id: student.id,
        date: todayDate,
        // If it's a specific type, check for that
        ...(subjectId && { subject_id: subjectId }),
        ...(eventId && { event_id: eventId }),
      }
    });

    if (existingAttendance) {
      return NextResponse.json({
        success: true,
        message: "Attendance already marked",
        student: {
          _id: student.id,
          id: student.id,
          fullName: `${student.first_name} ${student.last_name}`,
          first_name: student.first_name,
          last_name: student.last_name,
          registrationNumber: student.registration_no,
          rollNumber: student.details?.academic_info?.roll_no || student.details?.student?.roll_no,
          branchName: student.branch?.name,
          avatar_url: student.avatar_url,
          already_marked: true
        }
      });
    }

    // Create attendance
    const attendance = await Attendance.create({
      student_id: student.id,
      branch_id: student.branch_id,
      date: todayDate,
      status: 'PRESENT',
      marked_by: user.id,
      // Add more context if needed
    });

    return NextResponse.json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        student: {
          _id: student.id,
          id: student.id,
          fullName: `${student.first_name} ${student.last_name}`,
          first_name: student.first_name,
          last_name: student.last_name,
          registrationNumber: student.registration_no,
          rollNumber: student.details?.academic_info?.roll_no || student.details?.student?.roll_no,
          branchName: student.branch?.name,
          avatar_url: student.avatar_url
        },
        attendance
      }
    });

  } catch (error) {
    console.error("Error in scan attendance:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
