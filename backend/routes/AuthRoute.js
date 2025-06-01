import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  validateResetCode,
  sendTestPasswordResetEmail,
} from "../controllers/AuthController.js";
import { protect } from "../middleware/auth.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

// Auth routes
router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", protect, asyncHandler(logout));
router.post("/refresh-token", asyncHandler(refreshToken));
router.get("/me", protect, asyncHandler(getMe));

// Password reset routes - Simplified without token in URL
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword)); // No token parameter needed
router.post("/validate-reset-code", asyncHandler(validateResetCode)); // Optional validation endpoint

// Test route for password reset email (only for development/testing)
router.post(
  "/test-password-reset-email",
  protect,
  asyncHandler(sendTestPasswordResetEmail)
);

export default router;
