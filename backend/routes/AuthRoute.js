import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  refreshToken,
} from "../controllers/AuthController.js";
import { protect } from "../middleware/auth.js";
import asyncHandler from "express-async-handler";
import cookieParser from "cookie-parser";

const router = express.Router();

// Apply cookie parser middleware
router.use(cookieParser());

// Auth routes
router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", protect, asyncHandler(logout));
router.post("/refresh-token", asyncHandler(refreshToken));
router.get("/me", protect, asyncHandler(getMe));

export default router;
