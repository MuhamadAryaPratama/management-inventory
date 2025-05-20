import Product from "../models/ProductModel.js";
import Transaction from "../models/TransactionModel.js";
import EOQ from "../models/EoqModel.js";
import ROP from "../models/RopModel.js";
import asyncHandler from "express-async-handler";

export const getStockReport = asyncHandler(async (req, res) => {
  // Build filter based on role
  const filter = {};

  if (req.user.role === "karyawan") {
    filter.createdBy = req.user.id;
  }

  const products = await Product.find(filter)
    .populate("category", "name")
    .populate("supplier", "name")
    .populate("createdBy", "name role")
    .populate("updatedBy", "name role")
    .sort("name");

  res.status(200).json(products);
});

export const getTransactionReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, productId } = req.query;

  let query = {};

  // Add date range filter if provided
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Add transaction type filter if provided
  if (type) {
    query.type = type;
  }

  // Add specific product filter if provided
  if (productId) {
    query.product = productId;
  }

  // If user is karyawan, only show transactions for products they created
  if (req.user.role === "karyawan") {
    // First get products created by this user
    const products = await Product.find({ createdBy: req.user.id }).select(
      "_id"
    );
    const productIds = products.map((product) => product._id);

    // Add product filter to only show transactions for products they created
    query.product = { $in: productIds };
  }

  const transactions = await Transaction.find(query)
    .populate("product", "name code")
    .populate("user", "name role")
    .sort("-createdAt");

  res.status(200).json(transactions);
});

export const getEOQReport = asyncHandler(async (req, res) => {
  // For EOQ Report, even if karyawan role, show all EOQs but with product filter
  let query = {};

  if (req.user.role === "karyawan") {
    // First get products created by this user
    const products = await Product.find({ createdBy: req.user.id }).select(
      "_id"
    );
    const productIds = products.map((product) => product._id);

    // Only show EOQs for products created by this user
    query.product = { $in: productIds };
  }

  const eoqs = await EOQ.find(query)
    .populate({
      path: "product",
      select: "name code currentStock createdBy",
      populate: {
        path: "createdBy",
        select: "name role",
      },
    })
    .sort("-lastCalculated");

  res.status(200).json(eoqs);
});

export const getROPReport = asyncHandler(async (req, res) => {
  // For ROP Report, similar to EOQ with product filter
  let query = {};

  if (req.user.role === "karyawan") {
    // First get products created by this user
    const products = await Product.find({ createdBy: req.user.id }).select(
      "_id"
    );
    const productIds = products.map((product) => product._id);

    // Only show ROPs for products created by this user
    query.product = { $in: productIds };
  }

  const rops = await ROP.find(query)
    .populate({
      path: "product",
      select: "name code currentStock createdBy",
      populate: {
        path: "createdBy",
        select: "name role",
      },
    })
    .sort("-lastCalculated");

  res.status(200).json(rops);
});

export const getPredictionReport = asyncHandler(async (req, res) => {
  // Build filter based on role
  const filter = {};

  if (req.user.role === "karyawan") {
    filter.createdBy = req.user.id;
  }

  const products = await Product.find(filter)
    .populate("category", "name")
    .populate("createdBy", "name role")
    .populate({
      path: "rop",
      select: "rop dailyDemand leadTime",
    })
    .populate({
      path: "eoq",
      select: "eoq orderFrequency orderingCost holdingCost",
    });

  const report = products.map((product) => {
    const daysOfSupply =
      product.rop && product.rop.dailyDemand > 0
        ? Math.floor(product.currentStock / product.rop.dailyDemand)
        : null;

    return {
      product: product.name,
      code: product.code,
      currentStock: product.currentStock,
      rop: product.rop ? product.rop.rop : null,
      eoq: product.eoq ? product.eoq.eoq : null,
      daysOfSupply,
      status:
        product.rop && product.currentStock <= product.rop.rop
          ? "Reorder"
          : "OK",
      creator: product.createdBy
        ? {
            name: product.createdBy.name,
            role: product.createdBy.role,
          }
        : null,
    };
  });

  res.status(200).json(report);
});
