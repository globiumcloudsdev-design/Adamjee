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
    const q = searchParams.get("q");
    const branchId = searchParams.get("branch_id") || searchParams.get("branchId");

    if (!q || !q.trim()) {
      return NextResponse.json([]);
    }

    const cleanQ = q.trim().replace(/\s+/g, "");
    const searchPattern = `%${cleanQ}%`;

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

    whereClause[Op.or] = [
      // 1. Name search (Ignore spaces)
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.fn(
            "concat",
            sequelize.col("first_name"),
            sequelize.col("last_name")
          ),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      // 2. Phone search (Ignore spaces/dashes)
      sequelize.where(
        sequelize.fn("replace", sequelize.col("phone"), " ", ""),
        { [Op.iLike]: searchPattern }
      ),
      // 3. Registration No / GR No (Ignore spaces)
      sequelize.where(
        sequelize.fn("replace", sequelize.col("registration_no"), " ", ""),
        { [Op.iLike]: searchPattern }
      ),
      // 4. Father Name (JSONB search, Ignore spaces)
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.literal("details->'academic_info'->'father'->>'name'"),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      // 5. Father Phone (JSONB search, Ignore spaces)
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.literal("details->'academic_info'->'father'->>'phone'"),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      // 6. Guardian Name (JSONB search, Ignore spaces)
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.literal("details->'academic_info'->'guardian'->>'name'"),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      // 7. Guardian Phone (JSONB search, Ignore spaces)
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.literal("details->'academic_info'->'guardian'->>'phone'"),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      // 8. Roll No (GR No)
      sequelize.where(
        sequelize.fn(
          "replace",
          sequelize.literal("details->'academic_info'->>'roll_no'"),
          " ",
          ""
        ),
        { [Op.iLike]: searchPattern }
      ),
      // 9. Email
      { email: { [Op.iLike]: `%${q.trim()}%` } },
    ];

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
      limit: 50, // Limit results for performance
      order: [["created_at", "DESC"]],
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Student search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
