import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { StaffAttendance, User, Branch, sequelize } from "@/backend/models/postgres";

async function getAttendanceReportHandler(request) {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branch_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const staffType = searchParams.get("staff_type"); // e.g., TEACHER, STAFF

    const where = {};

    // Scope by branch for BRANCH_ADMIN
    if (request.user.role === "BRANCH_ADMIN") {
        where.branch_id = request.user.branch_id;
    } else if (branchId) {
        where.branch_id = branchId;
    }

    if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date[Op.gte] = dateFrom;
        if (dateTo) where.date[Op.lte] = dateTo;
    }

    const staffWhere = {
        role: { [Op.in]: ["TEACHER", "STAFF"] }
    };
    if (staffType) {
        staffWhere.role = staffType;
    }

    try {
        const attendances = await StaffAttendance.findAll({
            where,
            include: [
                {
                    model: User,
                    as: "staff",
                    attributes: ["id", "first_name", "last_name", "role", "staff_sub_type"],
                    where: staffWhere
                }
            ]
        });

        // Group by staff_id
        const staffStats = {};

        attendances.forEach(att => {
            const sId = att.staff_id;
            if (!staffStats[sId]) {
                staffStats[sId] = {
                    staff_id: sId,
                    name: `${att.staff.first_name} ${att.staff.last_name}`,
                    role: att.staff.role,
                    sub_type: att.staff.staff_sub_type,
                    PRESENT: 0,
                    ABSENT: 0,
                    LATE: 0,
                    LEAVE: 0,
                    HOLIDAY: 0,
                    WEEKEND: 0,
                    HALF_DAY: 0,
                    total: 0
                };
            }
            staffStats[sId][att.status]++;
            staffStats[sId].total++;
        });

        const reportData = Object.values(staffStats).map(stat => ({
            ...stat,
            attendance_percentage: stat.total > 0 ? (((stat.PRESENT + stat.LATE + stat.HALF_DAY) / stat.total) * 100).toFixed(2) : "0.00"
        }));

        // Overall summary
        const summary = {
            TOTAL_STAFF: reportData.length,
            PRESENT: attendances.filter(a => a.status === 'PRESENT').length,
            ABSENT: attendances.filter(a => a.status === 'ABSENT').length,
            LATE: attendances.filter(a => a.status === 'LATE').length,
            LEAVE: attendances.filter(a => a.status === 'LEAVE').length,
            HALF_DAY: attendances.filter(a => a.status === 'HALF_DAY').length,
        };

        return NextResponse.json({
            success: true,
            data: {
                staff_wise: reportData,
                summary
            }
        });
    } catch (error) {
        console.error("Staff Attendance Report Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
    }
}

export const GET = withAuth(getAttendanceReportHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
