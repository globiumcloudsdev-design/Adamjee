import { NextResponse } from "next/server";
import crypto from "crypto";
import { User } from "@/backend/models/postgres";
import { sendEmail } from "@/backend/utils/emailService";
import config from "@/backend/config/index.js";
import logger from "@/backend/config/logger.js";

export async function POST(request) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) {
    // Silent for security
    return NextResponse.json({
      success: true,
      message: "If email exists, reset link sent",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.password_reset_token = resetToken;
  user.password_reset_expires = resetExpires;
  await user.save();

  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
  const html = `
    <h1>Password Reset</h1>
    <p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>
    <p>If you didn't request this, ignore this email.</p>
  `;

  try {
    await sendEmail(user.email, "Password Reset Request", html);
  } catch (err) {
    logger.error("Failed to send reset email:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Reset link sent to email",
  });
}
