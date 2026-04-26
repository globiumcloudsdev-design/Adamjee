// src/app/backend/config/auth.js
import jwt from "jsonwebtoken";
import config from "./index.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwt.secret);
export const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwt.refreshSecret);
