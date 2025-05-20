import express from "express";
import { protect, role } from "../middleware/auth.js";
import {
  calculateEOQ,
  getProductEOQ,
  getAllEOQ,
} from "../controllers/EoqController.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router
  .route("/")
  .post(protect, role("pemilik"), asyncHandler(calculateEOQ))
  .get(protect, role("pemilik"), asyncHandler(getAllEOQ));

router.route("/product/:productId").get(protect, asyncHandler(getProductEOQ));

export default router;
