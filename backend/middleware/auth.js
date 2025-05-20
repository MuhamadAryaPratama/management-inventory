import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Get token from header
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if no token
  if (!token) {
    res.status(401);
    throw new Error("Not authorized to access this route");
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    req.user = await User.findById(decoded.id).select("-password");

    // Update lastLogin
    await User.findByIdAndUpdate(decoded.id, { lastLogin: Date.now() });

    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized to access this route");
  }
});

export const role = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `User role ${req.user.role} is not authorized to access this route`
      );
    }
    next();
  });
};
