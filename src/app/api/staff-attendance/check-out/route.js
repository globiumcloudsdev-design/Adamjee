import { NextResponse } from "next/server";
import { authenticate } from "@/backend/middleware/auth.middleware";
import { StaffAttendance, User, sequelize, Branch } from "@/backend/models/postgres";

function getTodayDateOnly() {
  return new Date().toISOString().split("T")[0];
}

async function staffCheckOutHandler(request) {
  const transaction = await sequelize.transaction();
  try {
    // Authenticate the user
    const { user } = await authenticate(request);
    const staff_id = user.id;
    const date = getTodayDateOnly();

    // Parse body
    const body = await request.json();
    const { latitude, longitude, remarks } = body;

    // Ensure staff exists
    const staff = await User.findByPk(staff_id, {
      transaction,
      include: [{ model: Branch, as: "branch" }],
    });

    if (!staff) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: "Staff not found" },
        { status: 404 }
      );
    }

    const attendance = await StaffAttendance.findOne({
      where: { staff_id, date },
      transaction,
    });

    if (!attendance) {
      await transaction.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "No check-in record found for today. Please check in first.",
        },
        { status: 400 }
      );
    }

    if (!attendance.check_in) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: "You must check in first" },
        { status: 400 }
      );
    }

    if (attendance.check_out) {
      await transaction.rollback();
      return NextResponse.json(
        {
          success: false,
          message: "Already checked out for this date",
          data: {
            check_in: attendance.check_in,
            check_out: attendance.check_out,
          },
        },
        { status: 400 }
      );
    }

    // Calculate overtime and early exit minutes
    const currentTime = new Date();
    let overtimeMinutes = 0;
    let earlyExitMinutes = 0;

    if (staff.branch && staff.branch.expected_check_out_time) {
      const expectedTime = new Date(`${date}T${staff.branch.expected_check_out_time}`);
      const diffMinutes = Math.floor((currentTime - expectedTime) / 60000);

      if (diffMinutes > 0) {
        overtimeMinutes = diffMinutes; // Worked extra
      } else if (diffMinutes < 0) {
        earlyExitMinutes = Math.abs(diffMinutes); // Left early
      }
    }

    // Calculate total working hours
    let totalWorkingMinutes = 0;
    if (attendance.check_in) {
      totalWorkingMinutes = Math.floor(
        (currentTime - new Date(attendance.check_in)) / 60000
      );
      // Subtract break time if any (assuming 60 minutes break)
      const breakMinutes = 60;
      totalWorkingMinutes = Math.max(0, totalWorkingMinutes - breakMinutes);
    }

    // Determine status based on early exit
    const newStatus = earlyExitMinutes > 30 ? "HALF_DAY" : attendance.status;

    // Update attendance record
    await attendance.update(
      {
        status: newStatus,
        check_out: currentTime,
        overtime_minutes: overtimeMinutes,
        early_exit_minutes: earlyExitMinutes,
        remarks: remarks
          ? `${attendance.remarks || ""} | Checked out: ${remarks}`
          : attendance.remarks,
        updated_by: staff_id,
        marked_by: attendance.marked_by ?? staff_id,
      },
      { transaction }
    );

    await transaction.commit();

    return NextResponse.json(
      {
        success: true,
        message: "Checked out successfully",
        data: {
          id: attendance.id,
          staff_id: attendance.staff_id,
          date: attendance.date,
          check_in: attendance.check_in,
          check_out: attendance.check_out,
          total_working_hours: `${Math.floor(totalWorkingMinutes / 60)} hours ${
            totalWorkingMinutes % 60
          } minutes`,
          overtime_minutes: attendance.overtime_minutes,
          early_exit_minutes: attendance.early_exit_minutes,
          status: attendance.status,
          remarks: attendance.remarks,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Staff check-out error:", error);
    const message = error.message || "Failed to check out";
    return NextResponse.json(
      { success: false, message, error: message },
      { status: error.message?.includes("No token") || error.message?.includes("Invalid token") ? 401 : 500 }
    );
  }
}

export const POST = staffCheckOutHandler;