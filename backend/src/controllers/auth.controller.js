import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import {
  createAccessToken,
  createRefreshToken,
} from "../utils/tokens.js";
import { env } from "../config/env.js";

const allowedRoles = [
  "customer",
  "restaurant_owner",
  "delivery_partner",
];

const getUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  avatar: user.avatar || "",
  isVerified: Boolean(user.isVerified),
});

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone = "",
      role = "customer",
    } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const selectedRole = allowedRoles.includes(role)
      ? role
      : "customer";

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: String(phone).trim(),
      passwordHash,
      role: selectedRole,
      isActive: true,
      isVerified: false,
    });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: getUserResponse(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: getUserResponse(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled",
      });
    }

    return res.status(200).json({
      success: true,
      user: getUserResponse(user),
    });
  } catch (error) {
    console.error("GET ME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user",
    });
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(401).json({
        success: false,
        code: "REFRESH_TOKEN_REQUIRED",
        message: "Refresh token required",
      });
    }

    if (!env.refreshSecret) {
      console.error(
        "REFRESH TOKEN CONFIG ERROR: refresh secret is missing"
      );

      return res.status(500).json({
        success: false,
        code: "AUTH_CONFIG_ERROR",
        message: "Server authentication configuration error",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token.trim(),
        env.refreshSecret
      );
    } catch (error) {
      if (error?.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "REFRESH_TOKEN_EXPIRED",
          message: "Refresh token expired. Please login again.",
        });
      }

      if (error?.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          code: "INVALID_REFRESH_TOKEN",
          message: "Invalid refresh token. Please login again.",
        });
      }

      return res.status(401).json({
        success: false,
        code: "REFRESH_TOKEN_INVALID",
        message: "Unable to verify refresh token. Please login again.",
      });
    }

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token. Please login again.",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found. Please login again.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DISABLED",
        message: "Account is disabled",
      });
    }

    const newAccessToken = createAccessToken(user);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("REFRESH TOKEN INTERNAL ERROR:", error);

    return res.status(500).json({
      success: false,
      code: "REFRESH_TOKEN_SERVER_ERROR",
      message: "Unable to refresh token",
    });
  }
};

export const updateMe = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { name, phone, avatar } = req.body;

    const updates = {};

    if (name !== undefined) {
      const newName = String(name).trim();

      if (!newName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      updates.name = newName;
    }

    if (phone !== undefined) {
      updates.phone = String(phone).trim();
    }

    if (avatar !== undefined) {
      updates.avatar = String(avatar).trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No profile changes provided",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: getUserResponse(user),
      data: user,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update profile",
    });
  }
};