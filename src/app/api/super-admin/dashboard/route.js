import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { ROLES } from '@/constants/roles';

/**
 * Super Admin Dashboard (Legacy)
 * Migrated to SQL - Removed MongoDB dependencies
 */
async function getDashboard(request) {
  try {
    // Sample dashboard data (SQL migration placeholder)
    const dashboardData = {
      stats: {
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        totalRevenue: 0,
      },
      recentActivities: [],
      upcomingEvents: [],
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data fetched successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDashboard, [ROLES.SUPER_ADMIN]);
