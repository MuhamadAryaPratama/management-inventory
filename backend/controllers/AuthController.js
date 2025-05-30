import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import { logUserLogin, logUserLogout } from "./LogController.js";

// Ensure we have fallback values if environment variables are not set
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_fallback";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your_refresh_token_secret_fallback";

// Helper function to get client IP address
const getClientIP = (req) => {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    "Unknown"
  );
};

// Generate access token - short lived (15 minutes - more reasonable than 3 minutes)
export const generateAccessToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "15m",
  });
};

// Generate refresh token - longer lived (7 days)
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

// Register new user
export const register = async (req, res) => {
  const { name, phone, address, email, password, role } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create({
      name,
      phone,
      address,
      email,
      password,
      role: role || "karyawan",
    });

    if (user) {
      return res.status(201).json({
        message: "Akun berhasil dibuat",
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Register error:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (isMatch) {
      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token in the database
      user.refreshToken = refreshToken;
      user.lastLogin = Date.now();
      await user.save();

      // Log the login activity
      const clientIP = getClientIP(req);
      const userAgent = req.headers["user-agent"] || "Unknown";
      logUserLogin(user._id.toString(), user.name, clientIP, userAgent);

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      return res.json({
        success: true,
        message: "Login successful",
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          address: user.address,
          email: user.email,
          role: user.role,
        },
        token: accessToken,
      });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
};

export const logout = async (req, res) => {
  try {
    // Find user by ID
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log the logout activity before clearing tokens
    const clientIP = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "Unknown";
    logUserLogout(user._id.toString(), user.name, clientIP, userAgent);

    // Clear refresh token in database
    user.refreshToken = null;
    await user.save();

    // Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Berhasil logout",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error during logout" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

      // Check if user exists and token matches
      const user = await User.findById(decoded.id);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      // Generate new access token
      const accessToken = generateAccessToken(user._id);

      return res.json({
        success: true,
        token: accessToken,
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          address: user.address,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res
          .status(403)
          .json({ message: "Refresh token expired, please login again" });
      }

      return res.status(403).json({ message: "Invalid refresh token" });
    }
  } catch (error) {
    console.error("Refresh token error:", error);
    return res
      .status(500)
      .json({ message: "Server error during token refresh" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("GetMe error:", error);
    return res
      .status(500)
      .json({ message: "Server error retrieving user data" });
  }
};
