import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { 
  Branch, 
  User, 
  Class, 
  AcademicYear,
  sequelize 
} from '@/backend/models/postgres';
import { Op } from 'sequelize';

async function getDashboardStats(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30days';
    const selectedBranchId = searchParams.get('branch') || 'all';

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // 1. Branch Metrics
    const branches = await Branch.findAll();
    const activeBranches = branches.filter(b => b.is_active).length;
    const inactiveBranches = branches.length - activeBranches;

    // 2. User Metrics
    const userWhere = {};
    if (selectedBranchId !== 'all') {
      userWhere.branch_id = selectedBranchId;
    }

    const allUsers = await User.findAll({ where: userWhere });
    const students = allUsers.filter(u => u.role === 'STUDENT');
    const teachers = allUsers.filter(u => u.role === 'TEACHER');
    const branchAdmins = allUsers.filter(u => u.role === 'BRANCH_ADMIN');

    // Calculate growth (Mocked for now as we don't have enough history in new DB)
    const studentGrowth = 5.2; 
    const branchGrowth = 0;

    // 3. Class Metrics
    const classWhere = {};
    if (selectedBranchId !== 'all') {
      classWhere.branch_id = selectedBranchId;
    }
    const classes = await Class.findAll({ where: classWhere });
    const activeClasses = classes.filter(c => c.is_active).length;

    // 4. Header Statistics
    const headerStats = {
      totalBranches: branches.length,
      activeBranches,
      inactiveBranches,
      branchGrowth,
      totalStudents: students.length,
      studentGrowth,
      totalRevenue: 0, // Placeholder
      revenueChange: 0,
      systemUptime: 99.9,
      activeSessions: allUsers.filter(u => u.last_login_at && (now - new Date(u.last_login_at)) < 24 * 60 * 60 * 1000).length,
      feeCollectionRate: 0,
      totalClasses: classes.length,
      totalTeachers: teachers.length,
      upcomingEvents: 0,
      scheduledExams: 0,
      totalExpenses: 0,
      paidExpenses: 0,
      pendingExpenses: 0,
      unreadNotifications: 0,
    };

    // 5. Performance Metrics
    const performanceMetrics = {
      avgAttendance: 0,
      attendanceChange: 0,
      passPercentage: 0,
      passChange: 0,
      apiResponseTime: 120,
      responseChange: -5,
      totalAttendanceRecords: 0,
      presentCount: 0,
      absentCount: 0,
    };

    // 6. Branch Performance Table Data
    const branchPerformance = branches.map(branch => {
      const branchStudents = students.filter(s => s.branch_id === branch.id).length;
      const branchTeachers = teachers.filter(t => t.branch_id === branch.id).length;
      const branchClasses = classes.filter(c => c.branch_id === branch.id).length;

      return {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        status: branch.is_active ? 'active' : 'inactive',
        students: branchStudents,
        teachers: branchTeachers,
        classes: branchClasses,
        attendanceRate: 0,
        revenue: 0,
        expenses: 0,
      };
    });

    // 7. Student Analytics (Distribution by Role)
    const studentAnalytics = {
      userRoleDistribution: [
        { role: 'Students', count: students.length, percentage: allUsers.length > 0 ? Math.round((students.length / allUsers.length) * 100) : 0 },
        { role: 'Teachers', count: teachers.length, percentage: allUsers.length > 0 ? Math.round((teachers.length / allUsers.length) * 100) : 0 },
        { role: 'Branch Admins', count: branchAdmins.length, percentage: allUsers.length > 0 ? Math.round((branchAdmins.length / allUsers.length) * 100) : 0 },
      ]
    };

    return NextResponse.json({
      success: true,
      data: {
        headerStats,
        performanceMetrics,
        branchPerformance,
        studentAnalytics,
        summary: {
          totalBranches: branches.length,
          totalUsers: allUsers.length,
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalClasses: classes.length,
        }
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard statistics', error: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDashboardStats, ['SUPER_ADMIN']);
