import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";
import Supplier from "../models/SupplierModel.js";
import asyncHandler from "express-async-handler";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

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
  try {
    // Generate a unique filename to prevent overwriting
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`;
    const uploadPath = path.join(uploadDir, fileName);

    // Move the file to upload directory synchronously
    file.mv(uploadPath);

    return fileName;
  } catch (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }
};

// Helper function to find or create category
const findOrCreateCategory = async (categoryInput) => {
  try {
    // If it's already a valid ObjectId, return it
    if (
      mongoose.Types.ObjectId.isValid(categoryInput) &&
      categoryInput.length === 24
    ) {
      const existingCategory = await Category.findById(categoryInput);
      if (existingCategory) {
        return categoryInput;
      }
    }

    // If it's a string, try to find by name or create new
    if (typeof categoryInput === "string" && categoryInput.trim()) {
      let category = await Category.findOne({
        name: { $regex: new RegExp(`^${categoryInput.trim()}$`, "i") },
      });

      if (!category) {
        // Create new category
        category = new Category({
          name: categoryInput.trim(),
          description: `Auto-created category for ${categoryInput.trim()}`,
        });
        await category.save();
        console.log(`Created new category: ${category.name}`);
      }

      return category._id;
    }

    throw new Error("Invalid category input");
  } catch (error) {
    console.error("Error in findOrCreateCategory:", error);
    throw error;
  }
};

// Helper function to find or create supplier
const findOrCreateSupplier = async (supplierInput) => {
  try {
    // If it's already a valid ObjectId, return it
    if (
      mongoose.Types.ObjectId.isValid(supplierInput) &&
      supplierInput.length === 24
    ) {
      const existingSupplier = await Supplier.findById(supplierInput);
      if (existingSupplier) {
        return supplierInput;
      }
    }

    // If it's a string, try to find by name or create new
    if (typeof supplierInput === "string" && supplierInput.trim()) {
      let supplier = await Supplier.findOne({
        name: { $regex: new RegExp(`^${supplierInput.trim()}$`, "i") },
      });

      if (!supplier) {
        // Create new supplier with default values
        supplier = new Supplier({
          name: supplierInput.trim(),
          contact: "Auto-created contact",
          phone: "000-000-0000",
          address: "Address to be updated",
        });
        await supplier.save();
        console.log(`Created new supplier: ${supplier.name}`);
      }

      return supplier._id;
    }

    throw new Error("Invalid supplier input");
  } catch (error) {
    console.error("Error in findOrCreateSupplier:", error);
    throw error;
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
export const createProduct = asyncHandler(async (req, res) => {
  try {
    console.log("Creating product with data:", req.body);

    // Add creator information to the product
    if (req.user && req.user.id) {
      req.body.createdBy = req.user.id;
    }

    // Set creation timestamp
    req.body.createdAt = new Date();

    // Handle category - find existing or create new
    if (req.body.category) {
      req.body.category = await findOrCreateCategory(req.body.category);
    }

    // Handle supplier - find existing or create new
    if (req.body.supplier) {
      req.body.supplier = await findOrCreateSupplier(req.body.supplier);
    }

    // Handle file upload if there's a file
    if (req.files && req.files.image) {
      const fileName = processUploadedFile(req.files.image);
      req.body.image = fileName;
    }

    // Validate required fields
    if (!req.body.name || !req.body.price || !req.body.supplier) {
      return res.status(400).json({
        msg: "Missing required fields: name, price, and supplier are required",
      });
    }

    const product = new Product(req.body);
    const insert = await product.save();

    // Populate the response with full category and supplier details
    const populatedProduct = await Product.findById(insert._id)
      .populate("category", "name description")
      .populate("supplier", "name contact phone address")
      .populate("createdBy", "name");

    res.status(201).json({
      msg: "Product Created Successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error("Create product error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        msg: "Validation Error",
        errors: errors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        msg: "Duplicate entry detected",
        field: Object.keys(error.keyPattern)[0],
      });
    }

    res.status(400).json({ msg: error.message });
  }
});

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProduct = asyncHandler(async (req, res) => {
  try {
    let query = {};

    // Optional: If you want to filter by user role (uncomment if needed)
    // if (req.user && req.user.role === "karyawan") {
    //   query.createdBy = req.user.id;
    // }

    const products = await Product.find(query)
      .populate("category", "name description")
      .populate("supplier", "name contact phone address")
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProductById = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name description")
      .populate("supplier", "name contact phone address")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Optional: Check if user has access to this product (uncomment if needed)
    // if (
    //   req.user &&
    //   req.user.role === "karyawan" &&
    //   product.createdBy._id.toString() !== req.user.id
    // ) {
    //   return res
    //     .status(403)
    //     .json({ msg: "Not authorized to access this product" });
    // }

    res.json(product);
  } catch (error) {
    console.error("Get product by ID error:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Optional: Check if user has access to update this product (uncomment if needed)
    // if (
    //   req.user &&
    //   req.user.role === "karyawan" &&
    //   product.createdBy.toString() !== req.user.id
    // ) {
    //   return res
    //     .status(403)
    //     .json({ msg: "Not authorized to update this product" });
    // }

    // Handle category - find existing or create new
    if (req.body.category) {
      req.body.category = await findOrCreateCategory(req.body.category);
    }

    // Handle supplier - find existing or create new
    if (req.body.supplier) {
      req.body.supplier = await findOrCreateSupplier(req.body.supplier);
    }

    // Add updater information and timestamp
    if (req.user && req.user.id) {
      req.body.updatedBy = req.user.id;
    }
    req.body.updatedAt = new Date();

    // Handle file upload if there's a file
    if (req.files && req.files.image) {
      // Delete old image if it exists and is not the default image
      if (product.image && product.image !== "default-product.jpg") {
        const oldImagePath = path.join(uploadDir, product.image);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (error) {
            console.log("Error deleting old image:", error);
          }
        }
      }

      const fileName = processUploadedFile(req.files.image);
      req.body.image = fileName;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate("category", "name description")
      .populate("supplier", "name contact phone address")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    res.status(200).json({
      msg: "Product Updated Successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({ msg: "Product not found" });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        msg: "Validation Error",
        errors: errors,
      });
    }

    res.status(500).json({ msg: error.message });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Optional: Check if user has access to delete this product (uncomment if needed)
    // if (
    //   req.user &&
    //   req.user.role === "karyawan" &&
    //   product.createdBy.toString() !== req.user.id
    // ) {
    //   return res
    //     .status(403)
    //     .json({ msg: "Not authorized to delete this product" });
    // }

    // Delete product image if it exists and is not the default image
    if (product.image && product.image !== "default-product.jpg") {
      const imagePath = path.join(uploadDir, product.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (error) {
          console.log("Error deleting image:", error);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Product Deleted Successfully" });
  } catch (error) {
    console.error("Delete product error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({ msg: "Product not found" });
    }

    res.status(500).json({ msg: error.message });
  }
});

// @desc    Get product image
// @route   GET /api/products/image/:imageName
// @access  Public
export const getProductImage = asyncHandler(async (req, res) => {
  try {
    const imageName = req.params.imageName;
    const imagePath = path.join(uploadDir, imageName);

    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      // Send default image if requested image doesn't exist
      const defaultImagePath = path.join(uploadDir, "default-product.jpg");
      if (fs.existsSync(defaultImagePath)) {
        res.sendFile(defaultImagePath);
      } else {
        res.status(404).json({ msg: "Image not found" });
      }
    }
  } catch (error) {
    console.error("Get product image error:", error);
    res.status(500).json({ msg: "Error retrieving image" });
  }
});
