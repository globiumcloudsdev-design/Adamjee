import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware';

// MOCK implementation for Monthly Fee Collection
async function getMonthlyFeeCollection(request) {
    try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branch');
        const timeRange = searchParams.get('timeRange');

        // Logic here would normally aggregate from FeeVoucher model
        // For now, returning mock data to fix dashboard crash

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();

        const data = [];
        const count = timeRange === '1year' ? 12 : 6;

        for (let i = count - 1; i >= 0; i--) {
            const mIdx = (currentMonth - i + 12) % 12;
            data.push({
                month: months[mIdx],
                approvedAmount: Math.floor(Math.random() * 500000) + 200000,
                pendingAmount: Math.floor(Math.random() * 100000) + 20000,
            });
        }

        return NextResponse.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Error fetching monthly fee collection:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch monthly fee collection' },
            { status: 500 }
        );
    }
}

export const GET = withAuth(getMonthlyFeeCollection, ['SUPER_ADMIN', 'BRANCH_ADMIN']);
