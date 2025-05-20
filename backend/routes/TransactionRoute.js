import express from "express";
import { protect } from "../middleware/auth.js";
import role from "../middleware/role.js";
import {
  getTransactions,
  getProductTransactions,
  createTransaction,
} from "../controllers/TransactionController.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getTransactions)
  .post(protect, createTransaction);

router.route("/product/:productId").get(protect, getProductTransactions);

export default router;
