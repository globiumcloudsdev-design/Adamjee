import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import { getClassTimetable } from '@/backend/controllers/timetableController';

/**
 * GET /api/super-admin/timetables/class/[classId]
 * Get timetable for specific class
 */
export const GET = withAuth(
  async (request, user, userDoc, { params }) => {
    try {
      const { classId } = await params;
      const { searchParams } = new URL(request.url);
      
      const section = searchParams.get('section');
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

      const result = await getClassTimetable(classId, section, academicYear);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Get class timetable error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to fetch class timetable',
        },
        { status: 500 }
      );
    }
  },
  [requireRole(ROLES.SUPER_ADMIN)]
);
