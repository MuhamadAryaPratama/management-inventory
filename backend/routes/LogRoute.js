import express from "express";
import {
  getUserLogs,
  getUserLogsByUserId,
  getActiveSessions,
  getLoginStats,
  forceLogoutUser,
  getDurationServiceStatus,
} from "../controllers/LogController.js";
import { protect, role } from "../middleware/auth.js";
import UserLog from "../models/UserLogModel.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Single route to handle all log operations
router
  .route("/")
  .get(async (req, res) => {
    const {
      type,
      page = 1,
      limit = 10,
      status,
      userId,
      startDate,
      endDate,
      search,
    } = req.query;

    try {
      switch (type) {
        case "active":
          // Get active sessions (admin only)
          if (req.user.role !== "pemilik") {
            return res.status(403).json({
              success: false,
              message: "Access denied. Admin role required.",
            });
          }
          return await getActiveSessions(req, res);

        case "stats":
          // Get statistics (admin only)
          if (req.user.role !== "pemilik") {
            return res.status(403).json({
              success: false,
              message: "Access denied. Admin role required.",
            });
          }
          return await getLoginStats(req, res);

        case "user":
          // Get logs for specific user (admin only)
          if (req.user.role !== "pemilik") {
            return res.status(403).json({
              success: false,
              message: "Access denied. Admin role required.",
            });
          }
          if (!userId) {
            return res.status(400).json({
              success: false,
              message: "userId parameter is required for user type",
            });
          }
          req.params.userId = userId;
          return await getUserLogsByUserId(req, res);

        case "my-logs":
          // Get current user's own logs
          const skip = (parseInt(page) - 1) * parseInt(limit);

          const logs = await UserLog.find({ userId: req.user._id })
            .sort({ loginTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

          const total = await UserLog.countDocuments({ userId: req.user._id });

          const formattedLogs = logs.map((log) => ({
            _id: log._id,
            loginTime: log.loginTime,
            logoutTime: log.logoutTime,
            duration: log.duration ? formatDuration(log.duration) : null,
            status: log.status,
          }));

          return res.status(200).json({
            success: true,
            data: formattedLogs,
            pagination: {
              currentPage: parseInt(page),
              totalPages: Math.ceil(total / parseInt(limit)),
              totalItems: total,
              itemsPerPage: parseInt(limit),
            },
          });

        default:
          // Get all logs (admin only)
          if (req.user.role !== "pemilik") {
            return res.status(403).json({
              success: false,
              message: "Access denied. Admin role required.",
            });
          }
          return await getUserLogs(req, res);
      }
    } catch (error) {
      console.error("Error in log route:", error);
      return res.status(500).json({
        success: false,
        message: "Server error processing request",
      });
    }
  })
  .post(async (req, res) => {
    const { type, userId } = req.body;

    try {
      if (type === "force-logout") {
        // Force logout user (admin only)
        if (req.user.role !== "pemilik") {
          return res.status(403).json({
            success: false,
            message: "Access denied. Admin role required.",
          });
        }

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: "userId is required for force logout",
          });
        }

        req.params.userId = userId;
        return await forceLogoutUser(req, res);
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid operation type",
        });
      }
    } catch (error) {
      console.error("Error in log POST route:", error);
      return res.status(500).json({
        success: false,
        message: "Server error processing request",
      });
    }
  });

const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};
router.get("/service-status", getDurationServiceStatus);

export default router;
