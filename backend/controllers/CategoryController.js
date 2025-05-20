import Category from "../models/CategoryModel.js";
import asyncHandler from "express-async-handler";

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
export const createCategory = asyncHandler(async (req, res) => {
  try {
    const category = new Category(req.body);
    const insert = await category.save();

    res.status(201).json({
      msg: "Category Created Successfully",
      category: insert,
    });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
export const getCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
export const getCategoryById = asyncHandler(async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    res.json(category);
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = asyncHandler(async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json({
      msg: "Category Updated Successfully",
      category: updatedCategory,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }

    await Category.deleteOne({ _id: req.params.id });
    res.status(200).json({ msg: "Category Deleted Successfully" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});
