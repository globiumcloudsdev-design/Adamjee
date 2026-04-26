import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import {
  getTimetableById,
  updateTimetable,
  deleteTimetable,
} from '@/backend/controllers/timetableController';

// Helper to safely resolve params from context (supports promise or plain object)
async function resolveParams(context) {
  if (!context) return {};
  const maybeParams = context.params;
  if (!maybeParams) return {};
  try {
    // if params is a promise-like, await it
    if (typeof maybeParams.then === 'function') {
      return await maybeParams;
    }
  } catch (e) {
    // fall through
  }
  return maybeParams || {};
}

/**
 * GET /api/super-admin/timetables/[id]
 * Get timetable by ID
 */
export const GET = withAuth(
  async (request, user, userDoc, context = {}) => {
    try {
      const { id } = await resolveParams(context);

      const result = await getTimetableById(id);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Get timetable error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to fetch timetable',
        },
        { status: error.message === 'Timetable not found' ? 404 : 500 }
      );
    }
  },
  [requireRole(ROLES.SUPER_ADMIN)]
);

/**
 * PUT /api/super-admin/timetables/[id]
 * Update timetable
 */
export const PUT = withAuth(
  async (request, user, userDoc, context = {}) => {
    try {
      const { id } = await resolveParams(context);
      const body = await request.json();

      const result = await updateTimetable(id, body, user.userId);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Update timetable error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to update timetable',
        },
        { status: error.message === 'Timetable not found' ? 404 : 400 }
      );
    }
  },
  [requireRole(ROLES.SUPER_ADMIN)]
);

/**
 * DELETE /api/super-admin/timetables/[id]
 * Delete timetable
 */
export const DELETE = withAuth(
  async (request, user, userDoc, context = {}) => {
    try {
      const { id } = await resolveParams(context);

      const result = await deleteTimetable(id);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('Delete timetable error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to delete timetable',
        },
        { status: error.message === 'Timetable not found' ? 404 : 500 }
      );
    }
  },
  [requireRole(ROLES.SUPER_ADMIN)]
);
