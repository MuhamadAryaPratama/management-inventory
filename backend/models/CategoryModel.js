import mongoose from "mongoose";

const Category = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a category name"],
    unique: true,
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },
  description: {
    type: String,
    maxlength: [200, "Description cannot be more than 200 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Categories", Category);
