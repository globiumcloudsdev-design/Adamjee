import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware';

// MOCK implementation for Pass/Fail Ratio chart
async function getPassFailRatioChart(request) {
    try {
        const pass = Math.floor(Math.random() * 20) + 75; // 75-95%
        const fail = 100 - pass;

        const data = [
            { name: 'Passing', value: pass },
            { name: 'Failing', value: fail }
        ];

        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching pass-fail ratio chart:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch pass-fail ratio chart' }, { status: 500 });
    }
}

export const GET = withAuth(getPassFailRatioChart, ['SUPER_ADMIN', 'BRANCH_ADMIN']);
