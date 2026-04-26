import { teacherCheckIn } from '@/backend/controllers/teacherAttendanceController';
import { authenticate } from '@/backend/middleware/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Authenticate user
    const authResult = await authenticate(req);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status || 401 }
      );
    }

    req.user = authResult.user;

    // Parse request body
    const body = await req.json();

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
    await teacherCheckIn(req, mockRes, body);
    // Return the response from controller
    return NextResponse.json(responseData, { status: responseStatus });

  } catch (error) {
    console.error('Teacher check-in API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
