import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { StaffAttendance, User } from "@/backend/models/postgres";

function getTodayDateOnly() {
  return new Date().toISOString().split("T")[0];
}

function mapStatusToUI(att) {
  const checkInTime = att?.check_in ?? null;
  const checkOutTime = att?.check_out ?? null;

  // UI expects lowercase status strings in history, but this status endpoint uses:
  // - isCheckedIn boolean
  // - todayRecord.checkInTime / checkOutTime
  const uiTodayRecord = att
    ? {
        id: att.id,
        date: att.date,
        checkInTime,
        checkOutTime,
        // Some screens show totalHours/workingHours; not stored currently.
        totalHours: att.check_in && att.check_out ? null : null,
        location: null,
        status: String(att.status || "PRESENT").toLowerCase(),
      }
    : null;

  return {
    isCheckedIn: Boolean(checkInTime),
    todayRecord: uiTodayRecord,
  };
}

async function staffMeStatusHandler(request) {
  try {
    const staff_id = request.user.id;
    const date = getTodayDateOnly();

    const staff = await User.findByPk(staff_id);
    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const attendance = await StaffAttendance.findOne({
      where: { staff_id, date },
      order: [["created_at", "DESC"]],
    });

    return NextResponse.json({ success: true, data: mapStatusToUI(attendance) }, { status: 200 });

  } catch (error) {
    console.error("Staff self status error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch status" }, { status: 500 });
  }
}

export const GET = withAuth(staffMeStatusHandler, ["STAFF", "TEACHER", "SUPER_ADMIN", "BRANCH_ADMIN"]);

