import express from "express";
import {
  register,
  login,
  getMe,
  logout,
} from "../controllers/AuthController.js";
import { protect } from "../middleware/auth.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

// Wrap route handlers with asyncHandler to properly handle errors
router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout)); // Added logout route
router.get("/me", protect, asyncHandler(getMe));

export default router;
