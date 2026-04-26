import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { ROLES } from '@/constants/roles';

/**
 * Individual Exam API
 * SQL migration placeholder
 */
async function handleExam(request, context) {
  return NextResponse.json({
    success: false,
    message: 'Exam details are being migrated to SQL.'
  }, { status: 501 });
}

export const GET = withAuth(handleExam, [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN]);
export const PUT = withAuth(handleExam, [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN]);
export const DELETE = withAuth(handleExam, [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN]);
