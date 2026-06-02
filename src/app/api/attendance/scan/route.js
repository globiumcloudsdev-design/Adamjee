import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Attendance, User, Branch, FeeVoucher } from "@/backend/models/postgres";
import { Op } from "sequelize";
import NotificationService from "@/backend/services/NotificationService";

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { qr, date, attendanceType, subjectId, eventId, mode } = await req.json();

    if (!qr) {
      return NextResponse.json({ message: "GR No or QR Data is required" }, { status: 400 });
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

    // Find student by registration_no, id, or roll_no in details
    const sequelize = User.sequelize;
    const whereClause = {
      role: 'STUDENT',
      [Op.or]: []
    };

    if (user.role === 'BRANCH_ADMIN' && user.branch_id) {
      whereClause.branch_id = user.branch_id;
    }

    if (registrationNo) {
      whereClause[Op.or].push({ registration_no: registrationNo });
      
      // Search roll_no in details.student or details.academic_info
      whereClause[Op.or].push(
        sequelize.where(sequelize.cast(sequelize.json('details.student.roll_no'), 'text'), registrationNo),
        sequelize.where(sequelize.cast(sequelize.json('details.academic_info.roll_no'), 'text'), registrationNo)
      );
    }
    
    if (studentId) {
      whereClause[Op.or].push({ id: studentId });
    }

    // If both are null, we can't find the student
    if (whereClause[Op.or].length === 0) {
      return NextResponse.json({ message: "Invalid GR No or QR data" }, { status: 400 });
    }

    // Find student by registration_no or id
    const student = await User.findOne({
      where: whereClause,
      attributes: ['id', 'first_name', 'last_name', 'registration_no', 'details', 'branch_id', 'avatar_url'],
    });

    if (!student) {
      return NextResponse.json({ message: "Student not found with this GR No/Roll No" }, { status: 404 });
    }

    const todayDate = date || new Date().toISOString().split('T')[0];

    // Parallelize independent queries for maximum speed
    const [latestVoucher, existingAttendance, branch] = await Promise.all([
      FeeVoucher.findOne({
        where: { student_id: student.id },
        order: [['created_at', 'DESC']]
      }),
      Attendance.findOne({
        where: {
          student_id: student.id,
          date: todayDate,
          ...(subjectId && { subject_id: subjectId }),
          ...(eventId && { event_id: eventId }),
        }
      }),
      Branch.findByPk(student.branch_id, { attributes: ['id', 'name'] })
    ]);

    const feeInfo = {
      status: latestVoucher?.status || "UNPAID",
      amount_due: latestVoucher?.amount_due || 0,
      paid_amount: latestVoucher?.paid_amount || 0,
      outstanding: (latestVoucher?.amount_due || 0) - (latestVoucher?.paid_amount || 0),
      voucher_no: latestVoucher?.voucher_no || "N/A"
    };

    const studentData = {
      _id: student.id,
      id: student.id,
      fullName: `${student.first_name} ${student.last_name}`,
      first_name: student.first_name,
      last_name: student.last_name,
      registrationNumber: student.registration_no,
      rollNumber: student.details?.academic_info?.roll_no || student.details?.student?.roll_no,
      branchName: branch?.name || 'N/A',
      avatar_url: student.avatar_url,
      feeInfo: feeInfo,
      already_marked: !!existingAttendance
    };

    // If mode is 'check', return early with student info
    if (mode === 'check') {
      return NextResponse.json({
        success: true,
        data: {
          student: studentData,
          existingAttendance: !!existingAttendance
        }
      });
    }

    if (existingAttendance) {
      return NextResponse.json({
        success: true,
        message: "Attendance already marked",
        student: {
          ...studentData,
          already_marked: true
        }
      });
    }

    // Create attendance (this is the only sequential write)
    const attendance = await Attendance.create({
      student_id: student.id,
      branch_id: student.branch_id,
      date: todayDate,
      status: 'PRESENT',
      marked_by: user.id,
    });

    // Send notification asynchronously
    (async () => {
      try {
        await NotificationService.sendToUsers([student.id], {
          title: "Attendance Marked",
          message: `Your child ${student.first_name} has arrived at the coaching center and attendance is marked for ${todayDate}.`,
          type: "attendance",
          branchId: student.branch_id,
          sentBy: user.id
        });
      } catch (err) {
        console.error("Scan Attendance Notification Error:", err);
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        student: studentData,
        attendance
      }
    });

  } catch (error) {
    console.error("Error in scan attendance:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
