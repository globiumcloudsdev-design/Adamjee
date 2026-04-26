import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import {
  updateSalary,
  deleteSalary,
  markSalaryAsPaid,
} from '@/backend/controllers/salaryController';

export async function PUT(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        const { id } = params;
        const body = await request.json();
        
        const result = await updateSalary(id, body);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Update salary error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to update salary record' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

export async function DELETE(request, { params }) {
  return withAuth(
    async (request, user) => {
      try {
        const { id } = params;
        const result = await deleteSalary(id);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Delete salary error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to delete salary record' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
