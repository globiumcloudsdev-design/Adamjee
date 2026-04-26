import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { 
  User, 
  Class, 
  Branch, 
  AcademicYear,
  Subject
} from '@/backend/models/postgres/index.js';
import { ROLES } from '@/constants/roles';

async function getDashboardStats(request) {
  try {
    const user = request.user;
    const branchId = user.branch_id || user.branchId;

    if (!branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned to this admin.' },
        { status: 400 }
      );
    }



    // 1. User Metrics
    const allUsers = await User.findAll({ where: { branch_id: branchId } });
    const students = allUsers.filter(u => u.role === ROLES.STUDENT);
    const teachers = allUsers.filter(u => u.role === ROLES.TEACHER);
    const activeStudents = students.filter(u => u.is_active).length;
    const activeTeachers = teachers.filter(u => u.is_active).length;

    // 2. Class & Subject Metrics
    const [classes, subjects, branchInfo] = await Promise.all([
      Class.findAll({ where: { branch_id: branchId } }),
      Subject.findAll({ where: { branch_id: branchId } }),
      Branch.findByPk(branchId)
    ]);

    // 3. Performance Metrics (Placeholders for now)
    const performanceMetrics = {
      avgAttendance: 0,
      attendanceChange: 0,
      passPercentage: 0,
      passChange: 0,
    };

    // 4. Header Statistics (Mirrors Super Admin structure)
    const headerStats = {
      totalStudents: students.length,
      studentGrowth: 0, // Placeholder
      activeStudents,
      inactiveStudents: students.length - activeStudents,
      totalTeachers: teachers.length,
      activeTeachers,
      totalClasses: classes.length,
      activeClasses: classes.filter(c => c.is_active).length,
      totalSubjects: subjects.length,
      branchName: branchInfo?.name || 'My Branch',
    };

    // 5. Student Analytics
    const studentAnalytics = {
      userRoleDistribution: [
        { role: 'Students', count: students.length, percentage: allUsers.length > 0 ? Math.round((students.length / allUsers.length) * 100) : 0 },
        { role: 'Teachers', count: teachers.length, percentage: allUsers.length > 0 ? Math.round((teachers.length / allUsers.length) * 100) : 0 },
      ]
    };

    return NextResponse.json({
      success: true,
      data: {
        headerStats,
        performanceMetrics,
        studentAnalytics,
        summary: {
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalClasses: classes.length,
          totalSubjects: subjects.length,
          totalUsers: allUsers.length
        },
        branchInfo: {
          id: branchId,
          name: branchInfo?.name,
          code: branchInfo?.code
        }
      }
    });

  } catch (error) {
    console.error('Branch dashboard stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch branch dashboard statistics', error: error.message },
      { status: 500 }
    );
  }
}

// Consistency: using the same middleware pattern as super-admin
export const GET = withAuth(getDashboardStats, [ROLES.BRANCH_ADMIN]);
