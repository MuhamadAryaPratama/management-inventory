// controllers/AuthController.js
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { logUserLogin, logUserLogout } from "./LogController.js";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendTestEmail,
  verifyEmailConfig,
} from "../service/authEmailService.js";

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

// Generate access token - short lived (15 minutes)
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
      // Send welcome email (don't block registration if email fails)
      try {
        const emailResult = await sendWelcomeEmail(user);
        if (emailResult.success) {
          console.log(`Welcome email sent to ${user.email}`);
        } else {
          console.warn(
            `Failed to send welcome email to ${user.email}:`,
            emailResult.error
          );
        }
      } catch (emailError) {
        console.warn(
          `Welcome email error for ${user.email}:`,
          emailError.message
        );
      }

      return res.status(201).json({
        message: "Akun berhasil dibuat",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
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

// Request password reset - Using email service
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Don't reveal whether email exists or not for security
      return res.status(200).json({
        success: true,
        message: "Jika email terdaftar, kode reset password telah dikirim",
      });
    }

    // Generate simple 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Clear any existing reset code first
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Set the new reset code using atomic operation
    const savedUser = await User.findByIdAndUpdate(
      user._id,
      {
        passwordResetCode: resetCode,
        passwordResetExpires: resetCodeExpiry,
      },
      { new: true }
    );

    console.log(`Reset code saved for ${user.email}: ${resetCode}`);
    console.log(`Saved user passwordResetCode:`, savedUser.passwordResetCode);
    console.log(
      `Reset code expires at: ${new Date(resetCodeExpiry).toISOString()}`
    );

    try {
      // Send password reset email using service
      const emailResult = await sendPasswordResetEmail(user, resetCode);

      return res.status(200).json({
        success: true,
        message: "Kode reset password telah dikirim ke email Anda",
        emailSent: true,
        messageId: emailResult.messageId,
        // Add debug info in development
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            resetCode,
            expiresAt: new Date(resetCodeExpiry).toISOString(),
            userFound: true,
            codeSaved: !!savedUser.passwordResetCode,
          },
        }),
      });
    } catch (emailError) {
      console.error("Email send error:", emailError);

      // Clear reset code if email fails
      await User.findByIdAndUpdate(user._id, {
        passwordResetCode: undefined,
        passwordResetExpires: undefined,
      });

      return res.status(500).json({
        success: false,
        message: "Gagal mengirim email. Silakan coba lagi.",
        error: emailError.message,
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during password reset request",
      error: error.message,
    });
  }
};

// Validate reset code endpoint
export const validateResetCode = async (req, res) => {
  try {
    const { email, resetCode } = req.body;

    console.log(`Validating reset code - Email: ${email}, Code: ${resetCode}`);

    if (!email || !resetCode) {
      return res.status(400).json({
        valid: false,
        message: "Email dan kode reset wajib diisi",
      });
    }

    // Ensure both are strings and normalize properly
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedResetCode = String(resetCode).trim();

    console.log(`Searching for user with email: ${normalizedEmail}`);
    console.log(`Normalized reset code: ${normalizedResetCode}`);

    // Find the user by email
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`No user found with email: ${normalizedEmail}`);
      return res.status(400).json({
        valid: false,
        message: "Email tidak ditemukan",
      });
    }

    console.log(`User found: ${user.email}`);
    console.log(`Stored reset code: "${user.passwordResetCode}"`);
    console.log(`Provided reset code: "${normalizedResetCode}"`);
    console.log(`Reset code type: ${typeof user.passwordResetCode}`);
    console.log(`Provided code type: ${typeof normalizedResetCode}`);
    console.log(
      `Reset code expires: ${user.passwordResetExpires ? new Date(user.passwordResetExpires).toISOString() : "Not set"}`
    );
    console.log(`Current time: ${new Date().toISOString()}`);

    // Check if reset code exists
    if (!user.passwordResetCode) {
      console.log("No reset code found for user");
      return res.status(400).json({
        valid: false,
        message:
          "Tidak ada kode reset yang aktif. Silakan minta kode reset baru.",
      });
    }

    // Convert both to strings and trim for comparison
    const storedCode = String(user.passwordResetCode).trim();
    const providedCode = String(normalizedResetCode).trim();

    console.log(
      `Final comparison - Stored: "${storedCode}" vs Provided: "${providedCode}"`
    );
    console.log(`Codes match: ${storedCode === providedCode}`);

    // Check if reset code matches
    if (storedCode !== providedCode) {
      console.log("Reset code mismatch");
      return res.status(400).json({
        valid: false,
        message: "Kode reset tidak valid",
        debug:
          process.env.NODE_ENV === "development"
            ? {
                storedCode,
                providedCode,
                match: storedCode === providedCode,
              }
            : undefined,
      });
    }

    // Check if reset code is expired
    if (!user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
      console.log("Reset code expired");
      return res.status(400).json({
        valid: false,
        message: "Kode reset sudah expired. Silakan minta kode baru.",
      });
    }

    console.log(`Reset code validation successful for user: ${user.email}`);

    // Calculate remaining time
    const remainingTime = Math.floor(
      (user.passwordResetExpires - Date.now()) / 1000 / 60
    );

    return res.status(200).json({
      valid: true,
      message: "Kode reset valid",
      userEmail: user.email.replace(/(.{2}).*(@.*)/, "$1***$2"),
      expiresAt: new Date(user.passwordResetExpires).toISOString(),
      remainingMinutes: remainingTime,
    });
  } catch (error) {
    console.error("Validate reset code error:", error);
    return res.status(500).json({
      valid: false,
      message: "Server error during code validation",
      error: error.message,
    });
  }
};

// Reset password with verification code (no token needed)
export const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, password, confirmPassword } = req.body;

    console.log(`Reset password attempt - Email: ${email}, Code: ${resetCode}`);

    // Enhanced validation
    if (!email || !resetCode || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Email, kode reset, password, dan konfirmasi password wajib diisi",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password dan konfirmasi password tidak sama",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter",
      });
    }

    // Ensure proper string normalization
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedResetCode = String(resetCode).trim();

    console.log(`Searching for user with email: ${normalizedEmail}`);

    // Find the user by email
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`No user found with email: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message: "Email tidak ditemukan",
      });
    }

    console.log(`User found: ${user.email}`);
    console.log(`Stored reset code: "${user.passwordResetCode}"`);
    console.log(`Provided reset code: "${normalizedResetCode}"`);

    // Check if reset code exists
    if (!user.passwordResetCode) {
      console.log("No reset code found for user");
      return res.status(400).json({
        success: false,
        message: "Kode reset tidak ditemukan. Silakan minta kode reset baru.",
      });
    }

    // Proper string comparison
    const storedCode = String(user.passwordResetCode).trim();
    const providedCode = String(normalizedResetCode).trim();

    console.log(
      `Final comparison - Stored: "${storedCode}" vs Provided: "${providedCode}"`
    );

    // Check if reset code matches
    if (storedCode !== providedCode) {
      console.log("Reset code mismatch");
      return res.status(400).json({
        success: false,
        message: "Kode reset tidak valid",
      });
    }

    // Check if reset code is expired
    if (!user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
      console.log("Reset code expired");
      return res.status(400).json({
        success: false,
        message: "Kode reset sudah expired. Silakan minta kode baru.",
      });
    }

    console.log("All validations passed, updating password...");

    // CRITICAL: Use .save() method to trigger pre-save middleware for password hashing
    // Instead of findByIdAndUpdate which bypasses middleware hooks
    user.password = password; // Set new password (will be hashed by pre-save hook)
    user.passwordResetCode = undefined; // Clear reset code
    user.passwordResetExpires = undefined; // Clear expiry
    user.refreshToken = null; // Clear existing refresh tokens for security

    // Save the user - this will trigger pre-save middleware to hash the password
    await user.save();

    console.log(`Password reset successful for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message:
        "Password berhasil direset. Silakan login dengan password baru Anda.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during password reset",
      error: error.message,
    });
  }
};

// Test email function - Using email service
export const sendTestPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required for testing" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // For testing, we can use a mock user or find existing user
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Create a mock user object for testing if user doesn't exist
      user = {
        name: "Test User",
        email: normalizedEmail,
        role: "test",
      };
    }

    // Create test reset code
    const testResetCode = "123456";

    // Use email service to send test email
    const emailResult = await sendTestEmail(normalizedEmail, testResetCode);

    return res.status(200).json({
      success: true,
      message: "Test email berhasil dikirim",
      messageId: emailResult.messageId,
      recipient: emailResult.recipient,
      testCode: emailResult.testCode,
    });
  } catch (error) {
    console.error("Error sending test password reset email:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengirim test email",
      error: error.message,
    });
  }
};

// Verify email configuration endpoint
export const verifyEmailConfiguration = async (req, res) => {
  try {
    const result = await verifyEmailConfig();

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.message,
      error: result.error || null,
    });
  } catch (error) {
    console.error("Email configuration verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying email configuration",
      error: error.message,
    });
  }
};

console.log("Auth Controller loaded successfully");
