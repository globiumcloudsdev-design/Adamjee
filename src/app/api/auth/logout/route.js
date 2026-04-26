import { NextResponse } from "next/server";
import { withAuth } from '@/backend/middleware/auth.middleware.js';

async function logoutHandler() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });
  return response;
}

export const POST = withAuth(logoutHandler);
