import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    env.accessSecret,
    {
      expiresIn: env.accessExpires,
    }
  );
};

export const createRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
    },
    env.refreshSecret,
    {
      expiresIn: env.refreshExpires,
    }
  );
};