import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import Policy, { POLICY_TYPES } from "@/backend/models/postgres/Policy.model";

async function getActivePolicyByTypeHandler(request, { params }) {
  const { type } = await params;
  if (!POLICY_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid policy type" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const requestedBranchId = searchParams.get("branch_id");

  const where = {
    policy_type: type,
    is_active: true,
  };

  if (request.user.role === "BRANCH_ADMIN") {
    where.branch_id = request.user.branch_id;
  } else if (requestedBranchId) {
    where.branch_id = requestedBranchId;
  }

  const policy = await Policy.findOne({
    where,
    order: [["version", "DESC"], ["created_at", "DESC"]],
  });

  if (!policy) {
    return NextResponse.json({ success: true, policy: null, message: "No active policy found" });
  }

  return NextResponse.json({ success: true, policy });
}

export const GET = withAuth(getActivePolicyByTypeHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
