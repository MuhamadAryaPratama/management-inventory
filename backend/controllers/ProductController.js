import Product from "../models/ProductModel.js";
import asyncHandler from "express-async-handler";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure upload directory
const uploadDir = path.join(__dirname, "../public/uploads/products");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function to process uploaded file
const processUploadedFile = (file) => {
  // Generate a unique filename to prevent overwriting
  const timestamp = new Date().getTime();
  const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`;
  const uploadPath = path.join(uploadDir, fileName);

  // Move the file to upload directory
  file.mv(uploadPath, (err) => {
    if (err) throw new Error(`File upload failed: ${err.message}`);
  });

  return fileName;
};

export const createProduct = asyncHandler(async (req, res) => {
  try {
    // Add creator information to the product
    req.body.createdBy = req.user.id;

    // Handle file upload if there's a file
    if (req.files && req.files.image) {
      const fileName = processUploadedFile(req.files.image);
      req.body.image = fileName;
    }

    const product = new Product(req.body);
    const insert = await product.save();

    res.status(201).json({
      msg: "Product Created Successfully",
      product: insert,
    });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

export const getProduct = asyncHandler(async (req, res) => {
  try {
    let query = {};

    // If user role is "karyawan", only show products they created
    if (req.user.role === "karyawan") {
      query.createdBy = req.user.id;
    }

    const products = await Product.find(query)
      .populate("category", "name")
      .populate("supplier", "name")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    res.json(products);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

export const getProductById = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("supplier", "name")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .populate({
        path: "eoq",
        select:
          "eoq orderFrequency orderingCost holdingCost annualDemand totalCost lastCalculated",
      })
      .populate({
        path: "rop",
        select: "rop leadTime dailyDemand lastCalculated",
      });

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    // Check if user has access to this product
    if (
      req.user.role === "karyawan" &&
      product.createdBy._id.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Not authorized to access this product");
    }

    res.json(product);
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    // Check if user has access to update this product
    if (
      req.user.role === "karyawan" &&
      product.createdBy.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Not authorized to update this product");
    }

    // Add updater information
    req.body.updatedBy = req.user.id;
    req.body.updatedAt = Date.now();

    // Handle file upload if there's a file
    if (req.files && req.files.image) {
      // Delete old image if it exists and is not the default image
      if (product.image && product.image !== "default-product.jpg") {
        const oldImagePath = path.join(uploadDir, product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const fileName = processUploadedFile(req.files.image);
      req.body.image = fileName;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      msg: "Product Updated Successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

export const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    // Check if user has access to delete this product
    if (
      req.user.role === "karyawan" &&
      product.createdBy.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error("Not authorized to delete this product");
    }

    // Delete product image if it exists and is not the default image
    if (product.image && product.image !== "default-product.jpg") {
      const imagePath = path.join(uploadDir, product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Product.deleteOne({ _id: req.params.id });
    res.status(200).json({ msg: "Product Deleted Successfully" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

// New endpoint to serve product images
export const getProductImage = asyncHandler(async (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(uploadDir, imageName);

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    // Send default image if requested image doesn't exist
    res.sendFile(path.join(uploadDir, "default-product.jpg"));
  }
});
