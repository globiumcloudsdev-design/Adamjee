import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { Op } from "sequelize";
import { Branch } from "@/backend/models/postgres";
import { User } from "@/backend/models/postgres";
// Side-effect: triggers Branch.associate(models) and User.associate(models)
import "@/backend/models/postgres/index.js";

// CREATE branch (POST)
async function createBranchHandler(request) {
  const body = await request.json();
  const { name, code, address, contact, location, bankAccounts, settings } =
    body;

  if (!name || !code) {
    return NextResponse.json(
      { error: "Name and code are required" },
      { status: 400 },
    );
  }

  // Check branch limit (max 3)
  const branchCount = await Branch.count();
  if (branchCount >= 3) {
    return NextResponse.json(
      { error: "Maximum limit of 3 branches reached. You cannot create more branches." },
      { status: 403 },
    );
  }

  const existing = await Branch.findOne({
    where: { code: code.toUpperCase() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Branch code already exists" },
      { status: 409 },
    );
  }

  const branch = await Branch.create({
    name,
    code: code.toUpperCase(),
    address: address || {},
    contact: contact || {},
    location: location || {},
    bankAccounts: bankAccounts || [],
    settings: settings || {},
    created_by: request.user.id,
  });

  return NextResponse.json({ success: true, branch }, { status: 201 });
}

// LIST branches (GET) with search & pagination
async function listBranchesHandler(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  const search = searchParams.get("search");
  const isActive = searchParams.get("is_active");

  const where = {};
  if (isActive !== null) where.is_active = isActive === "true";
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { code: { [Op.iLike]: `%${search}%` } },
      { "address.city": { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Branch.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: User,
        as: "admin",
        attributes: ["id", "first_name", "last_name", "email"],
        required: false,
      },
      {
        model: User,
        as: "creator",
        attributes: ["id", "first_name", "last_name"],
        required: false,
      },
    ],
  });

  return NextResponse.json({
    success: true,
    data: {
      branches: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    }
  });
}

export const POST = withAuth(createBranchHandler, ["SUPER_ADMIN"]);
export const GET = withAuth(listBranchesHandler, ["SUPER_ADMIN"]);
