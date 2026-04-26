import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { Branch } from "@/backend/models/postgres";
import { User } from "@/backend/models/postgres";
// Side-effect: triggers associations (Branch.associate, User.associate)
import "@/backend/models/postgres/index.js";

// GET single branch
async function getBranchHandler(request, { params }) {
  const { id } = await params;
  const branch = await Branch.findByPk(id, {
    include: [
      {
        model: User,
        as: "admin",
        attributes: ["id", "first_name", "last_name", "email", "phone"],
        required: false,
      },
      {
        model: User,
        as: "creator",
        attributes: ["id", "first_name", "last_name"],
        required: false,
      },
      {
        model: User,
        as: "updater",
        attributes: ["id", "first_name", "last_name"],
        required: false,
      },
    ],
  });
  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, branch });
}

// UPDATE branch (PUT)
async function updateBranchHandler(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const branch = await Branch.findByPk(id);
  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }

  const allowed = [
    "name",
    "code",
    "address",
    "contact",
    "location",
    "bankAccounts",
    "settings",
    "is_active",
    "admin_id",
  ];
  allowed.forEach((field) => {
    if (body[field] !== undefined) branch[field] = body[field];
  });
  if (body.code) branch.code = body.code.toUpperCase();
  branch.updated_by = request.user.id;
  await branch.save();

  return NextResponse.json({ success: true, branch });
}

// DELETE branch (soft delete)
async function deleteBranchHandler(request, { params }) {
  const { id } = await params;
  const branch = await Branch.findByPk(id);
  if (!branch) {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }
  await branch.destroy();
  return NextResponse.json({ success: true, message: "Branch deleted" });
}

export const GET = withAuth(getBranchHandler, ["SUPER_ADMIN"]);
export const PUT = withAuth(updateBranchHandler, ["SUPER_ADMIN"]);
export const DELETE = withAuth(deleteBranchHandler, ["SUPER_ADMIN"]);
