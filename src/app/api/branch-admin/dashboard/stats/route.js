import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { 
  User, 
  Class, 
  Branch, 
  AcademicYear,
  Subject,
  FeeVoucher,
  Attendance,
  sequelize
} from '@/backend/models/postgres/index.js';
import { ROLES } from '@/constants/roles';
import { Op } from 'sequelize';

async function getDashboardStats(request) {
  try {
    const user = request.user;
    const branchId = user.branch_id || user.branchId;
    const { searchParams } = new URL(request.url);
    
    const timeRange = searchParams.get('timeRange') || '30days';
    const academicYearId = searchParams.get('academicYearId');
    const classId = searchParams.get('classId');

    if (!branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned to this admin.' },
        { status: 400 }
      );
    }

    // --- Date Filter Logic ---
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '7days': startDate = new Date(now.setDate(now.getDate() - 7)); break;
      case '30days': startDate = new Date(now.setDate(now.getDate() - 30)); break;
      case '90days': startDate = new Date(now.setDate(now.getDate() - 90)); break;
      case '1year': startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
      default: startDate = new Date(now.setDate(now.getDate() - 30));
    }

    // --- 1. Base User Filter ---
    const userWhere = { branch_id: branchId };
    if (academicYearId) {
      userWhere['details.academic_info.academic_year_id'] = academicYearId;
    }
    if (classId) {
      userWhere['details.academic_info.class_id'] = classId;
    }

    const allUsers = await User.findAll({ where: { branch_id: branchId } });
    const students = allUsers.filter(u => {
      const isStudent = u.role === ROLES.STUDENT;
      if (!isStudent) return false;
      
      const studentAYId = u.details?.academic_info?.academic_year_id;
      const studentClassId = u.details?.academic_info?.class_id;

      if (academicYearId && String(studentAYId) !== String(academicYearId)) return false;
      if (classId && String(studentClassId) !== String(classId)) return false;
      
      return true;
    });
    
    const teachers = allUsers.filter(u => u.role === ROLES.TEACHER);
    const activeStudents = students.filter(u => u.is_active).length;
    const activeTeachers = teachers.filter(u => u.is_active).length;

    // --- 2. Fee Metrics (Real-time from FeeVoucher) ---
    const feeWhere = { branch_id: branchId };
    if (academicYearId) feeWhere.academic_year_id = academicYearId;
    if (classId) feeWhere.class_id = classId;
    
    const feeStats = await FeeVoucher.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.cast(sequelize.col('amount_due'), 'DECIMAL')), 'totalDue'],
        [sequelize.fn('SUM', sequelize.cast(sequelize.col('paid_amount'), 'DECIMAL')), 'totalPaid'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalVouchers']
      ],
      where: feeWhere,
      raw: true
    });

    const { totalDue = 0, totalPaid = 0, totalVouchers = 0 } = feeStats[0] || {};
    const collectionPercentage = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

    // --- 3. Attendance Metrics ---
    const attendanceWhere = { 
      branch_id: branchId,
      date: { [Op.gte]: startDate }
    };
    
    // To filter attendance by class, we need to find student IDs for that class
    let filteredStudentIds = null;
    if (classId || academicYearId) {
      filteredStudentIds = students.map(s => s.id);
      attendanceWhere.student_id = { [Op.in]: filteredStudentIds };
    }

    const attendanceStats = await Attendance.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: attendanceWhere,
      group: ['status'],
      raw: true
    });

    const statusCounts = attendanceStats.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count);
      return acc;
    }, {});

    const totalAttendanceMarked = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const presentCount = (statusCounts['PRESENT'] || 0) + (statusCounts['LATE'] || 0);
    const avgAttendance = totalAttendanceMarked > 0 ? Math.round((presentCount / totalAttendanceMarked) * 100) : 0;

    // --- 4. Class & Subject Metrics ---
    const classWhere = { branch_id: branchId };
    if (academicYearId) classWhere.academic_year_id = academicYearId;

    const [classes, subjects, branchInfo] = await Promise.all([
      Class.findAll({ where: classWhere }),
      Subject.findAll({ where: { branch_id: branchId } }),
      Branch.findByPk(branchId)
    ]);

    // --- 5. Performance Metrics ---
    const performanceMetrics = {
      avgAttendance,
      attendanceChange: 2, // Mock trend
      feeCollection: collectionPercentage,
      feeChange: 5, // Mock trend
      totalPaid: parseFloat(totalPaid),
      totalDue: parseFloat(totalDue)
    };

    // --- 6. Header Statistics ---
    const headerStats = {
      totalStudents: students.length,
      studentGrowth: 5, // Mock
      activeStudents,
      inactiveStudents: students.length - activeStudents,
      totalTeachers: teachers.length,
      activeTeachers,
      totalClasses: classes.length,
      activeClasses: classes.filter(c => c.is_active).length,
      totalSubjects: subjects.length,
      branchName: branchInfo?.name || 'My Branch',
    };

    // --- 7. Student Analytics (Distribution by Class) ---
    const classDistribution = classes.map(c => {
      const count = students.filter(s => s.details?.academic_info?.class_id === c.id).length;
      return {
        name: c.name,
        students: count
      };
    }).filter(c => c.students > 0);

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
          totalUsers: allUsers.length,
          totalVouchers: parseInt(totalVouchers)
        },
        branchInfo: {
          id: branchId,
          name: branchInfo?.name,
          code: branchInfo?.code
        },
        charts: {
          classDistribution
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
