import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { Policy, User, Branch, sequelize } from "@/backend/models/postgres";
import { POLICY_TYPES } from "@/backend/models/postgres/Policy.model";

const ALLOWED_SORT_FIELDS = ["created_at", "updated_at", "policy_name", "version"];

function parseBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function getScopedBranchId(user, requestedBranchId) {
  if (user.role === "BRANCH_ADMIN") return user.branch_id;
  return requestedBranchId || null;
}

async function listPoliciesHandler(request) {
  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const limit = Number.parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  const policyType = searchParams.get("policy_type");
  const isActive = parseBoolean(searchParams.get("is_active"));
  const search = searchParams.get("search");
  const requestedBranchId = searchParams.get("branch_id");
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = (searchParams.get("sortOrder") || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

  if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
    return NextResponse.json({ error: "Invalid sortBy" }, { status: 400 });
  }

  const where = {};
  const scopedBranchId = getScopedBranchId(request.user, requestedBranchId);

  if (request.user.role === "BRANCH_ADMIN") {
    where.branch_id = scopedBranchId;
  } else if (requestedBranchId) {
    where.branch_id = requestedBranchId;
  }

  if (policyType) {
    if (!POLICY_TYPES.includes(policyType)) {
      return NextResponse.json({ error: "Invalid policy_type" }, { status: 400 });
    }
    where.policy_type = policyType;
  }

  if (typeof isActive === "boolean") where.is_active = isActive;

  if (search) {
    where[Op.or] = [
      { policy_name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Policy.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, sortOrder]],
    include: [
      { model: User, as: "creator", attributes: ["id", "first_name", "last_name"] },
      { model: User, as: "updater", attributes: ["id", "first_name", "last_name"] },
      { model: Branch, as: "branch", attributes: ["id", "name", "code"], required: false },
    ],
  });

  return NextResponse.json({
    success: true,
    data: {
      policies: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    },
  });
}

async function createPolicyHandler(request) {
  const body = await request.json();
  const { policy_type, policy_name, description, config, branch_id, is_active = true } = body;

  if (!policy_type || !policy_name || !config) {
    return NextResponse.json(
      { error: "policy_type, policy_name and config are required" },
      { status: 400 }
    );
  }

  if (!POLICY_TYPES.includes(policy_type)) {
    return NextResponse.json({ error: "Invalid policy_type" }, { status: 400 });
  }

  const scopedBranchId = getScopedBranchId(request.user, branch_id);

  if (request.user.role === "BRANCH_ADMIN" && !scopedBranchId) {
    return NextResponse.json({ error: "Branch admin must belong to a branch" }, { status: 400 });
  }

  if (scopedBranchId) {
    const branchExists = await Branch.findByPk(scopedBranchId);
    if (!branchExists) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }
  }

  const transaction = await sequelize.transaction();
  try {
    const policy = await Policy.create(
      {
        branch_id: scopedBranchId,
        policy_type,
        policy_name,
        description: description || null,
        config,
        is_active: is_active === undefined ? true : (typeof is_active === 'string' ? is_active === 'true' : Boolean(is_active)),
        created_by: request.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    const createdPolicy = await Policy.findByPk(policy.id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "first_name", "last_name"] },
        { model: Branch, as: "branch", attributes: ["id", "name", "code"], required: false },
      ],
    });

    return NextResponse.json({ success: true, policy: createdPolicy }, { status: 201 });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Policy Creation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create policy" }, { status: 500 });
  }
}

export const GET = withAuth(listPoliciesHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
export const POST = withAuth(createPolicyHandler, ["SUPER_ADMIN", "BRANCH_ADMIN"]);
