import { teacherAttendanceHistory } from '@/backend/controllers/teacherAttendanceController';
import { authenticate } from '@/backend/middleware/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // Authenticate user
    const authResult = await authenticate(req);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status || 401 }
      );
    }

    // Extract query parameters from URL using Next.js req.query
    const url = new URL(req.url);
    const query = {
      filterType: url.searchParams.get('filterType') || 'monthly',
      month: url.searchParams.get('month'),
      year: url.searchParams.get('year'),
      date: url.searchParams.get('date'),
      weekStart: url.searchParams.get('weekStart')
    };

    // Create request object with user and query
    const reqWithQuery = {
      ...req,
      user: authResult.user,
      query: query
    };

    // Create a mock response object that captures the response
    let responseData = null;
    let responseStatus = 200;

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          responseData = data;
          responseStatus = code;
        }
      })
    };

    // Call controller
    await teacherAttendanceHistory(reqWithQuery, mockRes);

    // Return the response from controller
    return NextResponse.json(responseData, { status: responseStatus });

  } catch (error) {
    console.error('Teacher attendance history API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
