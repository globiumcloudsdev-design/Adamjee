import { Expense } from "../models/postgres/index.js";
import { Op } from "sequelize";

/**
 * Generate a unique expense number in the format EXP-YYYY-XXXXX
 * by finding the latest expense number for the current year and incrementing.
 */
export async function generateExpenseNumber() {
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;

  // Find the latest expense number for the current year
  const latestExpense = await Expense.findOne({
    where: {
      expense_number: {
        [Op.startsWith]: prefix,
      },
    },
    order: [["expense_number", "DESC"]],
  });

  let nextNumber = 1;

  if (latestExpense && latestExpense.expense_number) {
    // Extract the numeric suffix from "EXP-YYYY-XXXXX"
    const parts = latestExpense.expense_number.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  // Pad to 5 digits, e.g. EXP-2026-00001
  const suffix = String(nextNumber).padStart(5, "0");
  return `${prefix}${suffix}`;
}

