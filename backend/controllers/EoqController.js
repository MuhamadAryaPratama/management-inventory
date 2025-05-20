import EOQ from "../models/EoqModel.js";
import Product from "../models/ProductModel.js";
import asyncHandler from "express-async-handler";

export const calculateEOQ = asyncHandler(async (req, res) => {
  const { product, orderingCost, holdingCost, annualDemand } = req.body;

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
    throw new Error("Not authorized to calculate EOQ for this product");
  }

  // Calculate EOQ
  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
  const orderFrequency = annualDemand / eoq;
  const totalCost =
    (orderingCost * annualDemand) / eoq + (holdingCost * eoq) / 2;

  // Create or update EOQ record
  let eoqRecord = await EOQ.findOne({ product });

  if (eoqRecord) {
    eoqRecord.orderingCost = orderingCost;
    eoqRecord.holdingCost = holdingCost;
    eoqRecord.annualDemand = annualDemand;
    eoqRecord.eoq = eoq;
    eoqRecord.orderFrequency = orderFrequency;
    eoqRecord.totalCost = totalCost;
    eoqRecord.lastCalculated = Date.now();
    await eoqRecord.save();
  } else {
    eoqRecord = await EOQ.create({
      product,
      orderingCost,
      holdingCost,
      annualDemand,
      eoq,
      orderFrequency,
      totalCost,
    });

    // Update the product to reference this EOQ
    await Product.findByIdAndUpdate(product, {
      eoq: eoqRecord._id,
      updatedBy: req.user.id,
      updatedAt: Date.now(),
    });
  }

  res.status(200).json(eoqRecord);
});

export const getProductEOQ = asyncHandler(async (req, res) => {
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
    throw new Error("Not authorized to access EOQ for this product");
  }

  const eoq = await EOQ.findOne({ product: productId }).populate(
    "product",
    "name code"
  );

  if (!eoq) {
    res.status(404);
    throw new Error("EOQ data not found for this product");
  }

  res.status(200).json(eoq);
});

export const getAllEOQ = asyncHandler(async (req, res) => {
  let query = {};

  // If user is karyawan, only show EOQs for products they created
  if (req.user.role === "karyawan") {
    // First get products created by this user
    const products = await Product.find({ createdBy: req.user.id }).select(
      "_id"
    );
    const productIds = products.map((product) => product._id);

    // Filter EOQs by these products
    query.product = { $in: productIds };
  }

  const eoqs = await EOQ.find(query).populate({
    path: "product",
    select: "name code createdBy",
    populate: {
      path: "createdBy",
      select: "name role",
    },
  });

  res.status(200).json(eoqs);
});
