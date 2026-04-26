import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
// import { getTeacherTimetable } from '@/backend/controllers/timetableController';

/**
 * GET /api/super-admin/timetables/teacher/[teacherId]
 * Get timetable for specific teacher
 */
export const GET = withAuth(
  async (request, user, userDoc, { params }) => {
    try {
      const { teacherId } = await params;
      const { searchParams } = new URL(request.url);
      
      const academicYear = searchParams.get('academicYear');

      if (!academicYear) {
        return NextResponse.json(
          {
            success: false,
            message: 'Academic year is required',
          },
          { status: 400 }
        );
      }

      const result = await getTeacherTimetable(teacherId, academicYear);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Get teacher timetable error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to fetch teacher timetable',
        },
        { status: 500 }
      );
    }
  },
  [requireRole(ROLES.SUPER_ADMIN)]
);
