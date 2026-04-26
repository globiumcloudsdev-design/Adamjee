import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { Expense, User, Branch } from "@/backend/models/postgres";
import { successResponse, errorResponse } from "@/backend/middleware/response.js";

// Helper to check if user can access expense
async function canAccessExpense(expense, user) {
  if (user.role === 'SUPER_ADMIN') return true;
  return expense.branch_id === user.branch_id;
}

// GET single expense by ID
async function getExpenseById(req, { params }) {
  try {
    const user = req.user;
    const { id } = await params;

    const expense = await Expense.findOne({
      where: { id, is_active: true },
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'payer', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    if (!expense) {
      return errorResponse("Expense not found", 404);
    }

    if (!(await canAccessExpense(expense, user))) {
      return errorResponse("Forbidden", 403);
    }

    return successResponse({ expense });
  } catch (err) {
    return errorResponse(err.message || 'Failed to fetch expense', 500);
  }
}

// PUT update expense
async function updateExpense(req, { params }) {
  try {
    const user = req.user;
    const { id } = await params;
    const body = await req.json();

    const expense = await Expense.findOne({ where: { id, is_active: true } });
    if (!expense) {
      return errorResponse("Expense not found", 404);
    }

    if (!(await canAccessExpense(expense, user))) {
      return errorResponse("Forbidden", 403);
    }

    // Only allow updates if status is 'pending' (or user is SUPER_ADMIN)
    if (expense.status !== 'pending' && user.role !== 'SUPER_ADMIN') {
      return errorResponse("Only pending expenses can be modified", 400);
    }

    // Prevent changing branch_id to unauthorised branch
    if (body.branch_id && user.role !== 'SUPER_ADMIN') {
      if (body.branch_id !== user.branch_id) {
        return errorResponse("Cannot change branch", 403);
      }
    }

    // Allowed fields to update
    const allowedUpdates = ['title', 'amount', 'category', 'date', 'description', 'vendor_name', 'receipt_url'];
    const updateData = {};
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    // Handle status transitions (optional approvals)
    if (body.status && user.role === 'SUPER_ADMIN') {
      updateData.status = body.status;
      if (body.status === 'approved') {
        updateData.approved_by = user.id;
        updateData.approved_at = new Date();
      } else if (body.status === 'paid') {
        updateData.paid_by = user.id;
        updateData.paid_at = new Date();
        if (body.payment_reference) updateData.payment_reference = body.payment_reference;
      } else if (body.status === 'rejected' && body.rejection_reason) {
        updateData.rejection_reason = body.rejection_reason;
      }
    }

    await expense.update(updateData);

    const updatedExpense = await Expense.findByPk(id, {
      include: [
        { model: Branch, as: 'branch' },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'payer', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    return successResponse(updatedExpense, 'Expense updated successfully');
  } catch (err) {
    return errorResponse(err.message || 'Failed to update expense', 500);
  }
}

// DELETE soft delete
async function deleteExpense(req, { params }) {
  try {
    const user = req.user;
    const { id } = await params;

    const expense = await Expense.findOne({ where: { id, is_active: true } });
    if (!expense) {
      return errorResponse("Expense not found", 404);
    }

    if (!(await canAccessExpense(expense, user))) {
      return errorResponse("Forbidden", 403);
    }

    // Only pending expenses can be deleted (or SUPER_ADMIN)
    if (expense.status !== 'pending' && user.role !== 'SUPER_ADMIN') {
      return errorResponse("Only pending expenses can be deleted", 400);
    }

    await expense.update({ is_active: false });
    return successResponse({ message: "Expense deleted successfully" });
  } catch (err) {
    return errorResponse(err.message || 'Failed to delete expense', 500);
  }
}

export const GET = withAuth(getExpenseById);
export const PUT = withAuth(updateExpense);
export const DELETE = withAuth(deleteExpense);