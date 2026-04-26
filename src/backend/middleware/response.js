import { NextResponse } from 'next/server';

/**
 * API Response Handler
 */
export function successResponse(data, message = 'Success', statusCode = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status: statusCode }
  );
}

export function errorResponse(message = 'Error', statusCode = 500, errors = null) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors && { errors }),
    },
    { status: statusCode }
  );
}

export function validationErrorResponse(errors) {
  return errorResponse('Validation failed', 422, errors);
}

export function notFoundResponse(message = 'Resource not found') {
  return errorResponse(message, 404);
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = 'Access forbidden') {
  return errorResponse(message, 403);
}

/**
 * Async Handler Wrapper for API routes
 */
export function asyncHandler(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      return errorResponse(
        error.message || 'Internal server error',
        error.statusCode || 500
      );
    }
  };
}
