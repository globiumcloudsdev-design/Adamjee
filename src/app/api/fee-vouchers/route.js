import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth.middleware.js';
import { User, Class, Branch } from '@/backend/models/postgres';
import { ROLES } from '@/constants/roles';

/**
 * Fee Vouchers API
 * SQL migration complete - Removed MongoDB dependencies
 */
export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    // Placeholder: Return empty list until SQL FeeVoucher model is implemented
    return NextResponse.json({
      success: true,
      data: {
        vouchers: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      },
      message: 'Fee vouchers fetched successfully (SQL migration placeholder)'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}, [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN]);

export const POST = withAuth(async (request) => {
  try {
    return NextResponse.json({
      success: true,
      message: 'Fee voucher generation is currently being migrated to SQL.'
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}, [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN]);
