import { useState, useEffect } from "react";
import { isTokenExpired } from "../components/utils/SessionTimeout";

// Custom hook for authentication and role management
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem("userToken");
        const userData = localStorage.getItem("userData");

        // Check if token exists and is not expired
        if (token && !isTokenExpired() && userData) {
          const parsedUserData = JSON.parse(userData);
          setUser({
            ...parsedUserData,
            token,
          });
        } else {
          // Clear invalid/expired data
          localStorage.removeItem("userToken");
          localStorage.removeItem("userData");
          localStorage.removeItem("userRole");
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        // Clear corrupted data
        localStorage.removeItem("userToken");
        localStorage.removeItem("userData");
        localStorage.removeItem("userRole");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  // Check if user can access a feature
  const canAccess = (allowedRoles) => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
  };

  // Get user role
  const getUserRole = () => {
    return user?.role || null;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem("userToken");
    return token && !isTokenExpired() && !!user;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("userRole");
    setUser(null);
    window.location.href = "/login";
  };

  // Login function
  const login = (userData, token) => {
    try {
      localStorage.setItem("userToken", token);
      localStorage.setItem("userData", JSON.stringify(userData));
      localStorage.setItem("userRole", userData.role);
      setUser({
        ...userData,
        token,
      });
    } catch (error) {
      console.error("Error storing user data:", error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    hasRole,
    hasAnyRole,
    canAccess,
    getUserRole,
    login,
    logout,
  };
};

// Role constants for consistency
export const ROLES = {
  PEMILIK: "pemilik",
  KARYAWAN: "karyawan",
};

// Permission configurations
export const PERMISSIONS = {
  ROP_ACCESS: [ROLES.PEMILIK],
  EOQ_ACCESS: [ROLES.PEMILIK],
  USER_MANAGEMENT: [ROLES.PEMILIK],
  LOG_ACCESS: [ROLES.PEMILIK],
  PRODUCT_MANAGEMENT: [ROLES.PEMILIK, ROLES.KARYAWAN],
  TRANSACTION_MANAGEMENT: [ROLES.PEMILIK, ROLES.KARYAWAN],
  REPORT_ACCESS: [ROLES.PEMILIK],
};
