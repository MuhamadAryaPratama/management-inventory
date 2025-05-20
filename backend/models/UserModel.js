import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // Adding the missing bcrypt import

const User = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Nama harus diisi"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email harus diisi"],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "Password harus diisi"],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ["pemilik", "karyawan"],
    default: "karyawan",
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
User.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
User.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Users", User);
