import mongoose from "mongoose";

const Product = new mongoose.Schema(
  {
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
      ref: "Categories",
    },
    supplier: {
      type: mongoose.Schema.ObjectId,
      ref: "Suppliers",
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
      default: null,
    },
  },
  {
    // Mongoose timestamps option - automatically adds createdAt and updatedAt fields
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    // Ensure virtual fields are included when converting to JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add a virtual field to format created date
Product.virtual("formattedCreatedAt").get(function () {
  return this.createdAt
    ? this.createdAt.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;
});

// Add a virtual field to format updated date
Product.virtual("formattedUpdatedAt").get(function () {
  return this.updatedAt
    ? this.updatedAt.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;
});

// Pre-save middleware to ensure updatedAt is set on updates
Product.pre("save", function (next) {
  // Only set updatedAt if this is not a new document and it has been modified
  if (!this.isNew && this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

// Pre-update middleware to ensure updatedAt is set on findByIdAndUpdate operations
Product.pre(["updateOne", "findOneAndUpdate"], function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

export default mongoose.model("Products", Product);
