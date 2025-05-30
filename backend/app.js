import express from "express";
import morgan from "morgan";
import errorHandler from "errorhandler";
import cors from "cors";
import cookieParser from "cookie-parser"; // Add this import
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";

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
import logRoutes from "./routes/LogRoute.js";

const app = express();

// Trust proxy - untuk mendapatkan IP address yang benar
app.set("trust proxy", true);

// Body parser
app.use(express.json());

// Cookie parser - Add this BEFORE routes
app.use(cookieParser());

// Setup express-fileupload
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Enable CORS - Updated to handle cookies
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
app.use("/api/logs", logRoutes);

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
