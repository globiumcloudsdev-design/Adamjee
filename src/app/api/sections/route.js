import { NextResponse } from "next/server";
import { Section, Class, Branch } from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    const { name, class_id, capacity } = await req.json();

    const targetClass = await Class.findByPk(class_id);
    if (!targetClass || !targetClass.is_active) {
      return NextResponse.json(
        { error: "Active Class is required" },
        { status: 400 },
      );
    }

    // Security check for Branch Admin
    if (
      user.role === "BRANCH_ADMIN" &&
      targetClass.branch_id !== user.branch_id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Uniqueness Check: Name must be unique within same Class
    const existingSection = await Section.findOne({
      where: { name, class_id },
    });

    if (existingSection) {
      return NextResponse.json(
        { error: `Section "${name}" already exists in this class.` },
        { status: 400 },
      );
    }

    const section = await Section.create({
      name,
      class_id,
      capacity: capacity || 40,
      created_by: user.id,
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");

    const where = {};
    if (classId) where.class_id = classId;

    const include = [
      {
        model: Class,
        as: "class",
        attributes: ["id", "name", "branch_id"],
        include: [
          {
            model: Branch,
            as: "branch",
            attributes: ["id", "name"]
          }
        ]
      },
    ];

    if (user.role === "BRANCH_ADMIN") {
      include[0].where = { branch_id: user.branch_id };
    }

    const sections = await Section.findAll({
      where,
      include,
      order: [["name", "ASC"]],
    });

    return NextResponse.json(sections);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}