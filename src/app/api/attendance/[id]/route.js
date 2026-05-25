import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Attendance } from "@/backend/models/postgres";

export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "TEACHER", "STAFF"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const attendanceRecord = await Attendance.findByPk(id);
    if (!attendanceRecord) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    if (user.role === "BRANCH_ADMIN" && attendanceRecord.branch_id !== user.branch_id) {
      return NextResponse.json({ error: "Unauthorized access to this branch record" }, { status: 403 });
    }

    await attendanceRecord.destroy();

    return NextResponse.json({ success: true, message: "Attendance record deleted successfully" });
  } catch (error) {
    console.error("Delete Attendance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
