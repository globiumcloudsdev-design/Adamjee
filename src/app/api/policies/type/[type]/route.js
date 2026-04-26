import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Policy } from "@/backend/models/postgres";
import { POLICY_TYPES } from "@/backend/models/postgres/Policy.model";

async function getPoliciesByTypeHandler(request, { params }) {
  const { type } = await params;
  if (!POLICY_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid policy type" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const requestedBranchId = searchParams.get("branch_id");

  const where = { policy_type: type };
  if (request.user.role === "BRANCH_ADMIN") {
    where.branch_id = request.user.branch_id;
  } else if (requestedBranchId) {
    where.branch_id = requestedBranchId;
  }

  const policies = await Policy.findAll({
    where,
    order: [["version", "DESC"], ["created_at", "DESC"]],
  });

  return NextResponse.json({ success: true, policies });
}

export const GET = withAuth(getPoliciesByTypeHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
