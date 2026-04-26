import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware';

// MOCK implementation for Branch Performance chart
async function getBranchPerformanceChart(request) {
    try {
        const branches = ['Main Campus', 'North Branch', 'South Branch'];
        const data = branches.map(name => ({
            branch: name,
            score: Math.floor(Math.random() * 20) + 80 // 80-100
        }));

        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch branch performance chart' }, { status: 500 });
    }
}

export const GET = withAuth(getBranchPerformanceChart, ['SUPER_ADMIN', 'BRANCH_ADMIN']);
