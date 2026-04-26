import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "../models/postgres/User.model.js";
import config from "../config/index.js";

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

export const authenticate = async (request) => {
  let token;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (request.cookies.get("accessToken")?.value) {
    token = request.cookies.get("accessToken").value;
  } else if (request.nextUrl.searchParams.get("token")) {
    token = request.nextUrl.searchParams.get("token");
  }

  if (!token) throw new Error("No token provided");

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") throw new Error("Token expired");
    if (err.name === "JsonWebTokenError") throw new Error("Invalid token");
    throw new Error("Authentication failed");
  }

  const user = await User.findByPk(decoded.userId, {
    attributes: {
      exclude: [
        "password_hash",
        "plain_password",
        "password_reset_token",
        "password_reset_expires",
      ],
    },
  });
  if (!user) throw new Error("User not found");
  if (!user.is_active) throw new Error("Account disabled");

  return { user, token };
};

export const withAuth = (handler, allowedRoles = []) => {
  return async (request, context) => {
    try {
      const { user, token } = await authenticate(request);
      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: `Access denied. Required: ${allowedRoles.join(" or ")}` },
          { status: 403 },
        );
      }
      request.user = user;
      request.token = token;
      return handler(request, context);
    } catch (err) {
      const status =
        err.message === "No token provided"
          ? 401
          : err.message === "Token expired"
            ? 401
            : err.message === "Invalid token"
              ? 401
              : 500;
      return NextResponse.json({ error: err.message }, { status });
    }
  };
};
