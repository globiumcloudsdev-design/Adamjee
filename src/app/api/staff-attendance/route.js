import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { StaffAttendance, User, Branch, sequelize } from "@/backend/models/postgres";

const ALLOWED_SORT_FIELDS = ["date", "status", "created_at"];

export async function listStaffAttendanceHandler(request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const branchId = searchParams.get("branch_id");
    const staffId = searchParams.get("staff_id");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = (searchParams.get("sortOrder") || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

    if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
        return NextResponse.json({ error: "Invalid sortBy field" }, { status: 400 });
    }

    const where = {};

    // Scope by branch for BRANCH_ADMIN
    if (request.user.role === "BRANCH_ADMIN") {
        where.branch_id = request.user.branch_id;
    } else if (branchId) {
        where.branch_id = branchId;
    }

    if (staffId) where.staff_id = staffId;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date[Op.gte] = dateFrom;
        if (dateTo) where.date[Op.lte] = dateTo;
    }

    try {
        const { rows, count } = await StaffAttendance.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortBy, sortOrder]],
            include: [
                {
                    model: User,
                    as: "staff",
                    attributes: ["id", "first_name", "last_name", "email", "role", "staff_sub_type"]
                },
                {
                    model: User,
                    as: "marker",
                    attributes: ["id", "first_name", "last_name"]
                },
                {
                    model: Branch,
                    as: "branch",
                    attributes: ["id", "name", "code"],
                    required: false
                },
            ],
        });

        return NextResponse.json({
            success: true,
            data: {
                attendances: rows,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit),
                },
            },
        });
    } catch (error) {
        console.error("Staff Attendance List Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch attendance" }, { status: 500 });
    }
}

export async function markStaffAttendanceHandler(request) {
    const body = await request.json();
    const { staff_id, date, status, check_in, check_out, remarks, branch_id } = body;

    if (!staff_id || !date || !status) {
        return NextResponse.json(
            { error: "staff_id, date and status are required" },
            { status: 400 }
        );
    }

    // Permission check for BRANCH_ADMIN: can only mark for their branch
    const finalBranchId = request.user.role === "BRANCH_ADMIN" ? request.user.branch_id : branch_id;

    try {
        // Check if staff exists
        const staff = await User.findByPk(staff_id);
        if (!staff) {
            return NextResponse.json({ error: "Staff not found" }, { status: 404 });
        }

        // Check if already marked
        const existing = await StaffAttendance.findOne({
            where: { staff_id, date }
        });

        if (existing) {
            return NextResponse.json({ error: "Attendance already marked for this staff on this date" }, { status: 400 });
        }

        const attendance = await StaffAttendance.create({
            staff_id,
            date,
            status,
            check_in,
            check_out,
            remarks,
            branch_id: finalBranchId,
            marked_by: request.user.id,
        });

        const createdAttendance = await StaffAttendance.findByPk(attendance.id, {
            include: [
                { model: User, as: "staff", attributes: ["id", "first_name", "last_name"] },
                { model: Branch, as: "branch", attributes: ["id", "name"] },
            ],
        });

        return NextResponse.json({ success: true, data: createdAttendance }, { status: 201 });
    } catch (error) {
        console.error("Staff Attendance Creation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to mark attendance" }, { status: 500 });
    }
}

export const GET = withAuth(listStaffAttendanceHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const POST = withAuth(markStaffAttendanceHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
