import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { FeeVoucher, Expense, User, Branch, sequelize } from '@/backend/models/postgres';
import { ROLES } from '@/constants/roles';
import { Op } from 'sequelize';
import { successResponse, errorResponse } from '@/backend/middleware/response.js';

/**
 * GET Global Financial Report (Super Admin)
 * Consolidated aggregation of Fee Vouchers and Expenses across all branches
 */
async function getGlobalFinancialReport(req) {
  try {
    const user = req.user;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'monthly';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const branchId = searchParams.get('branch_id');

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
      start = new Date();
      start.setDate(start.getDate() - 30);
      end = new Date();
    }

    let whereClauseVoucher = {
      [Op.or]: [{ status: 'PAID' }, { status: 'PARTIAL' }]
    };

    let whereClauseExpense = {
      status: { [Op.in]: ['paid', 'approved'] },
      date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] }
    };

    let whereClausePending = {
      status: { [Op.in]: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
      due_date: { [Op.lte]: end.toISOString().split('T')[0] }
    };

    if (branchId && branchId !== 'all') {
      whereClauseVoucher.branch_id = branchId;
      whereClauseExpense.branch_id = branchId;
      whereClausePending.branch_id = branchId;
    }

    // 1. Fetch Revenue (From Payment History)
    const vouchers = await FeeVoucher.findAll({
      where: whereClauseVoucher,
      attributes: ['payment_history', 'voucher_no', 'student_id', 'branch_id'],
      include: [
        { model: Branch, as: 'branch', attributes: ['name'] },
        { model: User, as: 'student', attributes: ['first_name', 'last_name'] }
      ]
    });

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
              method: payment.method || 'Voucher',
              branchName: v.branch?.name || 'Unknown'
            });
          }
        });
      }
    });

    // 2. Fetch Expenses
    const expenses = await Expense.findAll({
      where: whereClauseExpense,
      attributes: ['amount', 'date', 'category', 'branch_id', 'title', 'expense_number'],
      include: [{ model: Branch, as: 'branch', attributes: ['name'] }]
    });

    // 3. Fetch Pending
    const pendingVouchers = await FeeVoucher.findAll({
      where: whereClausePending,
      attributes: ['amount_due', 'paid_amount']
    });

    // Process Data
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const pendingFees = pendingVouchers.reduce((sum, v) => {
      const remaining = Number(v.amount_due || 0) - Number(v.paid_amount || 0);
      return sum + (remaining > 0 ? remaining : 0);
    }, 0);

    // Aggregate Trends
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

    // Branch-wise Performance
    const branchStatsMap = {};
    revenueTransactions.forEach(t => {
      const bName = t.branchName;
      if (!branchStatsMap[bName]) branchStatsMap[bName] = { name: bName, revenue: 0, expense: 0 };
      branchStatsMap[bName].revenue += t.amount;
    });
    expenses.forEach(e => {
      const bName = e.branch?.name || 'Unknown';
      if (!branchStatsMap[bName]) branchStatsMap[bName] = { name: bName, revenue: 0, expense: 0 };
      branchStatsMap[bName].expense += Number(e.amount || 0);
    });
    const branchWiseData = Object.values(branchStatsMap);

    // Recent Settlements
    const recentSettlements = [
      ...revenueTransactions,
      ...expenses.map(e => ({
        id: `exp-${e.expense_number}`,
        date: e.date,
        description: e.title,
        type: 'expense',
        amount: Number(e.amount),
        method: 'Cash/Bank',
        branchName: e.branch?.name || 'Unknown'
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
          revenueGrowth: 0,
          expenseChange: 0
        },
        trends,
        expensesByCategory,
        branchWiseData,
        recentSettlements
      }
    });

  } catch (error) {
    console.error('Global Financial Report Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch global report', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getGlobalFinancialReport, [ROLES.SUPER_ADMIN]);
