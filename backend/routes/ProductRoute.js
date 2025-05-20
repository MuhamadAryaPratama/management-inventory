import express from "express";
import {
  createProduct,
  getProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductImage, // Tambahkan import untuk fungsi baru
} from "../controllers/ProductController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Rute untuk produk
router.post("/", protect, createProduct);
router.get("/", protect, getProduct);
router.get("/:id", protect, getProductById);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

// Rute baru untuk mengakses gambar produk
router.get("/image/:imageName", getProductImage);

export default router;
