import { NextResponse } from "next/server";
import { withAuth } from "@/backend/middleware/auth.middleware.js";
import { User } from "@/backend/models/postgres";

async function changePasswordHandler(request) {
  const { oldPassword, newPassword } = await request.json();
  const currentUser = request.user;

  if (!oldPassword || !newPassword) {
    return NextResponse.json(
      { error: "Old and new password required" },
      { status: 400 },
    );
  }
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const user = await User.scope("withPassword").findByPk(currentUser.id);
  const isValid = await user.comparePassword(oldPassword);
  if (!isValid) {
    return NextResponse.json(
      { error: "Old password is incorrect" },
      { status: 401 },
    );
  }

  user.password_hash = newPassword;
  user.plain_password = newPassword;
  await user.save();

  return NextResponse.json({ success: true, message: "Password changed" });
}

export const POST = withAuth(changePasswordHandler);
