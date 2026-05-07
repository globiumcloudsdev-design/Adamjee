import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware";
import { User } from "@/backend/models/postgres";

/**
 * POST /api/users/push-token
 * Registers or updates a user's push notification token.
 */
async function registerPushToken(req) {
  try {
    const currentUser = req.user;
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token is required" },
        { status: 400 },
      );
    }

    // Update user's push token
    // We also store it in fcm_tokens array to keep track of multiple devices if needed
    const fcmTokens = currentUser.fcm_tokens || [];
    if (!fcmTokens.includes(token)) {
      fcmTokens.push(token);
    }

    await User.update(
      { 
        push_token: token,
        fcm_tokens: fcmTokens 
      },
      { where: { id: currentUser.id } }
    );

    return NextResponse.json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (error) {
    console.error("Failed to register push token:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}

export const POST = withAuth(registerPushToken, [
  "SUPER_ADMIN",
  "BRANCH_ADMIN",
  "TEACHER",
  "STUDENT",
  "STAFF",
]);
