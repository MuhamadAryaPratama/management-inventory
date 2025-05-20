import express from "express";
import { protect } from "../middleware/auth.js";
import role from "../middleware/role.js";
import {
  getStockReport,
  getTransactionReport,
  getEOQReport,
  getROPReport,
  getPredictionReport,
} from "../controllers/ReportController.js";

const router = express.Router();

router.get("/stock", protect, getStockReport);
router.get("/transactions", protect, getTransactionReport);
router.get("/eoq", protect, role("pemilik"), getEOQReport);
router.get("/rop", protect, role("pemilik"), getROPReport);
router.get("/prediction", protect, role("pemilik"), getPredictionReport);

export default router;
