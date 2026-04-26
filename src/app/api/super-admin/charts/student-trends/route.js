import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { User, sequelize } from '@/backend/models/postgres';
import { Op } from 'sequelize';

async function getStudentTrends(request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch') || 'all';
    const timeRange = searchParams.get('timeRange') || '6months';

    // Calculate date range
    const now = new Date();
    let months = timeRange === '6months' ? 6 : timeRange === '1year' ? 12 : 3;
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const where = {
      role: 'STUDENT',
      created_at: { [Op.gte]: startDate }
    };

    if (branchId !== 'all') {
      where.branch_id = branchId;
    }

    // Use raw query for complex grouping or Sequelize grouping
    const rawData = await User.findAll({
      where,
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('created_at')), 'month_date'],
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('created_at'))],
      order: [[sequelize.fn('date_trunc', 'month', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - months + i + 1, 1);
      const m = date.getMonth();
      const y = date.getFullYear();

      const existingData = rawData.find(d => {
        const dDate = new Date(d.month_date);
        return dDate.getMonth() === m && dDate.getFullYear() === y;
      });

      const students = existingData ? parseInt(existingData.count) : 0;
      const prevStudents = data.length > 0 ? data[data.length - 1].students : 0;
      const growth = prevStudents > 0 ? Math.round(((students - prevStudents) / prevStudents) * 100) : 0;

      data.push({
        month: monthNames[m],
        students,
        growth
      });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching student trends:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch student trends' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStudentTrends, ['SUPER_ADMIN', 'BRANCH_ADMIN']);
