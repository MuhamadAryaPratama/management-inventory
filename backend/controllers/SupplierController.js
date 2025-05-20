import Supplier from "../models/SupplierModel.js";
import asyncHandler from "express-async-handler";

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private
export const createSupplier = asyncHandler(async (req, res) => {
  try {
    // Add creator information if needed (uncomment if you track who created suppliers)
    // req.body.createdBy = req.user.id;

    const supplier = new Supplier(req.body);
    const insert = await supplier.save();

    res.status(201).json({
      msg: "Supplier Created Successfully",
      supplier: insert,
    });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
export const getSuppliers = asyncHandler(async (req, res) => {
  try {
    // You can add query filters here if needed
    const suppliers = await Supplier.find().sort({ name: 1 });

    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
export const getSupplierById = asyncHandler(async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      res.status(404);
      throw new Error("Supplier not found");
    }

    res.json(supplier);
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
export const updateSupplier = asyncHandler(async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      res.status(404);
      throw new Error("Supplier not found");
    }

    // Add updater information if needed
    // req.body.updatedBy = req.user.id;
    // req.body.updatedAt = Date.now();

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      msg: "Supplier Updated Successfully",
      supplier: updatedSupplier,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
export const deleteSupplier = asyncHandler(async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      res.status(404);
      throw new Error("Supplier not found");
    }

    // Check if this supplier is used by any products before deleting
    // You might want to add this functionality if needed
    // const productsUsingSupplier = await Product.countDocuments({ supplier: req.params.id });
    // if (productsUsingSupplier > 0) {
    //   res.status(400);
    //   throw new Error("Cannot delete supplier because it is used by existing products");
    // }

    await Supplier.deleteOne({ _id: req.params.id });
    res.status(200).json({ msg: "Supplier Deleted Successfully" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});
