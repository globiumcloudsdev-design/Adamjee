import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Policy, sequelize } from "@/backend/models/postgres";

function ensurePolicyAccess(user, policy) {
  if (!policy) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return Boolean(policy.branch_id) && policy.branch_id === user.branch_id;
}

async function togglePolicyStatusHandler(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  if (typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "is_active must be boolean" }, { status: 400 });
  }

  const policy = await Policy.findByPk(id);
  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  if (!ensurePolicyAccess(request.user, policy)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const transaction = await sequelize.transaction();
  try {
    policy.is_active = body.is_active;
    policy.updated_by = request.user.id;
    await policy.save({ transaction });

    await transaction.commit();

    return NextResponse.json({ success: true, policy });
  } catch (error) {
    await transaction.rollback();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const PATCH = withAuth(togglePolicyStatusHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
