import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { Expense, User, Branch } from "@/backend/models/postgres";
import { generateExpenseNumber } from "@/backend/utils/generateExpenseNumber";
import { successResponse, errorResponse } from "@/backend/middleware/response.js";
import { Op } from "sequelize";

// GET: List expenses with filtering & pagination
async function getExpenses(req) {
  try {
    const user = req.user;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const branchId = searchParams.get('branch_id');

    // Build where clause
    let whereClause = { is_active: true };

    // Branch access control
    if (user.role !== 'SUPER_ADMIN') {
      whereClause.branch_id = user.branch_id;
    } else if (branchId) {
      whereClause.branch_id = branchId;
    }

    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (fromDate && toDate) {
      whereClause.date = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      whereClause.date = { [Op.gte]: fromDate };
    } else if (toDate) {
      whereClause.date = { [Op.lte]: toDate };
    }

    const { count, rows } = await Expense.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['date', 'DESC'], ['created_at', 'DESC']],
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'payer', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    return successResponse({
      expenses: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    return errorResponse(err.message || 'Failed to fetch expenses', 500);
  }
}

// POST: Create a new expense
async function createExpense(req) {
  try {
    const user = req.user;
    const body = await req.json();
    const { title, amount, category, date, description, vendor_name, branch_id, receipt_url } = body;

    // Basic validation
    if (!title || !amount || !category || !date) {
      return errorResponse("Missing required fields: title, amount, category, date", 400);
    }
    if (amount < 0) {
      return errorResponse("Amount must be positive", 400);
    }

    // Branch assignment
    let finalBranchId = branch_id;
    if (user.role !== 'SUPER_ADMIN') {
      finalBranchId = user.branch_id;
    }
    if (!finalBranchId && user.role === 'SUPER_ADMIN') {
      return errorResponse("Branch ID is required for SUPER_ADMIN", 400);
    }

    // Optional: verify branch exists (omitted for brevity)

    const expenseNumber = await generateExpenseNumber();

    const newExpense = await Expense.create({
      title,
      amount,
      category,
      date,
      description,
      vendor_name,
      branch_id: finalBranchId,
      receipt_url,
      expense_number: expenseNumber,
      created_by: user.id,
      status: 'pending',
      is_active: true
    });

    // Fetch created expense with relations
    const expenseWithRelations = await Expense.findByPk(newExpense.id, {
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    return successResponse(expenseWithRelations, 'Expense created successfully', 201);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return errorResponse('Expense number already exists – please retry', 409);
    }
    return errorResponse(err.message || 'Failed to create expense', 500);
  }
}

export const GET = withAuth(getExpenses);
export const POST = withAuth(createExpense);