import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import sequelize from "@/backend/config/database.js";
import { User } from "@/backend/models/postgres";
import config from "@/backend/config/index.js";
import logger from "@/backend/config/logger.js";

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
      branch_id: user.branch_id,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

export async function POST(request) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json(
        { error: "Login and password required" },
        { status: 400 },
      );
    }

    const user = await User.scope("withPassword").findOne({
      where: {
        [Op.or]: [{ email: login.toLowerCase() }, { registration_no: login }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Account disabled" }, { status: 401 });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    await user.update({ last_login_at: new Date() });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const permissions = await user.getPermissions();

    const userData = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      registration_no: user.registration_no,
      role: user.role,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      permissions,
    };

    const response = NextResponse.json({
      success: true,
      user: userData,
      accessToken,
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    logger.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
