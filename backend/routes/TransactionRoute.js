import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getTransactions,
  getProductTransactions,
  addStockIn,
  addStockOut,
  getTransactionStats,
} from "../controllers/TransactionController.js";

const router = express.Router();

// Main transaction routes
router.route("/").get(protect, getTransactions);

// Stock management routes
router.route("/stock-in").post(protect, addStockIn);
router.route("/stock-out").post(protect, addStockOut);

// Transaction statistics
router.route("/stats").get(protect, getTransactionStats);

// Product specific transaction history
router.route("/product/:productId").get(protect, getProductTransactions);

export default router;
