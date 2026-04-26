import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { User, Branch } from "@/backend/models/postgres";

async function getStaffListHandler(request) {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branch_id");
    const role = searchParams.get("role"); // TEACHER or STAFF

    const where = {
        role: { [Op.in]: ["TEACHER", "STAFF"] }
    };

    if (role) {
        where.role = role;
    }

    // Branch scoping
    if (request.user.role === "BRANCH_ADMIN") {
        where.branch_id = request.user.branch_id;
    } else if (branchId) {
        where.branch_id = branchId;
    }

    try {
        const staff = await User.findAll({
            where,
            attributes: ["id", "first_name", "last_name", "email", "role", "staff_sub_type", "branch_id"],
            include: [
                { model: Branch, as: "branch", attributes: ["id", "name"], required: false }
            ],
            order: [["first_name", "ASC"]]
        });

        return NextResponse.json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error("Get Staff List Error:", error);
        return NextResponse.json({ error: "Failed to fetch staff list" }, { status: 500 });
    }
}

export const GET = withAuth(getStaffListHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
