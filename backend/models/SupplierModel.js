import mongoose from "mongoose";

const Supplier = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a supplier name"],
    trim: true,
    maxlength: [100, "Name cannot be more than 100 characters"],
  },
  contact: {
    type: String,
    required: [true, "Please add a contact person"],
    maxlength: [50, "Contact cannot be more than 50 characters"],
  },
  phone: {
    type: String,
    required: [true, "Please add a phone number"],
    maxlength: [20, "Phone number cannot be more than 20 characters"],
  },
  address: {
    type: String,
    required: [true, "Please add an address"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Suppliers", Supplier);
