import UserLog from "../models/UserLogModel.js";
import User from "../models/UserModel.js";

// Log user login
export const logUserLogin = async (userId, name) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found for logging:", userId);
      return;
    }

    const logEntry = new UserLog({
      userId,
      name,
      email: user.email,
      loginTime: new Date(),
      status: "active",
    });

    await logEntry.save();
    console.log(`Login logged for user: ${name}`);
  } catch (error) {
    console.error("Error logging user login:", error);
  }
};

// Log user logout
export const logUserLogout = async (userId, name) => {
  try {
    // Find the most recent active session for this user
    const activeLog = await UserLog.findOne({
      userId,
      status: "active",
    }).sort({ loginTime: -1 });

    if (activeLog) {
      const logoutTime = new Date();
      const duration = logoutTime - activeLog.loginTime;

      activeLog.logoutTime = logoutTime;
      activeLog.duration = duration;
      activeLog.status = "logout";

      await activeLog.save();
      console.log(
        `Logout logged for user: ${name}, Duration: ${formatDuration(duration)}`
      );
    } else {
      console.log(`No active session found for user: ${name}`);
    }
  } catch (error) {
    console.error("Error logging user logout:", error);
  }
};

// Helper function to calculate current duration for active sessions
const calculateCurrentDuration = (loginTime) => {
  return Date.now() - loginTime.getTime();
};

// Update active sessions duration in real-time (background task)
export const updateActiveSessionsDuration = async () => {
  try {
    const activeSessions = await UserLog.find({ status: "active" });

    if (activeSessions.length === 0) {
      return; // No active sessions to update
    }

    const updatePromises = activeSessions.map(async (session) => {
      const currentDuration = calculateCurrentDuration(session.loginTime);

      // Update the duration field in the database for active sessions
      await UserLog.findByIdAndUpdate(session._id, {
        duration: currentDuration,
        lastUpdated: new Date(),
      });
    });

    await Promise.all(updatePromises);
    console.log(
      `Updated ${activeSessions.length} active session durations at ${new Date().toISOString()}`
    );
  } catch (error) {
    console.error("Error updating active sessions duration:", error);
  }
};

// Start periodic update of active sessions (call this when server starts)
let durationUpdateInterval;

export const startDurationUpdateService = () => {
  // Clear any existing interval first
  if (durationUpdateInterval) {
    clearInterval(durationUpdateInterval);
  }

  // Update every 10 seconds for more real-time experience
  durationUpdateInterval = setInterval(updateActiveSessionsDuration, 10000);
  console.log("✅ Duration update service started - updating every 10 seconds");

  // Run initial update
  updateActiveSessionsDuration();
};

export const stopDurationUpdateService = () => {
  if (durationUpdateInterval) {
    clearInterval(durationUpdateInterval);
    durationUpdateInterval = null;
    console.log("❌ Duration update service stopped");
  }
};

// Get all user logs with filtering (no pagination)
export const getUserLogs = async (req, res) => {
  try {
    const { status, userId, startDate, endDate, search } = req.query;

    // Build query object
    const query = {};

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.loginTime = {};
      if (startDate) {
        query.loginTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.loginTime.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get all logs matching the query
    const logs = await UserLog.find(query)
      .populate("userId", "name email role")
      .sort({ loginTime: -1 });

    // Format logs for response
    const formattedLogs = logs.map((log) => {
      let currentDuration;
      let durationMs;

      if (log.status === "active") {
        // For active sessions, always calculate real-time duration
        currentDuration = calculateCurrentDuration(log.loginTime);
        durationMs = currentDuration;
      } else {
        // For logged out sessions, use stored duration
        currentDuration = log.duration;
        durationMs = log.duration;
      }

      return {
        _id: log._id,
        userId: log.userId._id,
        name: log.name,
        email: log.email,
        role: log.userId.role,
        loginTime: log.loginTime,
        logoutTime: log.logoutTime,
        duration: currentDuration ? formatDuration(currentDuration) : null,
        durationMs: durationMs,
        status: log.status,
        createdAt: log.createdAt,
        lastUpdated: log.lastUpdated,
        isActive: log.status === "active",
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedLogs,
      totalItems: formattedLogs.length,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error getting user logs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving user logs",
    });
  }
};

// Get logs for a specific user (no pagination)
export const getUserLogsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    // Build query
    const query = { userId };
    if (status) {
      query.status = status;
    }

    const logs = await UserLog.find(query)
      .populate("userId", "name email role")
      .sort({ loginTime: -1 });

    const formattedLogs = logs.map((log) => {
      let currentDuration;
      let durationMs;

      if (log.status === "active") {
        // For active sessions, always calculate real-time duration
        currentDuration = calculateCurrentDuration(log.loginTime);
        durationMs = currentDuration;
      } else {
        // For logged out sessions, use stored duration
        currentDuration = log.duration;
        durationMs = log.duration;
      }

      return {
        _id: log._id,
        name: log.name,
        email: log.email,
        role: log.userId.role,
        loginTime: log.loginTime,
        logoutTime: log.logoutTime,
        duration: currentDuration ? formatDuration(currentDuration) : null,
        durationMs: durationMs,
        status: log.status,
        createdAt: log.createdAt,
        lastUpdated: log.lastUpdated,
        isActive: log.status === "active",
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedLogs,
      totalItems: formattedLogs.length,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error getting user logs by user ID:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving user logs",
    });
  }
};

// Get active sessions (currently logged in users) - no pagination
export const getActiveSessions = async (req, res) => {
  try {
    const activeLogs = await UserLog.find({ status: "active" })
      .populate("userId", "name email role")
      .sort({ loginTime: -1 });

    const formattedLogs = activeLogs.map((log) => {
      const currentDuration = calculateCurrentDuration(log.loginTime);

      return {
        _id: log._id,
        userId: log.userId._id,
        name: log.name,
        email: log.email,
        role: log.userId.role,
        loginTime: log.loginTime,
        currentDuration: formatDuration(currentDuration),
        currentDurationMs: currentDuration,
        status: log.status,
        lastUpdated: log.lastUpdated,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedLogs,
      totalItems: formattedLogs.length,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error getting active sessions:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving active sessions",
    });
  }
};

// Get login statistics with real-time active session durations
export const getLoginStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.loginTime = {};
      if (startDate) {
        dateFilter.loginTime.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.loginTime.$lte = new Date(endDate);
      }
    }

    // Get statistics
    const totalLogins = await UserLog.countDocuments(dateFilter);
    const activeUsers = await UserLog.countDocuments({
      ...dateFilter,
      status: "active",
    });
    const loggedOutUsers = await UserLog.countDocuments({
      ...dateFilter,
      status: "logout",
    });

    // Get unique users count
    const uniqueUsers = await UserLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$userId" } },
      { $count: "uniqueUsers" },
    ]);

    // Get average session duration (only for completed sessions)
    const avgDuration = await UserLog.aggregate([
      {
        $match: {
          ...dateFilter,
          status: "logout",
          duration: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$duration" },
        },
      },
    ]);

    // Calculate total active session duration with real-time calculation
    const activeSessions = await UserLog.find({
      ...dateFilter,
      status: "active",
    });

    let totalActiveSessionDuration = 0;
    activeSessions.forEach((session) => {
      totalActiveSessionDuration += calculateCurrentDuration(session.loginTime);
    });

    // Calculate average active session duration
    const avgActiveSessionDuration =
      activeSessions.length > 0
        ? totalActiveSessionDuration / activeSessions.length
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalLogins,
        activeUsers,
        loggedOutUsers,
        uniqueUsers: uniqueUsers[0]?.uniqueUsers || 0,
        averageSessionDuration: avgDuration[0]
          ? formatDuration(avgDuration[0].avgDuration)
          : "N/A",
        averageSessionDurationMs: avgDuration[0]?.avgDuration || 0,
        averageActiveSessionDuration: formatDuration(avgActiveSessionDuration),
        averageActiveSessionDurationMs: avgActiveSessionDuration,
        totalActiveSessionDuration: formatDuration(totalActiveSessionDuration),
        totalActiveSessionDurationMs: totalActiveSessionDuration,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error("Error getting login stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving login statistics",
    });
  }
};

// Helper function to format duration
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

// Force logout a user (admin function)
export const forceLogoutUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find active sessions for this user
    const activeSessions = await UserLog.find({
      userId,
      status: "active",
    });

    if (activeSessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active sessions found for this user",
      });
    }

    // Update all active sessions to logout
    const logoutTime = new Date();
    const updatePromises = activeSessions.map(async (session) => {
      const duration = logoutTime - session.loginTime;
      session.logoutTime = logoutTime;
      session.duration = duration;
      session.status = "logout";
      return session.save();
    });

    await Promise.all(updatePromises);

    // Also clear refresh token in user model
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    return res.status(200).json({
      success: true,
      message: `Successfully logged out ${activeSessions.length} active session(s)`,
    });
  } catch (error) {
    console.error("Error force logging out user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during force logout",
    });
  }
};

// Get real-time session duration for a specific user
export const getUserSessionDuration = async (req, res) => {
  try {
    const { userId } = req.params;

    const activeSession = await UserLog.findOne({
      userId,
      status: "active",
    }).sort({ loginTime: -1 });

    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: "No active session found for this user",
      });
    }

    const currentDuration = calculateCurrentDuration(activeSession.loginTime);

    return res.status(200).json({
      success: true,
      data: {
        userId: activeSession.userId,
        name: activeSession.name,
        email: activeSession.email,
        loginTime: activeSession.loginTime,
        currentDuration: formatDuration(currentDuration),
        currentDurationMs: currentDuration,
        status: activeSession.status,
        lastCalculated: new Date(),
      },
    });
  } catch (error) {
    console.error("Error getting user session duration:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving session duration",
    });
  }
};

// Get real-time duration for all active sessions (for dashboard)
export const getRealTimeActiveSessions = async (req, res) => {
  try {
    const activeLogs = await UserLog.find({ status: "active" })
      .populate("userId", "name email role")
      .sort({ loginTime: -1 });

    const realTimeData = activeLogs.map((log) => {
      const currentDuration = calculateCurrentDuration(log.loginTime);

      return {
        _id: log._id,
        userId: log.userId._id,
        name: log.name,
        email: log.email,
        role: log.userId.role,
        loginTime: log.loginTime,
        currentDuration: formatDuration(currentDuration),
        currentDurationMs: currentDuration,
        durationInSeconds: Math.floor(currentDuration / 1000),
        durationInMinutes: Math.floor(currentDuration / (1000 * 60)),
        durationInHours: Math.floor(currentDuration / (1000 * 60 * 60)),
        status: log.status,
        timestamp: new Date(),
      };
    });

    return res.status(200).json({
      success: true,
      data: realTimeData,
      totalActiveSessions: realTimeData.length,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error getting real-time active sessions:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving real-time session data",
    });
  }
};

// Health check for duration service
export const getDurationServiceStatus = async (req, res) => {
  try {
    const isRunning =
      durationUpdateInterval !== null && durationUpdateInterval !== undefined;
    const activeSessionsCount = await UserLog.countDocuments({
      status: "active",
    });

    return res.status(200).json({
      success: true,
      data: {
        serviceStatus: isRunning ? "running" : "stopped",
        activeSessionsCount,
        updateInterval: "10 seconds",
        lastCheck: new Date(),
      },
    });
  } catch (error) {
    console.error("Error checking duration service status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error checking service status",
    });
  }
};
