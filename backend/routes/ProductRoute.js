import express from "express";
import {
  createProduct,
  getProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  checkAllLowStock,
} from "../controllers/ProductController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Low stock check route (admin/pemilik only)
router.post("/check-low-stock", protect, checkAllLowStock);

// Product CRUD routes
router.post("/", protect, createProduct);
router.get("/", protect, getProduct);
router.get("/:id", protect, getProductById);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;
