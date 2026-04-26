import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { ROLES } from '@/constants/roles';

/**
 * GET All Events
 * SQL migration placeholder
 */
async function getEvents(request) {
  try {
    const user = request.user;
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || user.branch_id;

    // Placeholder: Return empty list until SQL Event model is implemented
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Events fetched successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getEvents, [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN]);
