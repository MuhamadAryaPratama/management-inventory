import express from "express";
import { protect, role } from "../middleware/auth.js";
import {
  calculateROP,
  getAllROP,
  checkAllProductsROP,
  // cleanupOrphanedROP,
} from "../controllers/RopController.js";

import asyncHandler from "express-async-handler";

const router = express.Router();

// Main ROP routes
router
  .route("/")
  .post(protect, role("pemilik"), asyncHandler(calculateROP))
  .get(protect, role("pemilik"), asyncHandler(getAllROP));

// Additional utility routes
router
  .route("/check-all")
  .post(protect, role("pemilik"), asyncHandler(checkAllProductsROP));

// router
//   .route("/rop/cleanup")
//   .post(protect, role("pemilik"), asyncHandler(cleanupOrphanedROP));

export default router;

console.log("ROP Routes loaded successfully");
