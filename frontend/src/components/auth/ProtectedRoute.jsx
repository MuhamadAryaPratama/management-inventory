import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("userToken");

  if (!isAuthenticated) {
    // Redirect to login if user is not authenticated
    // Save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
