import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";

// Ensure we have the JWT_SECRET available
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_fallback";

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
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from the token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ message: "Token expired", tokenExpired: true });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    } else {
      console.error("Auth middleware error:", error);
      return res
        .status(500)
        .json({ message: "Server error during authentication" });
    }
  }
});

export const role = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  });
};
