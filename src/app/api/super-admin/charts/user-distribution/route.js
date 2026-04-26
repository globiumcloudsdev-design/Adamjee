import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware';

// MOCK implementation for User Distribution chart
async function getUserDistributionChart(request) {
    try {
        const data = [
            { role: 'Students', count: 4500, percentage: 75 },
            { role: 'Teachers', count: 900, percentage: 15 },
            { role: 'Parents', count: 480, percentage: 8 },
            { role: 'Staff', count: 120, percentage: 2 },
        ];

        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch user distribution chart' }, { status: 500 });
    }
}

export const GET = withAuth(getUserDistributionChart, ['SUPER_ADMIN', 'BRANCH_ADMIN']);
