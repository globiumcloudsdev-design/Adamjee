import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { StaffAttendance, User, Branch } from "@/backend/models/postgres";

async function getAttendanceHandler(request, { params }) {
    const { id } = await params;

    try {
        const attendance = await StaffAttendance.findByPk(id, {
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
                    model: User,
                    as: "updater",
                    attributes: ["id", "first_name", "last_name"]
                },
                {
                    model: Branch,
                    as: "branch",
                    attributes: ["id", "name", "code"]
                },
            ],
        });

        if (!attendance) {
            return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
        }

        // Auth check for BRANCH_ADMIN
        if (request.user.role === "BRANCH_ADMIN" && attendance.branch_id !== request.user.branch_id) {
            return NextResponse.json({ error: "Unauthorized access to this branch record" }, { status: 403 });
        }

        return NextResponse.json({ success: true, data: attendance });
    } catch (error) {
        console.error("Get Staff Attendance Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch attendance record" }, { status: 500 });
    }
}

async function updateAttendanceHandler(request, { params }) {
    const { id } = await params;
    const body = await request.json();
    const { status, check_in, check_out, remarks, late_minutes, early_exit_minutes, overtime_minutes } = body;

    try {
        const attendance = await StaffAttendance.findByPk(id);

        if (!attendance) {
            return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
        }

        // Auth check for BRANCH_ADMIN
        if (request.user.role === "BRANCH_ADMIN" && attendance.branch_id !== request.user.branch_id) {
            return NextResponse.json({ error: "Unauthorized access to this branch record" }, { status: 403 });
        }

        await attendance.update({
            status,
            check_in: (String(status).toUpperCase() === 'ABSENT' || String(status).toUpperCase() === 'LEAVE') ? null : check_in,
            check_out: (String(status).toUpperCase() === 'ABSENT' || String(status).toUpperCase() === 'LEAVE') ? null : check_out,

            remarks,
            late_minutes,
            early_exit_minutes,
            overtime_minutes,
            updated_by: request.user.id,
        });

        const updated = await StaffAttendance.findByPk(id, {
            include: [
                { model: User, as: "staff", attributes: ["id", "first_name", "last_name"] },
                { model: Branch, as: "branch", attributes: ["id", "name"] },
            ],
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Staff Attendance Error:", error);
        return NextResponse.json({ error: error.message || "Failed to update attendance" }, { status: 500 });
    }
}

async function deleteAttendanceHandler(request, { params }) {
    const { id } = await params;

    try {
        const attendance = await StaffAttendance.findByPk(id);

        if (!attendance) {
            return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
        }

        // Auth check for BRANCH_ADMIN
        if (request.user.role === "BRANCH_ADMIN" && attendance.branch_id !== request.user.branch_id) {
            return NextResponse.json({ error: "Unauthorized access to this branch record" }, { status: 403 });
        }

        await attendance.destroy();

        return NextResponse.json({ success: true, message: "Attendance record deleted successfully" });
    } catch (error) {
        console.error("Delete Staff Attendance Error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete attendance" }, { status: 500 });
    }
}

export const GET = withAuth(getAttendanceHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const PUT = withAuth(updateAttendanceHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const DELETE = withAuth(deleteAttendanceHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
