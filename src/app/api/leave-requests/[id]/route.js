import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LeaveRequest, Attendance } from "@/backend/models/postgres";

export async function PATCH(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be APPROVED or REJECTED." },
        { status: 400 }
      );
    }

    const leave = await LeaveRequest.findByPk(id);
    if (!leave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // For branch admins, ensure request belongs to their branch
    if (user.role === "BRANCH_ADMIN" && leave.branch_id !== user.branch_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    leave.status = status;
    leave.approved_by = user.id;
    await leave.save();

    // If approved, automatically mark attendance for that student as LEAVE for the date range
    if (status === "APPROVED") {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const attendanceRecords = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        attendanceRecords.push({
          student_id: leave.student_id,
          branch_id: leave.branch_id,
          date: dateStr,
          status: "LEAVE",
          marked_by: user.id,
          leave_request_id: leave.id,
        });
      }

      if (attendanceRecords.length > 0) {
        await Attendance.bulkCreate(attendanceRecords, {
          updateOnDuplicate: ["status", "marked_by", "leave_request_id"],
        });
      }

    }

    return NextResponse.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      data: leave,
    });
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
