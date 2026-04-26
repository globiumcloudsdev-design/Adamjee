import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { ROLES } from '@/constants/roles';

/**
 * Fee Templates API
 * SQL migration placeholder
 */
export const GET = withAuth(async () => {
  return NextResponse.json({
    success: true,
    data: [],
    message: 'Fee templates fetched successfully (SQL migration placeholder)'
  });
}, [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN]);

export const POST = withAuth(async () => {
  return NextResponse.json({
    success: false,
    message: 'Fee template creation is being migrated to SQL.'
  }, { status: 501 });
}, [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN]);
