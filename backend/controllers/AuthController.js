import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { logUserLogin, logUserLogout } from "./LogController.js";

// Ensure we have fallback values if environment variables are not set
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_fallback";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your_refresh_token_secret_fallback";

// Email configuration - FIXED: createTransport instead of createTransporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

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

// Simplified email template for password reset - No token required
const createPasswordResetEmailTemplate = (user, resetCode) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Password - Sistem Inventori</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; text-align: center;">🔐 Reset Password</h1>
        <p style="color: white; text-align: center; margin: 10px 0 0 0; font-size: 16px;">Sistem Manajemen Inventori</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #495057; margin-top: 0;">Halo ${user.name},</h2>
        <p style="font-size: 16px; margin-bottom: 20px;">
          Kami menerima permintaan untuk mereset password akun Anda. Gunakan kode verifikasi di bawah ini 
          untuk mengatur password baru Anda.
        </p>
        <p style="font-size: 14px; color: #6c757d;">
          <strong>Waktu Permintaan:</strong> ${new Date().toLocaleString(
            "id-ID",
            {
              timeZone: "Asia/Jakarta",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }
          )}
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 20px; border-radius: 15px; 
                    display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
          <h3 style="margin: 0 0 10px 0; font-size: 18px;">🔑 Kode Reset Password</h3>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                      background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
            ${resetCode}
          </div>
        </div>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h4 style="color: #856404; margin-top: 0;">⚠️ Penting untuk Diketahui:</h4>
        <ul style="color: #856404; margin: 0;">
          <li>Kode reset password ini akan <strong>expired dalam 15 menit</strong></li>
          <li>Kode ini hanya dapat digunakan <strong>satu kali</strong></li>
          <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
          <li>Password lama Anda masih aktif sampai Anda menggantinya</li>
        </ul>
      </div>

      <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h4 style="color: #0c5460; margin-top: 0;">📝 Cara Menggunakan:</h4>
        <ol style="color: #0c5460; margin: 0;">
          <li>Buka halaman reset password di aplikasi</li>
          <li>Masukkan email Anda: <strong>${user.email}</strong></li>
          <li>Masukkan kode verifikasi: <strong>${resetCode}</strong></li>
          <li>Buat password baru yang kuat</li>
          <li>Konfirmasi password baru Anda</li>
        </ol>
      </div>

      <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h4 style="color: #721c24; margin-top: 0;">🛡️ Keamanan Akun:</h4>
        <p style="color: #721c24; margin: 0; font-size: 14px;">
          Jika Anda tidak meminta reset password, kemungkinan ada yang mencoba mengakses akun Anda. 
          Pastikan untuk menggunakan password yang kuat dan unik. Jika Anda mencurigai aktivitas yang tidak biasa, 
          segera hubungi administrator sistem.
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #6c757d; border-top: 1px solid #dee2e6;">
        <p style="margin: 0; font-size: 14px;">
          Email ini dikirim secara otomatis oleh Sistem Manajemen Inventori<br>
          Jangan membalas email ini. Untuk pertanyaan, hubungi administrator sistem.
        </p>
        <p style="margin: 10px 0 0 0; font-size: 12px;">
          © 2025 Sistem Manajemen Inventori. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
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

// Request password reset - Simplified without token
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

    // FIXED: Clear any existing reset code first
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Now set the new reset code
    user.passwordResetCode = resetCode;
    user.passwordResetExpires = resetCodeExpiry;

    // FIXED: Use findByIdAndUpdate to ensure atomic operation
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
      // Create transporter
      const transporter = createEmailTransporter();
      const emailTemplate = createPasswordResetEmailTemplate(user, resetCode);

      const mailOptions = {
        from: `"Sistem Inventori" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "🔐 Kode Reset Password - Sistem Inventori",
        html: emailTemplate,
      };

      console.log(`Sending password reset email to: ${user.email}`);
      const result = await transporter.sendMail(mailOptions);
      console.log("Password reset email sent successfully:", result.messageId);

      return res.status(200).json({
        success: true,
        message: "Kode reset password telah dikirim ke email Anda",
        emailSent: true,
        messageId: result.messageId,
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

// Validate reset code endpoint - FIXED VERSION
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

    // FIXED: Ensure both are strings and normalize properly
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

    // FIXED: Convert both to strings and trim for comparison
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

// Reset password with verification code (no token needed) - FIXED VERSION
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

    // FIXED: Ensure proper string normalization
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

    // FIXED: Proper string comparison
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

    // CRITICAL FIX: Use .save() method to trigger pre-save middleware for password hashing
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

// Test email function for password reset (for debugging)
export const sendTestPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required for testing" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create test reset code
    const testResetCode = "123456";

    const transporter = createEmailTransporter();
    const emailTemplate = createPasswordResetEmailTemplate(user, testResetCode);

    const mailOptions = {
      from: `"Sistem Inventori Test" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🧪 Test Kode Reset Password - Sistem Inventori",
      html: emailTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      "Test password reset email sent successfully:",
      result.messageId
    );

    return res.status(200).json({
      success: true,
      message: "Test email berhasil dikirim",
      messageId: result.messageId,
      recipient: user.email,
      testCode: testResetCode,
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

console.log("Auth Controller loaded successfully");
