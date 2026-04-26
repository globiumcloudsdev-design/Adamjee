import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { ROLES } from '@/constants/roles';

/**
 * Manual Fee Payment API
 * SQL migration placeholder
 */
export const POST = withAuth(async () => {
  return NextResponse.json({
    success: false,
    message: 'Manual fee payment is being migrated to SQL.'
  }, { status: 501 });
}, [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN]);
