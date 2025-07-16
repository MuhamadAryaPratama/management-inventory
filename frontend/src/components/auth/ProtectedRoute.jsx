import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import {
  isTokenExpired,
  refreshUserToken,
  logout,
} from "../utils/SessionTimeout";

const ProtectedRoute = () => {
  const checkAuth = () => {
    const token = localStorage.getItem("userToken");
    const userData = localStorage.getItem("userData");
    return token && !isTokenExpired() && userData;
  };

  const [authenticated, setAuthenticated] = React.useState(checkAuth());
  const [wasAuthenticated, setWasAuthenticated] = React.useState(
    !!localStorage.getItem("userToken")
  );

  useEffect(() => {
    const verifyToken = async () => {
      if (isTokenExpired()) {
        const result = await refreshUserToken();
        setAuthenticated(result.success);
        if (!result.success) {
          logout();
          setWasAuthenticated(true); // User was previously authenticated
        }
      }
    };

    const interval = setInterval(verifyToken, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        state={
          wasAuthenticated
            ? {
                message: "Your session has expired. Please log in again.",
                alertType: "warning",
              }
            : null
        }
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
