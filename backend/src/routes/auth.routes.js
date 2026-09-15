import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  refreshToken,
  updateMe,
} from "../controllers/auth.controller.js";
import {
  protect,
} from "../middleware/auth.middleware.js";
const router =
  express.Router();
router.post(
  "/register",
  register
);
router.post(
  "/login",
  login
);
router.post(
  "/refresh",
  refreshToken
);
router.get(
  "/me",
  protect,
  getMe
);
router.patch(
  "/me",
  protect,
  updateMe
);
router.post(
  "/logout",
  protect,
  logout
);
export default router;
