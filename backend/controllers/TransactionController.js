import Transaction from "../models/TransactionModel.js";
import Product from "../models/ProductModel.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

// @desc    Get all transactions (transaction history)
// @route   GET /api/transactions
// @access  Private
export const getTransactions = asyncHandler(async (req, res) => {
  // Filter transactions based on user role
  let query = {};

  if (req.user.role === "karyawan") {
    // Karyawan can see transactions they created or for products they manage
    query.$or = [{ createdBy: req.user.id }, { user: req.user.id }];
  }

  const transactions = await Transaction.find(query)
    .populate("product", "name description price currentStock")
    .populate("user", "name role")
    .populate("createdBy", "name")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions,
  });
});

// @desc    Get transactions by product
// @route   GET /api/transactions/product/:productId
// @access  Private
export const getProductTransactions = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Validate productId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product ID");
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if user has access to this product's transactions
  if (req.user.role === "karyawan") {
    // Karyawan can access if they created the product OR the transactions
    const transactions = await Transaction.find({
      product: productId,
      $or: [{ createdBy: req.user.id }, { user: req.user.id }],
    })
      .populate("product", "name description price currentStock")
      .populate("user", "name role")
      .populate("createdBy", "name")
      .sort("-createdAt");

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  }

  // For admin/managers - show all transactions for the product
  const transactions = await Transaction.find({ product: productId })
    .populate("product", "name description price currentStock")
    .populate("user", "name role")
    .populate("createdBy", "name")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions,
  });
});

// @desc    Add stock in (barang masuk)
// @route   POST /api/transactions/stock-in
// @access  Private
export const addStockIn = asyncHandler(async (req, res) => {
  const { product: productId, quantity, notes, purchasePrice } = req.body;

  // Validate required fields
  if (!productId || !quantity) {
    res.status(400);
    throw new Error("Product and quantity are required");
  }

  // Validate productId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product ID");
  }

  // Validate quantity is a positive number
  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    res.status(400);
    throw new Error("Quantity must be a positive number");
  }

  // Validate purchase price if provided
  let pPrice = null;
  if (purchasePrice) {
    pPrice = Number(purchasePrice);
    if (isNaN(pPrice) || pPrice < 0) {
      res.status(400);
      throw new Error("Purchase price must be a valid non-negative number");
    }
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // For karyawan, check if they have permission to manage this product
  if (req.user.role === "karyawan") {
    // Check if karyawan is the creator of the product OR has been assigned to manage it
    // You might need to adjust this logic based on your business rules
    const isCreator =
      product.createdBy && product.createdBy.toString() === req.user.id;
    const isAssigned =
      product.assignedTo && product.assignedTo.includes(req.user.id);

    // If your Product model doesn't have assignedTo field, you can remove this check
    // and just allow all karyawan to add stock, or implement your own authorization logic
    if (!isCreator && !isAssigned) {
      // Alternative: Allow all karyawan to add stock (remove this check entirely)
      // Or implement department-based authorization
      // For now, let's allow karyawan to add stock to any product
      console.log(
        `Karyawan ${req.user.id} adding stock to product ${productId} (not creator)`
      );
    }
  }

  const newStock = product.currentStock + qty;

  try {
    // Create transaction record
    const transactionData = {
      product: productId,
      type: "pembelian",
      quantity: qty,
      price: pPrice,
      total: pPrice ? qty * pPrice : 0,
      stockChange: qty,
      previousStock: product.currentStock,
      newStock: newStock,
      notes: notes || "",
      user: req.user.id,
      createdBy: req.user.id,
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();

    // Update product stock
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        currentStock: newStock,
        updatedBy: req.user.id,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedProduct) {
      await Transaction.findByIdAndDelete(transaction._id);
      res.status(500);
      throw new Error("Failed to update product stock");
    }

    // Populate the response
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate("product", "name description price currentStock")
      .populate("user", "name role")
      .populate("createdBy", "name");

    res.status(201).json({
      success: true,
      message: "Stock added successfully",
      data: populatedTransaction,
      stockInfo: {
        previous: product.currentStock,
        added: qty,
        new: newStock,
        purchaseValue: pPrice ? qty * pPrice : 0,
      },
    });
  } catch (error) {
    console.error("Add stock error:", error);
    res.status(500);
    throw new Error(`Failed to add stock: ${error.message}`);
  }
});

// @desc    Add stock out (barang keluar)
// @route   POST /api/transactions/stock-out
// @access  Private
export const addStockOut = asyncHandler(async (req, res) => {
  const { product: productId, quantity, notes } = req.body;

  // Validate required fields
  if (!productId) {
    res.status(400);
    throw new Error("Product ID is required");
  }

  if (!quantity && quantity !== 0) {
    res.status(400);
    throw new Error("Quantity is required");
  }

  // Validate productId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product ID");
  }

  // Validate quantity is positive number
  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    res.status(400);
    throw new Error("Quantity must be a positive number");
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // For karyawan, check if they have permission to manage this product
  if (req.user.role === "karyawan") {
    // Check if karyawan is the creator of the product OR has been assigned to manage it
    const isCreator =
      product.createdBy && product.createdBy.toString() === req.user.id;
    const isAssigned =
      product.assignedTo && product.assignedTo.includes(req.user.id);

    // If your Product model doesn't have assignedTo field, you can remove this check
    // and just allow all karyawan to remove stock, or implement your own authorization logic
    if (!isCreator && !isAssigned) {
      // Alternative: Allow all karyawan to remove stock (remove this check entirely)
      // Or implement department-based authorization
      // For now, let's allow karyawan to remove stock from any product
      console.log(
        `Karyawan ${req.user.id} removing stock from product ${productId} (not creator)`
      );
    }
  }

  // Check if sufficient stock is available
  if (product.currentStock < qty) {
    res.status(400);
    throw new Error(
      `Insufficient stock. Available: ${product.currentStock}, Required: ${qty}`
    );
  }

  // Use product's price for the transaction
  const salePrice = product.price;
  const newStock = product.currentStock - qty;
  const total = qty * salePrice;

  try {
    // Create transaction record
    const transactionData = {
      product: productId,
      type: "penjualan",
      quantity: qty,
      price: salePrice,
      total: total,
      stockChange: -qty,
      previousStock: product.currentStock,
      newStock: newStock,
      notes: notes || "",
      user: req.user.id,
      createdBy: req.user.id,
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();

    // Update product stock
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        currentStock: newStock,
        updatedBy: req.user.id,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedProduct) {
      await Transaction.findByIdAndDelete(transaction._id);
      res.status(500);
      throw new Error("Failed to update product stock");
    }

    // Populate the response
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate("product", "name description price currentStock")
      .populate("user", "name role")
      .populate("createdBy", "name");

    res.status(201).json({
      success: true,
      message: "Stock removed successfully",
      data: populatedTransaction,
      stockInfo: {
        previous: product.currentStock,
        removed: qty,
        new: newStock,
        saleValue: total,
        priceUsed: salePrice,
      },
    });
  } catch (error) {
    console.error("Remove stock error:", error);
    res.status(500);
    throw new Error(`Failed to remove stock: ${error.message}`);
  }
});

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
export const getTransactionStats = asyncHandler(async (req, res) => {
  let matchQuery = {};

  if (req.user.role === "karyawan") {
    // Karyawan can see stats for transactions they created
    matchQuery.$or = [{ createdBy: req.user.id }, { user: req.user.id }];
  }

  const stats = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalValue: { $sum: "$total" },
      },
    },
  ]);

  // Add summary statistics
  const summary = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalSalesValue: {
          $sum: {
            $cond: [{ $eq: ["$type", "penjualan"] }, "$total", 0],
          },
        },
        totalPurchaseValue: {
          $sum: {
            $cond: [{ $eq: ["$type", "pembelian"] }, "$total", 0],
          },
        },
        totalItemsSold: {
          $sum: {
            $cond: [{ $eq: ["$type", "penjualan"] }, "$quantity", 0],
          },
        },
        totalItemsPurchased: {
          $sum: {
            $cond: [{ $eq: ["$type", "pembelian"] }, "$quantity", 0],
          },
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    stats,
    summary: summary[0] || {
      totalTransactions: 0,
      totalSalesValue: 0,
      totalPurchaseValue: 0,
      totalItemsSold: 0,
      totalItemsPurchased: 0,
    },
  });
});
