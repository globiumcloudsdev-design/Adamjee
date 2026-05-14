import { NextResponse } from "next/server";
import { Op } from "sequelize";
import {
  sequelize,
  User,
  Branch,
} from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    const { searchParams } = new URL(req.url);
    const rollNo = searchParams.get("roll_no");
    const branchId = searchParams.get("branch_id") || searchParams.get("branchId");

    if (!rollNo || !rollNo.trim()) {
      return NextResponse.json([]);
    }

    const cleanRollNo = rollNo.trim().replace(/\s+/g, "");

    // --- Role-Based Filter ---
    let whereClause = { 
      role: "STUDENT",
      deleted_at: null
    };

    if (user.role === "BRANCH_ADMIN") {
      whereClause.branch_id = user.branch_id;
    } else if (user.role === "SUPER_ADMIN" && branchId) {
      whereClause.branch_id = branchId;
    }

    const academicYearId = searchParams.get("academic_year_id");
    const classId = searchParams.get("class_id");

    // Strict GR No (Roll No) search in JSONB
    whereClause[Op.and] = [
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.literal("details->'academic_info'->>'roll_no'"),
          " ",
          ""
        ),
        { [Op.iLike]: `%${cleanRollNo}%` }
      )
    ];

    // --- Academic Info Filtering ---
    const academicInfoFilter = {};
    let hasAcademicFilter = false;

    if (academicYearId) {
      academicInfoFilter.academic_year_id = academicYearId;
      hasAcademicFilter = true;
    }
    if (classId) {
      academicInfoFilter.class_id = classId;
      hasAcademicFilter = true;
    }

    if (hasAcademicFilter) {
      whereClause.details = {
        [Op.contains]: {
          academic_info: academicInfoFilter,
        },
      };
    }

    const students = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
        },
      ],
      attributes: { exclude: ["password_hash", "plain_password"] },
      limit: 50,
      order: [["created_at", "DESC"]],
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Student GR search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
