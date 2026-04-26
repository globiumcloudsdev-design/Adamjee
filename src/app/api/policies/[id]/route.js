import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Policy, User, Branch, sequelize } from "@/backend/models/postgres";

function ensurePolicyAccess(user, policy) {
  if (!policy) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return Boolean(policy.branch_id) && policy.branch_id === user.branch_id;
}

async function getPolicyHandler(request, { params }) {
  const { id } = await params;

  const policy = await Policy.findByPk(id, {
    include: [
      { model: User, as: "creator", attributes: ["id", "first_name", "last_name"] },
      { model: User, as: "updater", attributes: ["id", "first_name", "last_name"] },
      { model: Branch, as: "branch", attributes: ["id", "name", "code"], required: false },
    ],
  });

  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  if (!ensurePolicyAccess(request.user, policy)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json({ success: true, policy });
}

async function updatePolicyHandler(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  const policy = await Policy.findByPk(id);
  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  if (!ensurePolicyAccess(request.user, policy)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (request.user.role === "BRANCH_ADMIN" && body.branch_id && body.branch_id !== request.user.branch_id) {
    return NextResponse.json({ error: "Branch admin cannot move policy to another branch" }, { status: 403 });
  }

  const transaction = await sequelize.transaction();
  try {
    const allowedFields = ["policy_type", "policy_name", "description", "config", "is_active", "branch_id"];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        policy[field] = body[field];
      }
    });

    if (request.user.role === "BRANCH_ADMIN") {
      policy.branch_id = request.user.branch_id;
    }

    policy.updated_by = request.user.id;
    await policy.save({ transaction });

    await transaction.commit();

    const updatedPolicy = await Policy.findByPk(policy.id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "first_name", "last_name"] },
        { model: User, as: "updater", attributes: ["id", "first_name", "last_name"] },
        { model: Branch, as: "branch", attributes: ["id", "name", "code"], required: false },
      ],
    });

    return NextResponse.json({ success: true, policy: updatedPolicy });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function deletePolicyHandler(request, { params }) {
  const { id } = await params;

  const policy = await Policy.findByPk(id);
  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  if (!ensurePolicyAccess(request.user, policy)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  await policy.destroy();
  return NextResponse.json({ success: true, message: "Policy deleted successfully" });
}

export const GET = withAuth(getPolicyHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const PUT = withAuth(updatePolicyHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const DELETE = withAuth(deletePolicyHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
