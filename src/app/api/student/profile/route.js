import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { 
  User, 
  Branch, 
  FeeVoucher,
  Attendance,
  Assignment,
  AssignmentSubmission,
} from "@/backend/models/postgres";
import { uploadProfilePhoto, deleteFromCloudinary } from "@/backend/utils/cloudinary";
import { Op } from "sequelize";

/**
 * Student profile API with comprehensive dashboard data
 *
 * GET /api/student/profile
 * Returns complete student profile with:
 * - Personal information
 * - Academic details
 * - Fee status summary
 * - Attendance summary
 * - Assignment counts
 */

async function getStudentProfile(req) {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
        },
      ],
      attributes: {
        exclude: ["password_hash", "plain_password"],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get fee vouchers summary
    const feeVouchers = await FeeVoucher.findAll({
      where: { student_id: userId },
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

    // Get attendance summary (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendances = await Attendance.findAll({
      where: {
        student_id: userId,
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

    const attendancePercentage =
      attendanceStats.total_days > 0
        ? ((attendanceStats.present_days /
            (attendanceStats.total_days -
              attendanceStats.holiday_days)) *
            100).toFixed(2)
        : 0;

    // Get assignment stats
    const academicInfo = user.details?.academic_info || {};
    const enrolledSubjectIds = (academicInfo.subjects || [])
      .map((s) => s?.id)
      .filter(Boolean);

    const assignments = await Assignment.findAll({
      where: {
        branch_id: user.branch_id,
        class_id: academicInfo.class_id,
        section_id: academicInfo.section_id,
      },
      attributes: ["id"],
    });

    const assignmentIds = assignments.map((a) => a.id);

    const submissions = await AssignmentSubmission.findAll({
      where: {
        student_id: userId,
        assignment_id: { [Op.in]: assignmentIds || [] },
      },
      attributes: ["id", "status"],
    });

    const assignmentStats = {
      total: assignmentIds.length,
      submitted: submissions.length,
      pending: Math.max(0, assignmentIds.length - submissions.length),
      approved: submissions.filter((s) => s.status === "APPROVED").length,
      rejected: submissions.filter((s) => s.status === "REJECTED").length,
    };

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role: user.role,
          registration_no: user.registration_no,
          is_active: user.is_active,
          branch: user.branch,
          academic_info: academicInfo,
        },
        dashboard: {
          fees: feeStats,
          attendance: {
            ...attendanceStats,
            percentage: parseFloat(attendancePercentage),
          },
          assignments: assignmentStats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Student profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function updateStudentProfile(req) {
  try {
    const userId = req.user.id;
    const body = await req.json();

    const { first_name, last_name, email, phone, avatar, details, address } = body;

    const user = await User.findByPk(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData = {};

    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    // Merge details
    const currentDetails = user.details || {};
    const newDetails = { ...currentDetails };
    if (address) newDetails.address = address;
    if (details) Object.assign(newDetails, details);
    updateData.details = newDetails;

    // Avatar upload (expects data:image/... base64)
    if (avatar && typeof avatar === "string" && avatar.startsWith("data:image")) {
      if (user.avatar_public_id) {
        await deleteFromCloudinary(user.avatar_public_id).catch(console.error);
      }

      const uploadResult = await uploadProfilePhoto(avatar, userId);
      updateData.avatar_url = uploadResult.url;
      updateData.avatar_public_id = uploadResult.publicId;
    }

    await user.update(updateData);

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Student profile PUT error:", error);

    if (error?.name === "SequelizeUniqueConstraintError") {
      return NextResponse.json(
        { error: "Email or phone already in use" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStudentProfile, ["STUDENT"]);
export const PUT = withAuth(updateStudentProfile, ["STUDENT"]);

