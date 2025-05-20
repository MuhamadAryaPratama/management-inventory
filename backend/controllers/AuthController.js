import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";

// Register new user
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "karyawan",
    });

    if (user) {
      // Return only a success message instead of user details and token
      res.status(201).json({
        message: "Akun berhasil dibuat",
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.matchPassword(password))) {
      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // In a JWT-based auth system, the server doesn't maintain session state,
    // so we simply return a success message to the client
    // The client should remove the token from local storage or cookies
    res.status(200).json({
      success: true,
      message: "Berhasil logout",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "3m",
  });
};
