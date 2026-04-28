import { NextResponse } from "next/server";
import { sequelize, User, StaffAttendance } from "@/backend/models/postgres";
import { Op } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware.js";

/**
 * POST /api/staff-attendance/holiday
 * Marks all staff/teachers as HOLIDAY for a specific date
 */
async function markHolidayHandler(request) {
    const transaction = await sequelize.transaction();
    try {
        const { date, reason, remarks, branch_id } = await request.json();

        if (!date) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        let finalBranchId = null;
        if (request.user.role === "BRANCH_ADMIN") {
            finalBranchId = request.user.branch_id;
        } else if (branch_id) {
            finalBranchId = branch_id;
        }

        // 1. Fetch all STAFF and TEACHER users
        const whereUser = {
            role: { [Op.in]: ["STAFF", "TEACHER"] },
            is_active: true
        };
        if (finalBranchId) {
            whereUser.branch_id = finalBranchId;
        }

        const employees = await User.findAll({
            where: whereUser,
            attributes: ['id', 'branch_id']
        });

        if (employees.length === 0) {
            await transaction.commit();
            return NextResponse.json({ success: true, message: "No employees found to mark holiday", count: 0 });
        }

        const holidayRemarks = reason ? `Holiday: ${reason}${remarks ? ` - ${remarks}` : ''}` : (remarks || "Holiday");

        // 2. Process each employee's attendance record
        for (const emp of employees) {
            const [record, created] = await StaffAttendance.findOrCreate({
                where: {
                    staff_id: emp.id,
                    date: date
                },
                defaults: {
                    staff_id: emp.id,
                    date: date,
                    status: "HOLIDAY",
                    remarks: holidayRemarks,
                    branch_id: emp.branch_id || finalBranchId,
                    marked_by: request.user.id,
                    check_in: null,
                    check_out: null
                },
                transaction
            });

            if (!created) {
                await record.update({
                    status: "HOLIDAY",
                    remarks: holidayRemarks,
                    check_in: null,
                    check_out: null,
                    marked_by: request.user.id
                }, { transaction });
            }
        }

        await transaction.commit();
        return NextResponse.json({ 
            success: true, 
            message: `Holiday successfully marked for ${employees.length} staff/teachers`, 
            count: employees.length 
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Holiday Marking Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export const POST = withAuth(markHolidayHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
