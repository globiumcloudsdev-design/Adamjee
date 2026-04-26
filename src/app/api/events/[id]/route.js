import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { ROLES } from '@/constants/roles';

/**
 * Handle individual event operations
 * SQL migration placeholder
 */
async function handleEvent(request, context) {
  try {
    const { id } = await context.params;
    
    // Placeholder: Return 404 until SQL Event model is implemented
    return NextResponse.json(
      { success: false, message: 'Event not found or not yet migrated to SQL' },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleEvent, [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN]);
export const PUT = withAuth(handleEvent, [ROLES.SUPER_ADMIN]);
export const DELETE = withAuth(handleEvent, [ROLES.SUPER_ADMIN]);
