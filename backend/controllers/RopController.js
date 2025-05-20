import ROP from "../models/RopModel.js";
import Product from "../models/ProductModel.js";
import asyncHandler from "express-async-handler";

export const calculateROP = asyncHandler(async (req, res) => {
  const { product, leadTime, dailyDemand } = req.body;

  // Check if product exists
  const productExists = await Product.findById(product);
  if (!productExists) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if user has access to this product if they are karyawan
  if (
    req.user.role === "karyawan" &&
    productExists.createdBy.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error("Not authorized to calculate ROP for this product");
  }

  // Calculate ROP
  const rop = dailyDemand * leadTime;

  // Create or update ROP record
  let ropRecord = await ROP.findOne({ product });

  if (ropRecord) {
    ropRecord.leadTime = leadTime;
    ropRecord.dailyDemand = dailyDemand;
    ropRecord.rop = rop;
    ropRecord.lastCalculated = Date.now();
    await ropRecord.save();
  } else {
    ropRecord = await ROP.create({
      product,
      leadTime,
      dailyDemand,
      rop,
    });

    // Update the product to reference this ROP
    await Product.findByIdAndUpdate(product, {
      rop: ropRecord._id,
      updatedBy: req.user.id,
      updatedAt: Date.now(),
    });
  }

  res.status(200).json(ropRecord);
});

export const getProductROP = asyncHandler(async (req, res) => {
  const productId = req.params.productId;

  // Check if user has access to this product if they are karyawan
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (
    req.user.role === "karyawan" &&
    product.createdBy.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error("Not authorized to access ROP for this product");
  }

  const rop = await ROP.findOne({ product: productId }).populate(
    "product",
    "name code"
  );

  if (!rop) {
    res.status(404);
    throw new Error("ROP data not found for this product");
  }

  res.status(200).json(rop);
});

export const getAllROP = asyncHandler(async (req, res) => {
  let query = {};

  // If user is karyawan, only show ROPs for products they created
  if (req.user.role === "karyawan") {
    // First get products created by this user
    const products = await Product.find({ createdBy: req.user.id }).select(
      "_id"
    );
    const productIds = products.map((product) => product._id);

    // Filter ROPs by these products
    query.product = { $in: productIds };
  }

  const rops = await ROP.find(query).populate({
    path: "product",
    select: "name code createdBy",
    populate: {
      path: "createdBy",
      select: "name role",
    },
  });

  res.status(200).json(rops);
});

export const checkROP = asyncHandler(async (req, res) => {
  // Build filter based on role
  const filter = {};

  if (req.user.role === "karyawan") {
    filter.createdBy = req.user.id;
  }

  const products = await Product.find(filter)
    .populate({
      path: "rop",
      select: "rop",
    })
    .populate("createdBy", "name role");

  const productsBelowROP = products.filter((product) => {
    return product.rop && product.currentStock <= product.rop.rop;
  });

  res.status(200).json(productsBelowROP);
});
