// File: models/UserLogModel.js
import mongoose from "mongoose";

const userLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    loginTime: {
      type: Date,
      required: true,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // in milliseconds
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "logout"],
      default: "active",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
userLogSchema.index({ userId: 1, status: 1 });
userLogSchema.index({ status: 1, loginTime: -1 });
userLogSchema.index({ loginTime: 1 });

const UserLog = mongoose.model("UserLog", userLogSchema);

export default UserLog;
