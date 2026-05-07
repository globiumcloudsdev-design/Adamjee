import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { FeeVoucher, Expense, User, Branch, sequelize } from '@/backend/models/postgres';
import { ROLES } from '@/constants/roles';
import { Op } from 'sequelize';
import { successResponse, errorResponse } from '@/backend/middleware/response.js';

/**
 * GET Branch Financial Report
 * Real-time aggregation of Fee Vouchers (Revenue) and Expenses
 */
async function getFinancialReport(req) {
  try {
    const user = req.user;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'monthly'; // daily, weekly, monthly, custom
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const branchId = user.branch_id || user.branchId;

    if (!branchId) {
      return errorResponse('Branch context missing', 400);
    }

    // Determine date range
    let start, end;
    const now = new Date();

    if (type === 'daily') {
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
    } else if (type === 'weekly') {
      const first = now.getDate() - now.getDay();
      start = new Date(now.setDate(first));
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (type === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (type === 'custom' && startDateParam && endDateParam) {
      start = new Date(startDateParam);
      end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default to last 30 days
      start = new Date();
      start.setDate(start.getDate() - 30);
      end = new Date();
    }

    // 1. Fetch Revenue (From Payment History of Vouchers)
    // We fetch vouchers that have been updated in the range or have a paid_date in range
    const vouchers = await FeeVoucher.findAll({
      where: {
        branch_id: branchId,
        [Op.or]: [
          { status: 'PAID' },
          { status: 'PARTIAL' }
        ]
      },
      attributes: ['payment_history', 'voucher_no', 'student_id', 'fee_type'],
      include: [
        { model: User, as: 'student', attributes: ['first_name', 'last_name'] }
      ]
    });

    // 2. Extract Transactions from Payment History
    const revenueTransactions = [];
    vouchers.forEach(v => {
      if (Array.isArray(v.payment_history)) {
        v.payment_history.forEach(payment => {
          const pDate = new Date(payment.date);
          if (pDate >= start && pDate <= end) {
            revenueTransactions.push({
              id: `rev-${v.voucher_no}-${pDate.getTime()}`,
              date: payment.date.split('T')[0],
              description: `Fee: ${v.student?.first_name || ''} ${v.student?.last_name || ''}`,
              type: 'revenue',
              amount: Number(payment.amount),
              method: payment.method || 'Voucher'
            });
          }
        });
      }
    });

    // 3. Fetch Expenses
    const expenses = await Expense.findAll({
      where: {
        branch_id: branchId,
        status: { [Op.in]: ['paid', 'approved'] },
        date: {
          [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]]
        }
      },
      attributes: ['amount', 'date', 'title', 'category', 'expense_number']
    });

    // 4. Fetch Pending Revenue
    const pendingVouchers = await FeeVoucher.findAll({
      where: {
        branch_id: branchId,
        status: { [Op.in]: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
        due_date: { [Op.lte]: end.toISOString().split('T')[0] }
      },
      attributes: ['amount_due', 'paid_amount']
    });

    // Process Data
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const pendingFees = pendingVouchers.reduce((sum, v) => {
      const remaining = Number(v.amount_due || 0) - Number(v.paid_amount || 0);
      return sum + (remaining > 0 ? remaining : 0);
    }, 0);

    // Aggregate Trends (Group by date)
    const trendsMap = {};
    
    revenueTransactions.forEach(t => {
      if (!trendsMap[t.date]) trendsMap[t.date] = { date: t.date, revenue: 0, expense: 0 };
      trendsMap[t.date].revenue += t.amount;
    });

    expenses.forEach(e => {
      const dateStr = e.date;
      if (!trendsMap[dateStr]) trendsMap[dateStr] = { date: dateStr, revenue: 0, expense: 0 };
      trendsMap[dateStr].expense += Number(e.amount || 0);
    });

    const trends = Object.values(trendsMap).sort((a, b) => a.date.localeCompare(b.date));

    // Category Breakdown
    const expenseCategories = {};
    expenses.forEach(e => {
      const cat = e.category || 'other';
      expenseCategories[cat] = (expenseCategories[cat] || 0) + Number(e.amount || 0);
    });

    const expensesByCategory = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }));

    // Recent Settlements (Mixed list)
    const settlements = [
      ...revenueTransactions,
      ...expenses.map(e => ({
        id: `exp-${e.expense_number}`,
        date: e.date,
        description: e.title,
        type: 'expense',
        amount: Number(e.amount),
        method: 'Cash/Bank'
      }))
    ].sort((a, b) => {
      const dateComp = b.date.localeCompare(a.date);
      if (dateComp !== 0) return dateComp;
      return b.id.localeCompare(a.id);
    }).slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          pendingFees,
          revenueGrowth: 0, // Would need historical comparison
          expenseChange: 0
        },
        trends,
        expensesByCategory,
        recentSettlements: settlements
      }
    });

  } catch (error) {
    console.error('Financial Report Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch financial report', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getFinancialReport, [ROLES.BRANCH_ADMIN]);
