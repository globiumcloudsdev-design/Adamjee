import { NextResponse } from "next/server";
import { withAuth } from '@/backend/middleware/auth.middleware.js';

async function meHandler(request) {
  return NextResponse.json({ user: request.user });
}

export const GET = withAuth(meHandler);
