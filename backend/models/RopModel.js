import mongoose from "mongoose";

const ROP = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: true,
    unique: true,
  },
  leadTime: {
    type: Number,
    required: [true, "Please add lead time in days"],
    min: [0, "Lead time cannot be negative"],
  },
  dailyDemand: {
    type: Number,
    required: [true, "Please add daily demand"],
    min: [0, "Daily demand cannot be negative"],
  },
  rop: {
    type: Number,
    min: [0, "ROP cannot be negative"],
  },
  lastCalculated: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("ROP", ROP);
