import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { User } from "@/backend/models/postgres";
import config from "@/backend/config/index.js";

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
};

export async function POST(request) {
  const refreshToken = request.cookies.get("refreshToken")?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findByPk(decoded.userId, {
      attributes: ["id", "role", "is_active"],
    });
    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 },
      );
    }
    const newAccessToken = generateAccessToken(user);
    return NextResponse.json({ accessToken: newAccessToken });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid or expired refresh token" },
      { status: 401 },
    );
  }
}
