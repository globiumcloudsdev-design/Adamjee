import { NextResponse } from "next/server";
import { Group } from "@/backend/models/postgres";
import { getCurrentUser } from "@/lib/auth";

// POST: Create Group
export async function POST(req) {
  try {
    const user = await getCurrentUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, description, branch_id, academic_year_id } = await req.json();

    let targetBranchId;
    if (user.role === "SUPER_ADMIN") {
      if (!branch_id)
        return NextResponse.json(
          { error: "Branch ID required for Super Admin" },
          { status: 400 },
        );
      targetBranchId = branch_id;
    } else if (user.role === "BRANCH_ADMIN") {
      targetBranchId = user.branch_id;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const group = await Group.create({
      name,
      description,
      branch_id: targetBranchId,
      academic_year_id: academic_year_id || null, // Optional
      created_by: user.id,
    });

    return NextResponse.json(group, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: List Groups (Filtered by Branch, supports ?branch_id= query param)
export async function GET(req) {
  const user = await getCurrentUser(req);
  const { searchParams } = new URL(req.url);
  const branchIdParam = searchParams.get("branch_id");

  let where = {};
  if (user.role === "SUPER_ADMIN") {
    // Super Admin: can filter by branch_id query param, or see all
    if (branchIdParam) {
      where.branch_id = branchIdParam;
    }
  } else {
    // Branch Admin: auto-locked to own branch
    where.branch_id = user.branch_id;
  }

  const groups = await Group.findAll({
    where,
    include: ["branch", "academic_year"],
    order: [["created_at", "DESC"]],
  });
  return NextResponse.json(groups);
}
