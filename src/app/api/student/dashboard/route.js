import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  FeeVoucher,
  Attendance,
  User,
  Branch,
  Assignment,
  AssignmentSubmission,
} from "@/backend/models/postgres";
import { ROLES } from "@/constants/roles";
import { Op } from "sequelize";

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can access their own dashboard
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || user.id;

    // Verify student is accessing their own dashboard or is admin/teacher
    if (
      user.role === ROLES.STUDENT &&
      studentId !== user.id
    ) {
      return NextResponse.json(
        { error: "You can only access your own dashboard" },
        { status: 403 }
      );
    }

    // Get student info
    const student = await User.findByPk(studentId, {
      include: [{ model: Branch, as: "branch", attributes: ["id", "name"] }],
      attributes: {
        exclude: ["password_hash", "plain_password"],
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get fees overview
    const feeVouchers = await FeeVoucher.findAll({
      where: { student_id: studentId },
      attributes: [
        "id",
        "status",
        "amount_due",
        "paid_amount",
        "fine_amount",
        "due_date",
      ],
    });

    const feeStats = feeVouchers.reduce(
      (acc, voucher) => {
        const remaining =
          Number(voucher.amount_due) +
          Number(voucher.fine_amount || 0) -
          Number(voucher.paid_amount || 0);

        acc.total_due += Number(voucher.amount_due);
        acc.total_paid += Number(voucher.paid_amount);
        acc.total_fine += Number(voucher.fine_amount || 0);
        acc.total_remaining += remaining;

        if (voucher.status === "UNPAID") acc.unpaid_count += 1;
        if (voucher.status === "PARTIAL") acc.partial_count += 1;
        if (voucher.status === "PAID") acc.paid_count += 1;
        if (voucher.status === "OVERDUE") acc.overdue_count += 1;

        return acc;
      },
      {
        total_due: 0,
        total_paid: 0,
        total_fine: 0,
        total_remaining: 0,
        unpaid_count: 0,
        partial_count: 0,
        paid_count: 0,
        overdue_count: 0,
      }
    );

    // Get attendance overview (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendances = await Attendance.findAll({
      where: {
        student_id: studentId,
        date: {
          [Op.gte]: thirtyDaysAgo.toISOString().split("T")[0],
        },
      },
      attributes: ["status", "date"],
    });

    const attendanceStats = attendances.reduce(
      (acc, att) => {
        acc.total_days += 1;
        if (att.status === "PRESENT") acc.present_days += 1;
        if (att.status === "ABSENT") acc.absent_days += 1;
        if (att.status === "LATE") acc.late_days += 1;
        if (att.status === "LEAVE") acc.leave_days += 1;
        if (att.status === "HOLIDAY") acc.holiday_days += 1;

        return acc;
      },
      {
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        leave_days: 0,
        holiday_days: 0,
      }
    );

    const percentage =
      attendanceStats.total_days > 0
        ? ((attendanceStats.present_days /
            (attendanceStats.total_days -
              attendanceStats.holiday_days)) *
            100).toFixed(2)
        : 0;

    // Get pending fees count
    const upcomingFees = feeVouchers.filter(
      (v) => new Date(v.due_date) > new Date() && v.status !== "PAID"
    );

    // Get student assignment counts (pending/submitted/overdue)
    const academicInfo = student.details?.academic_info || {};
    const studentContext = {
      branchId: student.branch?.id || user.branch_id,
      classId: academicInfo.class_id || null,
      sectionId: academicInfo.section_id || null,
      enrolledSubjectIds: (academicInfo.subjects || [])
        .map((s) => s?.id)
        .filter(Boolean),
    };

    let assignmentCounts = {
      total: 0,
      pending: 0,
      submitted: 0,
      overdue: 0,
    };

    if (studentContext.classId && studentContext.sectionId && studentContext.branchId) {
      const where = {
        branch_id: studentContext.branchId,
        class_id: studentContext.classId,
        section_id: studentContext.sectionId,
        is_active: true,
      };

      if (studentContext.enrolledSubjectIds.length > 0) {
        where.subject_id = { [Op.in]: studentContext.enrolledSubjectIds };
      }

      const assignments = await Assignment.findAll({
        where,
        attributes: ["id", "due_date"],
      });

      const assignmentIds = assignments.map((a) => a.id);
      const submissions = assignmentIds.length
        ? await AssignmentSubmission.findAll({
            where: { assignment_id: { [Op.in]: assignmentIds }, student_id: studentId },
            attributes: ["assignment_id", "status"],
          })
        : [];

      const submissionMap = new Map(
        submissions.map((s) => [s.assignment_id, s])
      );

      const now = new Date();
      assignmentCounts.total = assignments.length;

      for (const a of assignments) {
        const submission = submissionMap.get(a.id);
        if (submission) {
          assignmentCounts.submitted += 1;
        } else {
          const isOverdue = new Date(a.due_date) < now;
          if (isOverdue) assignmentCounts.overdue += 1;
          else assignmentCounts.pending += 1;
        }
      }
    }


    return NextResponse.json(
      {
        success: true,
        data: {
          student: {
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            registration_no: student.registration_no,
            branch: student.branch,
            academic_info: student.details?.academic_info || {},
          },
          fees: {
            total_due: feeStats.total_due,
            total_paid: feeStats.total_paid,
            total_fine: feeStats.total_fine,
            total_remaining: feeStats.total_remaining,
            unpaid_vouchers: feeStats.unpaid_count,
            partial_vouchers: feeStats.partial_count,
            paid_vouchers: feeStats.paid_count,
            overdue_vouchers: feeStats.overdue_count,
            upcoming_dues: upcomingFees.length,
            vouchers_count: feeVouchers.length,
          },
          attendance: {
            total_days_marked: attendanceStats.total_days,
            present_days: attendanceStats.present_days,
            absent_days: attendanceStats.absent_days,
            late_days: attendanceStats.late_days,
            leave_days: attendanceStats.leave_days,
            holiday_days: attendanceStats.holiday_days,
            attendance_percentage: parseFloat(percentage),
            period: "last 30 days",
          },
          assignments: {
            no_of_assignments: assignmentCounts.total,
            pending: assignmentCounts.pending,
            submitted: assignmentCounts.submitted,
            overdue: assignmentCounts.overdue,
          },
          exams: {
            no_of_exams: 0,
            no_of_quizzes: 0,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
