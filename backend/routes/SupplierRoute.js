import express from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/SupplierController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Supplier routes
router.post("/", protect, createSupplier);
router.get("/", protect, getSuppliers);
router.get("/:id", protect, getSupplierById);
router.put("/:id", protect, updateSupplier);
router.delete("/:id", protect, deleteSupplier);

export default router;
