import mongoose from "mongoose";

const Transaction = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Products",
    required: [true, "Product is required"],
  },
  type: {
    type: String,
    enum: ["pembelian", "penjualan"],
    required: [true, "Transaction type is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be greater than 0"],
  },
  price: {
    type: Number,
    min: [0, "Price cannot be negative"],
    required: function () {
      return this.type === "penjualan";
    },
  },
  total: {
    type: Number,
    default: 0,
    min: [0, "Total cannot be negative"],
  },
  stockChange: {
    type: Number,
    required: [true, "Stock change is required"],
    validate: {
      validator: function (value) {
        if (this.type === "pembelian") {
          return value > 0;
        } else if (this.type === "penjualan") {
          return value < 0;
        }
        return true;
      },
      message:
        "Stock change must be positive for purchases and negative for sales",
    },
  },
  previousStock: {
    type: Number,
    required: [true, "Previous stock is required"],
    min: [0, "Previous stock cannot be negative"],
  },
  newStock: {
    type: Number,
    required: [true, "New stock is required"],
    min: [0, "New stock cannot be negative"],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, "Notes cannot exceed 500 characters"],
    default: "",
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "Users",
    required: [true, "User is required"],
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

// Pre-save middleware
Transaction.pre("save", function (next) {
  if (this.price && this.quantity) {
    this.total = this.quantity * this.price;
  }

  if (this.type === "pembelian") {
    if (this.newStock !== this.previousStock + this.quantity) {
      return next(
        new Error("Stock calculation error for purchase transaction")
      );
    }
  } else if (this.type === "penjualan") {
    if (this.newStock !== this.previousStock - this.quantity) {
      return next(new Error("Stock calculation error for sale transaction"));
    }
  }

  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }

  next();
});

// Pre-validate middleware
Transaction.pre("validate", function (next) {
  if (this.type === "pembelian" && this.stockChange <= 0) {
    return next(
      new Error("Stock change must be positive for purchase transactions")
    );
  }

  if (this.type === "penjualan" && this.stockChange >= 0) {
    return next(
      new Error("Stock change must be negative for sale transactions")
    );
  }

  next();
});

// Indexes
Transaction.index({ product: 1, createdAt: -1 });
Transaction.index({ user: 1, createdAt: -1 });
Transaction.index({ type: 1, createdAt: -1 });
Transaction.index({ product: 1, type: 1 });
Transaction.index({ createdAt: -1 });
Transaction.index({ createdBy: 1 });

// Virtual for transaction description - with null check
Transaction.virtual("description").get(function () {
  const typeDesc = this.type === "pembelian" ? "Barang Masuk" : "Barang Keluar";
  let productName = "Product";

  // Check if product is populated or exists
  if (this.product) {
    if (typeof this.product === "object" && this.product.name) {
      productName = this.product.name;
    } else if (typeof this.product === "string") {
      productName = "Product ID: " + this.product;
    }
  }

  return `${typeDesc} - ${productName} (${this.quantity} unit)`;
});

// Virtual for formatted total
Transaction.virtual("formattedTotal").get(function () {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(this.total);
});

// Virtual for transaction status
Transaction.virtual("transactionStatus").get(function () {
  return {
    type: this.type,
    typeLabel: this.type === "pembelian" ? "Barang Masuk" : "Barang Keluar",
    stockImpact: this.type === "pembelian" ? "increase" : "decrease",
    quantity: this.quantity,
    value: this.total || 0,
  };
});

// Ensure virtual fields are serialized
Transaction.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

Transaction.set("toObject", {
  virtuals: true,
});

// Add schema post-find hook to validate product existence
Transaction.post("find", async function (docs) {
  if (!Array.isArray(docs)) return;

  const Product = mongoose.model("Products");
  const existingProductIds = new Set();

  // Check which products still exist
  for (const doc of docs) {
    if (doc.product && !existingProductIds.has(doc.product.toString())) {
      const productExists = await Product.exists({ _id: doc.product });
      if (!productExists) {
        // If product doesn't exist, delete the transaction
        await this.model.deleteMany({ product: doc.product });
        console.log(
          `Deleted transactions for non-existent product ${doc.product}`
        );
      } else {
        existingProductIds.add(doc.product.toString());
      }
    }
  }
});

// Add pre-save validation to check product existence
Transaction.pre("save", async function (next) {
  if (this.product) {
    const Product = mongoose.model("Products");
    const productExists = await Product.exists({ _id: this.product });
    if (!productExists) {
      return next(new Error("Product does not exist"));
    }
  }
  next();
});

export default mongoose.model("Transactions", Transaction);
