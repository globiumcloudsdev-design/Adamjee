import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { User, Branch, Class, Expense } from '@/backend/models/postgres';
import { ROLES } from '@/constants/roles';

/**
 * Super Admin API Handler
 * Migrated to SQL - MongoDB code removed/commented
 */
const handler = async (request) => {
  try {
    const user = request.user;
    
    // Check if user is super admin
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only super admins can access this endpoint' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'system-overview':
        return await getSystemOverview();
      default:
        return NextResponse.json({
          success: true,
          message: 'Action placeholder for SQL implementation'
        });
    }
  } catch (error) {
    console.error('Super admin API error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal server error'
    }, { status: 500 });
  }
};

async function getSystemOverview() {
  const [
    totalUsers,
    totalBranches,
    totalClasses,
    totalStudents,
    totalTeachers,
  ] = await Promise.all([
    User.count(),
    Branch.count(),
    Class.count(),
    User.count({ where: { role: 'STUDENT' } }),
    User.count({ where: { role: 'TEACHER' } }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
      },
      branches: {
        total: totalBranches,
      },
      academic: {
        classes: totalClasses,
      }
    }
  });
}

export const GET = withAuth(handler, ['SUPER_ADMIN']);
export const POST = withAuth(handler, ['SUPER_ADMIN']);
export const PUT = withAuth(handler, ['SUPER_ADMIN']);
export const DELETE = withAuth(handler, ['SUPER_ADMIN']);
