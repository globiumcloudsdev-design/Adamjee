import { withAuth } from '@/backend/middleware/auth';
import SalaryTemplate from '@/backend/models/SalaryTemplate';
import { Branch } from '@/backend/models/postgres';

async function handler(request, authenticatedUser, userDoc) {
  if (request.method === 'GET') {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number(searchParams.get('page')) || 1;
      const limit = Number(searchParams.get('limit')) || 10;
      const skip = (page - 1) * limit;
      const search = searchParams.get('search');
      const branchId = searchParams.get('branchId');

      let query = {};

      if (search) {
        query.$or = [
          { templateName: { $regex: search, $options: 'i' } },
          { designation: { $regex: search, $options: 'i' } },
        ];
      }

      if (branchId) {
        query.branchId = branchId;
      }

      const templates = await SalaryTemplate.find(query)
        .populate('branchId', 'name code')
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await SalaryTemplate.countDocuments(query);

      return Response.json({
        success: true,
        data: templates,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const {
        templateName,
        branchId,
        designation,
        basicSalary,
        allowances,
        deductions,
        description,
        status,
      } = body;

      if (!templateName || !branchId || !designation || !basicSalary) {
        return Response.json(
          { success: false, message: 'Please provide all required fields' },
          { status: 400 }
        );
      }

      // Check if branch exists
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return Response.json(
          { success: false, message: 'Branch not found' },
          { status: 404 }
        );
      }

      const newTemplate = await SalaryTemplate.create({
        templateName,
        branchId,
        designation,
        basicSalary,
        allowances: allowances || {
          houseRent: 0,
          medical: 0,
          transport: 0,
          other: 0,
        },
        deductions: deductions || {
          tax: 0,
          providentFund: 0,
          insurance: 0,
          other: 0,
        },
        description,
        status: status || 'active',
        createdBy: userDoc._id,
      });

      await newTemplate.populate('branchId', 'name code');
      await newTemplate.populate('createdBy', 'firstName lastName email');

      return Response.json({ success: true, data: newTemplate }, { status: 201 });
    } catch (error) {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }

  return Response.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  );
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
