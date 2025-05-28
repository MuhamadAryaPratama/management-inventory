import express from "express";
import { protect, role } from "../middleware/auth.js";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/UserController.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router
  .route("/")
  .get(protect, role("pemilik"), asyncHandler(getUsers))
  .post(protect, role("pemilik"), asyncHandler(createUser));

router
  .route("/:id")
  .get(protect, asyncHandler(getUserById))
  .put(protect, role("pemilik"), asyncHandler(updateUser))
  .delete(protect, role("pemilik"), asyncHandler(deleteUser));

export default router;
