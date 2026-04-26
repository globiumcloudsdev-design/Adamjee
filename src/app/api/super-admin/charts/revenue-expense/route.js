import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware';

// MOCK implementation for Revenue/Expense chart
async function getRevenueExpenseChart(request) {
    try {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const data = months.map(month => ({
            month,
            revenue: Math.floor(Math.random() * 500000) + 500000,
            expense: Math.floor(Math.random() * 300000) + 200000,
        }));

        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch revenue-expense chart' }, { status: 500 });
    }
}

export const GET = withAuth(getRevenueExpenseChart, ['SUPER_ADMIN', 'BRANCH_ADMIN']);
