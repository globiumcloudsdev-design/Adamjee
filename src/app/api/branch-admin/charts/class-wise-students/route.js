import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { Class, User } from '@/backend/models/postgres/index.js';
import { ROLES } from '@/constants/roles';

async function getClassWiseStudents(request) {
  try {
    const branchId = request.user.branch_id || request.user.branchId;
    if (!branchId) {
      return NextResponse.json({ success: false, message: 'No branch assigned' }, { status: 400 });
    }

    const classes = await Class.findAll({
      where: { branch_id: branchId },
      attributes: ['id', 'name'],
      raw: true
    });

    const students = await User.findAll({
      where: {
        branch_id: branchId,
        role: ROLES.STUDENT
      },
      attributes: ['id', 'details'],
      raw: true
    });

    const studentCounts = {};
    students.forEach(student => {
      const details = student.details || {};
      const classId = details.classId || details.class_id || details.studentProfile?.classId;
      if (classId) {
        studentCounts[classId] = (studentCounts[classId] || 0) + 1;
      }
    });

    const data = classes.map(c => ({
      class: c.name,
      students: studentCounts[c.id] || 0
    })).sort((a, b) => b.students - a.students).slice(0, 5);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Class-wise students error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export const GET = withAuth(getClassWiseStudents, [ROLES.BRANCH_ADMIN]);
