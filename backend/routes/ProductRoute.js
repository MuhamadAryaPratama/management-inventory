import express from "express";
import {
  createProduct,
  getProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductImage,
} from "../controllers/ProductController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Image route should be placed before parameterized routes to avoid conflicts
router.get("/image/:imageName", getProductImage);

// Product CRUD routes
router.post("/", protect, createProduct);
router.get("/", protect, getProduct);
router.get("/:id", protect, getProductById);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;
