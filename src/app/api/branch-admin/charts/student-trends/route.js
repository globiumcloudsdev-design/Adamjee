import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { User } from '@/backend/models/postgres/index.js';
import { ROLES } from '@/constants/roles';
import { Op, fn, col } from 'sequelize';

async function getStudentTrends(request) {
  try {
    const branchId = request.user.branch_id || request.user.branchId;
    if (!branchId) {
      return NextResponse.json({ success: false, message: 'No branch assigned' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const classId = searchParams.get('classId');

    // Get student counts grouped by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const where = {
      branch_id: branchId,
      role: ROLES.STUDENT,
      created_at: { [Op.gte]: sixMonthsAgo }
    };

    if (academicYearId) {
      where['details.academic_info.academic_year_id'] = academicYearId;
    }
    if (classId) {
      where['details.academic_info.class_id'] = classId;
    }

    const trends = await User.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'month', col('created_at')), 'month'],
        [fn('COUNT', col('id')), 'count']
      ],
      where,
      group: [fn('DATE_TRUNC', 'month', col('created_at'))],
      order: [[fn('DATE_TRUNC', 'month', col('created_at')), 'ASC']],
      raw: true
    });

    const formattedTrends = trends.map(t => ({
      period: new Date(t.month).toLocaleString('default', { month: 'short' }),
      students: parseInt(t.count)
    }));

    return NextResponse.json({ success: true, data: formattedTrends });
  } catch (error) {
    console.error('Student trends error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export const GET = withAuth(getStudentTrends, [ROLES.BRANCH_ADMIN]);
