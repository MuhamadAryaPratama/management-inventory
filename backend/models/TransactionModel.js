import mongoose from "mongoose";

const Transaction = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Products",
    required: true,
  },
  type: {
    type: String,
    enum: ["pembelian", "penjualan", "penyesuaian"],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Jumlah minimal 1"],
  },
  price: {
    type: Number,
    required: function () {
      return this.type === "penjualan";
    },
  },
  total: Number,
  notes: String,
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "Users", // Fixed reference to match the model name
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate total before save
Transaction.pre("save", function (next) {
  if (this.type === "penjualan") {
    this.total = this.price * this.quantity;
  }
  next();
});

export default mongoose.model("Transactions", Transaction);
