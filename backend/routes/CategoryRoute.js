import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/CategoryController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Category routes
router.post("/", protect, createCategory);
router.get("/", protect, getCategories);
router.get("/:id", protect, getCategoryById);
router.put("/:id", protect, updateCategory);
router.delete("/:id", protect, deleteCategory);

export default router;
