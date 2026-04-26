import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { Branch, User } from '@/backend/models/postgres';

async function getBranchWiseStudents(request) {
  try {
    // Get all active branches
    const branches = await Branch.findAll({
      attributes: ['id', 'name', 'code'],
      where: { is_active: true }
    });

    if (!branches || branches.length === 0) {
      console.log('No active branches found');
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Count students for each branch
    const branchData = await Promise.all(
      branches.map(async (branch) => {
        const studentCount = await User.count({
          where: {
            role: 'STUDENT',
            branch_id: branch.id
          }
        });

        return {
          branch: branch.name,
          students: studentCount,
          code: branch.code
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: branchData
    });

  } catch (error) {
    console.error('Error fetching branch-wise students:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch branch-wise students' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getBranchWiseStudents, ['SUPER_ADMIN', 'BRANCH_ADMIN']);
