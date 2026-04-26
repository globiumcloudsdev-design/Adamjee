import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import { ROLES } from '@/constants/roles';
import { getAllSalaries, createSalary } from '@/backend/controllers/salaryController';

export async function GET(request) {
  return withAuth(
    async (request, user) => {
      try {
        const { searchParams } = new URL(request.url);
        const filters = {
          branchId: searchParams.get('branchId'),
          employeeId: searchParams.get('employeeId'),
          month: searchParams.get('month'),
          year: searchParams.get('year'),
          paymentStatus: searchParams.get('paymentStatus'),
          page: searchParams.get('page') || 1,
          limit: searchParams.get('limit') || 20,
        };
        
        const result = await getAllSalaries(filters);
        
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        console.error('Get salaries error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to fetch salaries' },
          { status: 500 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}

export async function POST(request) {
  return withAuth(
    async (request, user) => {
      try {
        const body = await request.json();
        
        if (!body.employeeId || !body.branchId || !body.month || !body.year || !body.baseSalary) {
          return NextResponse.json(
            { success: false, message: 'Employee, branch, month, year, and base salary are required' },
            { status: 400 }
          );
        }
        
        const result = await createSalary(body, user.userId);
        
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        console.error('Create salary error:', error);
        return NextResponse.json(
          { success: false, message: error.message || 'Failed to create salary record' },
          { status: 400 }
        );
      }
    },
    [requireRole(ROLES.SUPER_ADMIN)]
  )(request);
}
