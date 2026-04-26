import { withAuth } from '@/backend/middleware/auth';
import SalaryTemplate from '@/backend/models/SalaryTemplate';

async function handler(request, authenticatedUser, userDoc) {
  const id = request.url.split('/').pop();

  if (request.method === 'GET') {
    try {
      const template = await SalaryTemplate.findById(id)
        .populate('branchId', 'name code')
        .populate('createdBy', 'firstName lastName email');

      if (!template) {
        return Response.json(
          { success: false, message: 'Salary template not found' },
          { status: 404 }
        );
      }

      return Response.json({ success: true, data: template });
    } catch (error) {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }

  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const {
        templateName,
        designation,
        basicSalary,
        allowances,
        deductions,
        description,
        status,
      } = body;

      const template = await SalaryTemplate.findById(id);
      if (!template) {
        return Response.json(
          { success: false, message: 'Salary template not found' },
          { status: 404 }
        );
      }

      template.templateName = templateName || template.templateName;
      template.designation = designation || template.designation;
      template.basicSalary = basicSalary || template.basicSalary;
      template.allowances = allowances || template.allowances;
      template.deductions = deductions || template.deductions;
      template.description = description || template.description;
      template.status = status || template.status;

      await template.save();
      await template.populate('branchId', 'name code');
      await template.populate('createdBy', 'firstName lastName email');

      return Response.json({ success: true, data: template });
    } catch (error) {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }
  }

  if (request.method === 'DELETE') {
    try {
      const template = await SalaryTemplate.findByIdAndDelete(id);

      if (!template) {
        return Response.json(
          { success: false, message: 'Salary template not found' },
          { status: 404 }
        );
      }

      return Response.json({
        success: true,
        message: 'Salary template deleted successfully',
      });
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
export const PUT = withAuth(handler);
export const DELETE = withAuth(handler);
