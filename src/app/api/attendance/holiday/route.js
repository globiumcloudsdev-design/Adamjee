import { NextResponse } from "next/server";
import { sequelize, User, Attendance } from "@/backend/models/postgres";
import { Op } from "sequelize";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/attendance/holiday
 * Marks all students as HOLIDAY for a specific date & branch
 */
export async function POST(req) {
    const transaction = await sequelize.transaction();
    try {
        const user = await getCurrentUser(req);
        if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { date, reason, remarks, branch_id } = await req.json();

        if (!date) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        let finalBranchId = user.role === "BRANCH_ADMIN" ? user.branch_id : branch_id;

        if (!finalBranchId) {
            return NextResponse.json({ error: "Branch ID is required for students" }, { status: 400 });
        }

        // 1. Fetch all students in the branch
        const students = await User.findAll({
            where: {
                role: "STUDENT",
                branch_id: finalBranchId,
                is_active: true
            },
            attributes: ['id', 'branch_id']
        });

        if (students.length === 0) {
            await transaction.commit();
            return NextResponse.json({ success: true, message: "No students found in this branch to mark holiday", count: 0 });
        }

        const holidayRemarks = reason ? `Holiday: ${reason}${remarks ? ` - ${remarks}` : ''}` : (remarks || "Holiday");

        // 2. Process each student's attendance record
        for (const std of students) {
            const [record, created] = await Attendance.findOrCreate({
                where: {
                    student_id: std.id,
                    date: date
                },
                defaults: {
                    student_id: std.id,
                    date: date,
                    status: "HOLIDAY",
                    remarks: holidayRemarks,
                    branch_id: std.branch_id || finalBranchId,
                    marked_by: user.id
                },
                transaction
            });

            if (!created) {
                await record.update({
                    status: "HOLIDAY",
                    remarks: holidayRemarks,
                    marked_by: user.id
                }, { transaction });
            }
        }

        await transaction.commit();
        return NextResponse.json({ 
            success: true, 
            message: `Holiday marked for ${students.length} students successfully`, 
            count: students.length 
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Student Holiday marking error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
