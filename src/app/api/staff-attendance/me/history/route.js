import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";

function getTodayDateOnly() {
  return new Date().toISOString().split("T")[0];
}

function startOfMonth(year, month1to12) {
  const d = new Date(year, month1to12 - 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(year, month1to12) {
  const d = new Date(year, month1to12, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toDateOnly(d) {
  return d.toISOString().split("T")[0];
}

function computeWorkingHours(att) {
  // Currently we only store check_in/check_out timestamps.
  if (!att?.check_in || !att?.check_out) return null;
  const diffMs = new Date(att.check_out) - new Date(att.check_in);
  const hours = diffMs / (1000 * 60 * 60);
  return Math.max(0, Math.round(hours * 10) / 10);
}

function mapAttendanceToUI(att) {
  const checkInTime = att?.check_in ?? null;
  const checkOutTime = att?.check_out ?? null;

  return {
    id: att.id,
    date: att.date,
    status: String(att.status || "PRESENT").toLowerCase(),
    checkInTime,
    checkOutTime,
    workingHours: computeWorkingHours(att),
  };
}

async function staffMeHistoryHandler(request) {
  try {
    const { Op } = await import('sequelize');
    const { StaffAttendance } = await import('@/backend/models/postgres');

    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get("filterType") || "monthly";

    const staff_id = request.user.id;

    // Parse filters (UI sends month/year for monthly, date for date)
    const month = parseInt(searchParams.get("month") || "0", 10);
    const year = parseInt(searchParams.get("year") || "0", 10);
    const date = searchParams.get("date") || null;

    const where = { staff_id };

    if (filterType === "date" && date) {
      where.date = date;
    } else if (filterType === "monthly" && month && year) {
      const from = startOfMonth(year, month);
      const to = endOfMonth(year, month);
      where.date = {
        [Op.gte]: toDateOnly(from),
        [Op.lte]: toDateOnly(to),
      };
    } else {
      // fallback: last 30 days
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      where.date = {
        [Op.gte]: toDateOnly(start),
        [Op.lte]: toDateOnly(end),
      };
    }

    const attendances = await StaffAttendance.findAll({
      where,
      order: [["date", "DESC"], ["created_at", "DESC"]],
    });

    // basic stats for UI
    const total = attendances.length || 0;
    const presentDays = attendances.filter((a) => String(a.status).toUpperCase() === "PRESENT").length;
    const absentDays = attendances.filter((a) => String(a.status).toUpperCase() === "ABSENT").length;
    const lateDays = attendances.filter((a) => String(a.status).toUpperCase() === "LATE").length;
    const attendancePercentage = total === 0 ? 0 : Math.round((presentDays / total) * 100);

    return NextResponse.json(
      {
        success: true,
        data: {
          statistics: {
            presentDays,
            absentDays,
            lateDays,
            attendancePercentage,
          },
          records: attendances.map(mapAttendanceToUI),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Staff self attendance history error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch history" }, { status: 500 });
  }
}

export const GET = withAuth(staffMeHistoryHandler, ["STAFF", "TEACHER", "SUPER_ADMIN", "BRANCH_ADMIN"]);

