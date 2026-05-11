import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { User, Branch } from "@/backend/models/postgres";

export async function GET() {
  try {
    const admins = await User.findAll({
      where: {
        role: { [Op.in]: ["SUPER_ADMIN", "BRANCH_ADMIN"] },
        is_active: true,
      },
      attributes: [
        "id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "role",
        "branch_id",
      ],
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
          required: false,
        },
      ],
      order: [
        ["role", "ASC"],
        ["first_name", "ASC"],
      ],
    });

    return NextResponse.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch admin details" },
      { status: 500 },
    );
  }
}
