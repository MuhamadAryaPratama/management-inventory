import express from "express";
import morgan from "morgan";
import errorHandler from "errorhandler";
import cors from "cors";
import fileUpload from "express-fileupload"; // Import express-fileupload
import path from "path";
import { fileURLToPath } from "url"; // Import untuk mendapatkan __dirname di ESM

// Mendapatkan __dirname di ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route files
import productRoutes from "./routes/ProductRoute.js";
import authRoutes from "./routes/AuthRoute.js";
import transactionRoutes from "./routes/TransactionRoute.js";
import eoqRoutes from "./routes/EoqRoute.js";
import ropRoutes from "./routes/RopRoute.js";
import reportRoutes from "./routes/ReportRoute.js";
import userRoutes from "./routes/UserRoute.js";
import categoryRoutes from "./routes/CategoryRoute.js";
import supplierRoutes from "./routes/SupplierRoute.js";

const app = express();

// Body parser
app.use(express.json());

// Setup express-fileupload
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file 5MB
    createParentPath: true, // Membuat direktori jika belum ada
    useTempFiles: true, // Menggunakan file temporary untuk performa yang lebih baik
    tempFileDir: "/tmp/", // Direktori untuk file temporary
  })
);

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true, // Since we're using localStorage for token storage
  })
);

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/eoq", eoqRoutes);
app.use("/api/rop", ropRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);

// Error middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

export default app;
