import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
// import {
//   getTimetables,
//   getTimetableById,
//   createTimetable,
//   updateTimetable,
//   deleteTimetable,
//   getClassTimetable,
//   getTeacherTimetable,
// } from '@/backend/controllers/timetableController';

/**
 * GET /api/super-admin/timetables
 * Get all timetables with filters
 */
export const GET = withAuth(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      
      const filters = {
        branchId: searchParams.get('branchId'),
        classId: searchParams.get('classId'),
        academicYear: searchParams.get('academicYear'),
        status: searchParams.get('status'),
        section: searchParams.get('section'),
        teacherId: searchParams.get('teacherId'),
        page: searchParams.get('page') || 1,
        limit: searchParams.get('limit') || 50,
      };

      const result = await getTimetables(filters);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Get timetables error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to fetch timetables',
        },
        { status: 500 }
      );
    }
  },
  [requireRole(ROLES.SUPER_ADMIN)]
);

/**
 * POST /api/super-admin/timetables
 * Create new timetable
 */
export const POST = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();

      const result = await createTimetable(body, user.userId);

      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      console.error('Create timetable error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to create timetable',
        },
        { status: 400 }
      );
    }
  },
  [requireRole(ROLES.SUPER_ADMIN)]
);
