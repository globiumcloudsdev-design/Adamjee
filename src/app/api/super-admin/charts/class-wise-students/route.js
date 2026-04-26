import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { User, Class, Branch } from '@/backend/models/postgres';
import { Op } from 'sequelize';

async function getClassWiseStudents(request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch') || 'all';

    // Build where clause
    const where = {
      role: 'STUDENT'
    };

    if (branchId !== 'all') {
      where.branch_id = branchId;
    }

    // Fetch all students with their class info
    // Since class info is in JSONB details, we process it in JS for now
    // or we could use raw SQL if performance is an issue.
    const students = await User.findAll({
      where,
      attributes: ['details', 'branch_id'],
      include: [
        { model: Branch, as: 'branch', attributes: ['name'] }
      ]
    });

    // Process data to group by class
    // We'll also fetch active classes to ensure we have the correct names
    const activeClasses = await Class.findAll({
      where: { is_active: true },
      attributes: ['id', 'name']
    });

    const classMap = {};
    activeClasses.forEach(c => {
      classMap[c.id] = c.name;
    });

    const resultGrouped = {};

    students.forEach(student => {
      const studentDetails = student.details?.student || {};
      const classId = studentDetails.classId;
      const className = studentDetails.class || 'Unknown';
      const branchName = student.branch?.name || 'Unknown';

      // We prefer using classId to map to official class name if possible
      const finalClassName = classId && classMap[classId] ? classMap[classId] : className;
      
      const key = `${finalClassName}-${branchName}`;
      if (!resultGrouped[key]) {
        resultGrouped[key] = {
          class: finalClassName,
          students: 0,
          branch: branchName
        };
      }
      resultGrouped[key].students += 1;
    });

    const data = Object.values(resultGrouped).sort((a, b) => a.class.localeCompare(b.class));

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching class-wise students:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch class-wise students' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getClassWiseStudents, ['SUPER_ADMIN', 'BRANCH_ADMIN']);
