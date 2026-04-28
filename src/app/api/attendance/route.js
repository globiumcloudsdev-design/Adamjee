import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { getCurrentUser } from "@/lib/auth";
import { Attendance, User, Branch } from "@/backend/models/postgres";

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { date, status, student_ids, attendances } = body;
    const branch_id = body.branch_id || body.branchId;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Determine final branch_id
    let finalBranchId = user.role === "BRANCH_ADMIN" ? user.branch_id : branch_id;


    if (!finalBranchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    let recordsToSave = [];
    const records = body.records;

    if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
      if (!status) {
        return NextResponse.json({ error: "Status is required for bulk attendance" }, { status: 400 });
      }
      recordsToSave = student_ids.map((studentId) => ({
        student_id: studentId,
        branch_id: finalBranchId,
        date,
        status: String(status).toUpperCase(),
        marked_by: user.id,
      }));
    } else if (attendances && Array.isArray(attendances) && attendances.length > 0) {
      recordsToSave = attendances.map((att) => ({
        student_id: att.student_id || att.studentId,
        branch_id: finalBranchId,
        date: att.date || date,
        status: String(att.status).toUpperCase(),
        remarks: att.remarks || null,
        marked_by: user.id,
      }));
    } else if (records && Array.isArray(records) && records.length > 0) {
      recordsToSave = records.map((att) => ({
        student_id: att.studentId || att.student_id,
        branch_id: finalBranchId,
        date: att.date || date,
        status: String(att.status).toUpperCase(),
        remarks: att.remarks || null,
        marked_by: user.id,
      }));

    } else {
      return NextResponse.json(
        { error: "Either student_ids, attendances, or records array is required" },
        { status: 400 }
      );
    }


    // Save attendances
    // Use bulkCreate with ignoreDuplicates so existing entries are not overwritten
    await Attendance.bulkCreate(recordsToSave, {
      ignoreDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: `Attendance successfully marked for ${recordsToSave.length} students`,
    });
  } catch (error) {
    console.error("Error marking student attendance:", error);
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
    const date = searchParams.get("date");
    const branchId = searchParams.get("branch_id") || searchParams.get("branchId");

    let finalBranchId = user.role === "BRANCH_ADMIN" ? user.branch_id : branchId;

    const whereClause = {};
    if (finalBranchId) whereClause.branch_id = finalBranchId;
    if (date) whereClause.date = date;

    const attendances = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "first_name", "last_name", "registration_no"],
        },
      ],
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function PUT(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { attendanceId, status, remarks } = body;

    if (!attendanceId || !status) {
      return NextResponse.json(
        { error: "Attendance ID and status are required" },
        { status: 400 }
      );
    }

    const attendance = await Attendance.findOne({ where: { id: attendanceId } });
    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // If branch admin, verify that the attendance record belongs to their branch
    if (user.role === "BRANCH_ADMIN" && attendance.branch_id !== user.branch_id) {
      return NextResponse.json(
        { error: "Unauthorized to edit this record" },
        { status: 403 }
      );
    }

    attendance.status = String(status).toUpperCase();
    if (remarks !== undefined) {
      attendance.remarks = remarks;
    }

    await attendance.save();

    return NextResponse.json({
      success: true,
      message: "Attendance status updated successfully",
      data: attendance
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
