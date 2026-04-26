import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware';

// MOCK implementation for Financial Overview chart
async function getFinancialOverviewChart(request) {
    try {
        const data = {
            monthlyRevenue: 2500000,
            monthlyExpense: 1800000,
            outstandingFees: 450000,
            cashInHand: 1200000
        };

        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch financial overview chart' }, { status: 500 });
    }
}

export const GET = withAuth(getFinancialOverviewChart, ['SUPER_ADMIN', 'BRANCH_ADMIN']);
