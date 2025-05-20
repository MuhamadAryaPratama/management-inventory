import express from "express";
import { protect, role } from "../middleware/auth.js";
import {
  calculateROP,
  getProductROP,
  getAllROP,
  checkROP,
} from "../controllers/RopController.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router
  .route("/")
  .post(protect, role("pemilik"), asyncHandler(calculateROP))
  .get(protect, role("pemilik"), asyncHandler(getAllROP));

router.route("/product/:productId").get(protect, asyncHandler(getProductROP));
router.route("/check").get(protect, asyncHandler(checkROP));

export default router;
