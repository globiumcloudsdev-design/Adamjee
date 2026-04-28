import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LeaveRequest, User, Attendance } from "@/backend/models/postgres";

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { student_id, branch_id, start_date, end_date, reason } = body;

    if (!student_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Student ID, Start Date and End Date are required" },
        { status: 400 }
      );
    }

    const finalBranchId = user.role === "BRANCH_ADMIN" ? user.branch_id : branch_id;
    if (!finalBranchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    const leave = await LeaveRequest.create({
      student_id,
      branch_id: finalBranchId,
      start_date,
      end_date,
      reason,
      status: "PENDING",
    });

    return NextResponse.json({
      success: true,
      message: "Leave request created successfully",
      data: leave,
    });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branch_id");
    const status = searchParams.get("status");

    const finalBranchId = user.role === "BRANCH_ADMIN" ? user.branch_id : branchId;

    const whereClause = {};
    if (finalBranchId) whereClause.branch_id = finalBranchId;
    if (status) whereClause.status = status;

    const leaveRequests = await LeaveRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "first_name", "last_name", "registration_no"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return NextResponse.json({
      success: true,
      data: leaveRequests,
    });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
