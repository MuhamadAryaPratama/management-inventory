import mongoose from "mongoose";

const EOQ = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Products",
    required: true,
    unique: true,
  },
  orderingCost: {
    type: Number,
    required: [true, "Please add ordering cost per order"],
    min: [0, "Ordering cost cannot be negative"],
  },
  holdingCost: {
    type: Number,
    required: [true, "Please add holding cost per unit per year"],
    min: [0, "Holding cost cannot be negative"],
  },
  annualDemand: {
    type: Number,
    required: [true, "Please add annual demand"],
    min: [0, "Annual demand cannot be negative"],
  },
  eoq: {
    type: Number,
    min: [0, "EOQ cannot be negative"],
  },
  orderFrequency: {
    type: Number,
    min: [0, "Order frequency cannot be negative"],
  },
  totalCost: {
    type: Number,
    min: [0, "Total cost cannot be negative"],
  },
  lastCalculated: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("EOQ", EOQ);
