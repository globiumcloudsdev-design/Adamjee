import { NextResponse } from "next/server";
import { authenticate } from "@/backend/middleware/auth.middleware";
import { StaffAttendance, User, sequelize, Branch } from "@/backend/models/postgres";

function getTodayDateOnly() {
  // server-side: YYYY-MM-DD in local/server time
  return new Date().toISOString().split("T")[0];
}

async function staffCheckInHandler(request) {
  const transaction = await sequelize.transaction();
  try {
    // Authenticate the user
    const { user } = await authenticate(request);
    const staff_id = user.id;
    const date = getTodayDateOnly();

    // Parse body
    const body = await request.json();
    const { latitude, longitude, remarks } = body;

    // Ensure staff user exists
    const staff = await User.findByPk(staff_id, {
      transaction,
      include: [{ model: Branch, as: "branch" }],
    });

    if (!staff) {
      await transaction.rollback();
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const existing = await StaffAttendance.findOne({
      where: { staff_id, date },
      transaction,
    });

    if (existing) {
      // Already has check-in => do not overwrite
      if (existing.check_in) {
        await transaction.rollback();
        return NextResponse.json(
          { success: false, message: "Already checked in for this date" },
          { status: 400 }
        );
      }

      // Calculate late minutes if not set
      let lateMinutes = existing.late_minutes || 0;
      let status = existing.status || "PRESENT";

      if (!lateMinutes && staff.branch && staff.branch.expected_check_in_time) {
        const expectedTime = new Date(`${date}T${staff.branch.expected_check_in_time}`);
        const currentTime = new Date();
        const diffMinutes = Math.floor((currentTime - expectedTime) / 60000);
        if (diffMinutes > 0) {
          lateMinutes = diffMinutes;
          status = diffMinutes > 30 ? "LATE" : "PRESENT";
        }
      }

      await existing.update(
        {
          status: status,
          check_in: new Date(),
          late_minutes: lateMinutes,
          remarks: remarks || `Checked in at ${new Date().toLocaleTimeString()}`,
          updated_by: staff_id,
          marked_by: existing.marked_by ?? staff_id,
        },
        { transaction }
      );

      await transaction.commit();
      return NextResponse.json(
        { success: true, message: "Checked in successfully", data: existing },
        { status: 200 }
      );
    }

    // Calculate late minutes based on branch's expected check-in time
    let lateMinutes = 0;
    let status = "PRESENT";
    const currentTime = new Date();

    if (staff.branch && staff.branch.expected_check_in_time) {
      const expectedTime = new Date(`${date}T${staff.branch.expected_check_in_time}`);
      const diffMinutes = Math.floor((currentTime - expectedTime) / 60000);

      if (diffMinutes > 0) {
        lateMinutes = diffMinutes;
        status = diffMinutes > 30 ? "LATE" : "PRESENT";
      }
    }

    const attendance = await StaffAttendance.create(
      {
        staff_id,
        date,
        status: status,
        check_in: currentTime,
        check_out: null,
        late_minutes: lateMinutes,
        remarks: remarks || `Checked in at ${currentTime.toLocaleTimeString()}`,
        branch_id: staff.branch_id ?? null,
        marked_by: staff_id,
        updated_by: staff_id,
      },
      { transaction }
    );

    await transaction.commit();

    return NextResponse.json(
      {
        success: true,
        message: "Checked in successfully",
        data: {
          id: attendance.id,
          staff_id: attendance.staff_id,
          date: attendance.date,
          check_in: attendance.check_in,
          status: attendance.status,
          late_minutes: attendance.late_minutes,
          remarks: attendance.remarks,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Staff check-in error:", error);
    const message = error.message || "Failed to check in";
    return NextResponse.json(
      { success: false, message, error: message },
      { status: error.message?.includes("No token") || error.message?.includes("Invalid token") ? 401 : 500 }
    );
  }
}

export const POST = staffCheckInHandler;