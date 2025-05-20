import Transaction from "../models/TransactionModel.js";
import Product from "../models/ProductModel.js";
import asyncHandler from "express-async-handler";

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = asyncHandler(async (req, res) => {
  // Filter transactions based on user role
  let query = {};

  if (req.user.role === "karyawan") {
    // First get products created by this user
    const products = await Product.find({ createdBy: req.user.id }).select(
      "_id"
    );
    const productIds = products.map((product) => product._id);

    // Only show transactions for products created by this user
    query.product = { $in: productIds };
  }

  const transactions = await Transaction.find(query)
    .populate("product", "name code")
    .populate("user", "name role");

  res.status(200).json(transactions);
});

// @desc    Get transactions by product
// @route   GET /api/transactions/product/:productId
// @access  Private
export const getProductTransactions = asyncHandler(async (req, res) => {
  // Check if user has access to this product's transactions
  if (req.user.role === "karyawan") {
    const product = await Product.findById(req.params.productId);
    if (!product || product.createdBy.toString() !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to access transactions for this product");
    }
  }

  const transactions = await Transaction.find({ product: req.params.productId })
    .populate("product", "name code")
    .populate("user", "name role")
    .sort("-createdAt");

  res.status(200).json(transactions);
});

// @desc    Create new transaction (in/out)
// @route   POST /api/transactions
// @access  Private
export const createTransaction = asyncHandler(async (req, res) => {
  const {
    product: productId,
    type,
    quantity,
    price,
    reference,
    notes,
  } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if user has access to create transactions for this product
  if (
    req.user.role === "karyawan" &&
    product.createdBy.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error("Not authorized to create transactions for this product");
  }

  // Update product stock based on transaction type
  if (type === "pembelian") {
    product.currentStock += quantity;
  } else if (type === "penjualan") {
    if (product.currentStock < quantity) {
      res.status(400);
      throw new Error("Insufficient stock");
    }
    product.currentStock -= quantity;
  } else if (type === "penyesuaian") {
    // Handle stock adjustment
    const newStock = product.currentStock + quantity; // quantity can be negative
    if (newStock < 0) {
      res.status(400);
      throw new Error("Adjustment would result in negative stock");
    }
    product.currentStock = newStock;
  }

  await product.save();

  const transaction = await Transaction.create({
    product: productId,
    type,
    quantity,
    price,
    notes,
    user: req.user.id,
  });

  res.status(201).json(transaction);
});
