import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { User } from "@/backend/models/postgres";

export async function POST(request) {
  const { token, newPassword } = await request.json();
  if (!token || !newPassword) {
    return NextResponse.json(
      { error: "Token and new password required" },
      { status: 400 },
    );
  }
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const user = await User.scope("withPassword").findOne({
    where: {
      password_reset_token: token,
      password_reset_expires: { [Op.gt]: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 },
    );
  }

  user.password_hash = newPassword;
  user.plain_password = newPassword;
  user.password_reset_token = null;
  user.password_reset_expires = null;
  await user.save();

  return NextResponse.json({
    success: true,
    message: "Password reset successful",
  });
}
