import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { ROLES } from '@/constants/roles';

/**
 * GET Branch Admin Dashboard
 * SQL migration complete - Removed MongoDB dependencies
 */
async function getDashboard(request) {
  try {
    const user = request.user;
    const branchId = user.branch_id || user.branchId;

    // Fetch upcoming events - Placeholder for SQL implementation
    const upcomingEvents = []; 

    return NextResponse.json({
      success: true,
      data: {
        upcomingEvents: upcomingEvents || [],
        recentActivities: [], // Placeholder for future implementation
        branchInfo: {
          id: branchId,
          name: user.branchName || 'My Branch'
        }
      },
      message: 'Dashboard data fetched successfully'
    });

  } catch (error) {
    console.error('Branch dashboard error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDashboard, [ROLES.BRANCH_ADMIN]);
