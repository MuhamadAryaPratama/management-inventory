import mongoose from "mongoose";

const Product = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Product price is required"],
    min: [0, "Price cannot be negative"],
  },
  currentStock: {
    type: Number,
    default: 0,
    min: [0, "Stock cannot be negative"],
  },
  minStock: {
    type: Number,
    default: 0,
    min: [0, "Minimum stock cannot be negative"],
  },
  image: {
    type: String,
    default: "default-product.jpg",
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: "Category",
  },
  supplier: {
    type: mongoose.Schema.ObjectId,
    ref: "Supplier",
    required: [true, "Supplier is required"],
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: "Users",
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "Users",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

export default mongoose.model("Products", Product);
