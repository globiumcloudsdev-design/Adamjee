import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Policy } from "@/backend/models/postgres";

async function getPolicyOptionsHandler(request) {
  const { searchParams } = new URL(request.url);
  const policyType = searchParams.get("policy_type");
  const requestedBranchId = searchParams.get("branch_id");

  const where = { is_active: true };
  if (policyType) where.policy_type = policyType;

  if (request.user.role === "BRANCH_ADMIN") {
    where.branch_id = request.user.branch_id;
  } else if (requestedBranchId) {
    where.branch_id = requestedBranchId;
  }

  const policies = await Policy.findAll({
    where,
    attributes: ["id", "policy_name", "policy_type", "version"],
    order: [["policy_name", "ASC"]],
  });

  const options = policies.map((policy) => ({
    value: policy.id,
    label: `${policy.policy_name} (v${policy.version})`,
    type: policy.policy_type,
  }));

  return NextResponse.json({ success: true, options });
}

export const GET = withAuth(getPolicyOptionsHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
