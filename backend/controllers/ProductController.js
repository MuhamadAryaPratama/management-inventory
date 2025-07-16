import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";
import Supplier from "../models/SupplierModel.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

// Import email service functions
import {
  checkAndNotifyLowStock,
  checkAllProductsLowStock,
} from "../service/productEmailService.js";

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

    // Validate required fields
    if (!req.body.name || !req.body.price || !req.body.supplier) {
      return res.status(400).json({
        msg: "Missing required fields: name, price, and supplier are required",
      });
    }

    const product = new Product(req.body);
    const insert = await product.save();

    // Check for low stock after creating product using email service
    await checkAndNotifyLowStock(insert);

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

    // Store original stock values for comparison
    const originalCurrentStock = product.currentStock;
    const originalMinStock = product.minStock;

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

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate("category", "name description")
      .populate("supplier", "name contact phone address")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    // Check if stock levels changed and if notification is needed
    const newCurrentStock =
      req.body.currentStock !== undefined
        ? req.body.currentStock
        : originalCurrentStock;
    const newMinStock =
      req.body.minStock !== undefined ? req.body.minStock : originalMinStock;

    // Check for low stock if stock values changed using email service
    if (
      newCurrentStock !== originalCurrentStock ||
      newMinStock !== originalMinStock
    ) {
      const productForCheck = {
        ...updatedProduct.toObject(),
        currentStock: newCurrentStock,
        minStock: newMinStock,
      };
      await checkAndNotifyLowStock(productForCheck);
    }

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

    // Use remove() instead of findByIdAndDelete() to trigger pre-remove hooks
    await product.remove();

    res
      .status(200)
      .json({ msg: "Product and related transactions deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({ msg: "Product not found" });
    }

    res.status(500).json({ msg: error.message });
  }
});

// @desc    Check all products for low stock and send notifications
// @route   POST /api/products/check-low-stock
// @access  Private (Admin/Pemilik only)
export const checkAllLowStock = asyncHandler(async (req, res) => {
  try {
    const result = await checkAllProductsLowStock();

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error("Check all low stock error:", error);
    res.status(500).json({
      success: false,
      msg: error.message,
      stack: error.stack,
    });
  }
});
