import { NextResponse } from "next/server";
import { Class, Group, Section, AcademicYear, Branch, Subject } from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    const { name, group_id, branch_id, academic_year_id } = await req.json();

    const targetBranchId =
      user.role === "SUPER_ADMIN" ? branch_id : user.branch_id;

    // Uniqueness Check: Name must be unique within same Branch and Academic Year
    const existingClass = await Class.findOne({
      where: {
        name,
        branch_id: targetBranchId,
        academic_year_id: academic_year_id || null,
      },
    });

    if (existingClass) {
      return NextResponse.json(
        { error: `Class with name "${name}" already exists in this branch/session.` },
        { status: 400 },
      );
    }

    // Check if Group exists and is active
    const group = await Group.findByPk(group_id);
    if (!group || !group.is_active) {
      return NextResponse.json(
        { error: "Active Group is required" },
        { status: 400 },
      );
    }

    const newClass = await Class.create({
      name,
      group_id,
      branch_id: targetBranchId,
      academic_year_id: academic_year_id || null,
      created_by: user.id,
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const user = await getCurrentUser(req);
    const { searchParams } = new URL(req.url);
    const branchIdParam = searchParams.get("branch_id");

    // Role-based + query param filtering
    let where = {};
    if (user.role === "SUPER_ADMIN") {
      // Super Admin: can filter by branch_id query param, or see all
      if (branchIdParam) {
        where.branch_id = branchIdParam;
      }
    } else {
      // Branch Admin / Others: locked to their own branch
      where.branch_id = user.branch_id;
    }

    const classes = await Class.findAll({
      where,
      include: [
        { 
          model: Group, 
          as: "group", 
          attributes: ["id", "name"] 
        },
        { 
          model: Section, 
          as: "sections", 
          attributes: ["id", "name", "is_active"] 
        },
        {
          model: AcademicYear,
          as: "academic_year",
          attributes: ["id", "name", "is_current"]
        },
        {
          model: Subject,
          as: "subjects",
          attributes: ["id", "name", "subject_code"]
        },
        ...(user.role === "SUPER_ADMIN" ? [{
          model: Branch,
          as: "branch",
          attributes: ["id", "name"]
        }] : [])
      ],
      order: [["created_at", "DESC"]],
    });
    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
