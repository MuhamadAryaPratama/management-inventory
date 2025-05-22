import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isTokenExpired } from "../utils/SessionTimeout";

/**
 * ProtectedRoute component to guard routes that require authentication
 * Checks if user is authenticated and token is not expired
 */
const ProtectedRoute = () => {
  const token = localStorage.getItem("userToken");
  const isAuthenticated = token && !isTokenExpired();

  if (!isAuthenticated) {
    // Redirect to login page with a message if token is expired or missing
    return (
      <Navigate
        to="/login"
        state={
          token
            ? {
                message: "Your session has expired. Please log in again.",
                alertType: "warning",
              }
            : {
                message: "You need to log in to access this page.",
                alertType: "info",
              }
        }
        replace
      />
    );
  }

  // User is authenticated, render the protected route
  return <Outlet />;
};

export default ProtectedRoute;
