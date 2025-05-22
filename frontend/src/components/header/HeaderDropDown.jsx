import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CAvatar,
} from "@coreui/react";
import { setTokenWithExpiry } from "../utils/SessionTimeout";

const AppHeaderDropdown = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user data from API
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("userToken");

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:5000/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for refresh token
      });

      if (response.status === 401) {
        // Token expired, try to refresh it
        const refreshResponse = await fetch(
          "http://localhost:5000/api/auth/refresh-token",
          {
            method: "POST",
            credentials: "include", // Include cookies for refresh token
          }
        );

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          // Update token in localStorage
          localStorage.setItem("userToken", refreshData.token);
          setTokenWithExpiry(refreshData.token);

          // Dispatch an event to notify other components about token refresh
          window.dispatchEvent(new Event("userLoggedIn"));

          // Retry the original request with the new token
          const retryResponse = await fetch(
            "http://localhost:5000/api/auth/me",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${refreshData.token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (retryResponse.ok) {
            const userData = await retryResponse.json();
            setUser(userData);
            localStorage.setItem("userData", JSON.stringify(userData));
            setLoading(false);
            return;
          }
        }

        // If refresh failed or retry failed, log the user out
        handleLogout();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch user data: ${response.status} ${errorText}`
        );
      }

      const userData = await response.json();
      setUser(userData);

      localStorage.setItem("userData", JSON.stringify(userData));
      setTokenWithExpiry(token);
    } catch (error) {
      console.error("Error fetching user data:", error.message || error);
      const cachedUserData = localStorage.getItem("userData");
      if (cachedUserData) {
        try {
          setUser(JSON.parse(cachedUserData));
        } catch (e) {
          console.error("Error parsing cached user data:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch user data on component mount
    fetchUserData();

    // Set up event listeners to refresh data when needed
    const handleStorageChange = (event) => {
      if (event.key === "userToken") {
        fetchUserData();
      }
    };

    const handleLoginChange = () => fetchUserData();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUserData();
      }
    };

    // Add event listeners
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userLoggedIn", handleLoginChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up refresh interval (every 15 minutes)
    const refreshInterval = setInterval(fetchUserData, 15 * 60 * 1000);

    // Cleanup function
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userLoggedIn", handleLoginChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("userToken");

      if (token) {
        // Call logout endpoint
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for refresh token
        });
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Clear user data from localStorage
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("tokenExpiry");

      // Update component state
      setUser(null);

      // Dispatch an event to notify other components
      window.dispatchEvent(new Event("userLoggedOut"));

      // Redirect to login page
      navigate("/login");
    }
  };

  // Fixed profile navigation
  const handleProfileClick = () => {
    navigate("/profile");
  };

  // Fixed settings navigation
  const handleSettingsClick = () => {
    navigate("/settings");
  };

  // Get display name from user data or use fallback
  const displayName = user?.name || "User";
  // Get avatar initial
  const avatarInitial = displayName.charAt(0).toUpperCase();

  // Show avatar with loading state
  const renderAvatar = () => {
    if (loading) {
      return (
        <CAvatar color="secondary" textColor="white">
          ...
        </CAvatar>
      );
    }
    return (
      <CAvatar color="primary" textColor="white">
        {avatarInitial}
      </CAvatar>
    );
  };

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0" caret={false}>
        {renderAvatar()}
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownItem onClick={handleProfileClick}>
          <div className="fw-semibold">{displayName}</div>
        </CDropdownItem>
        <CDropdownItem divider="true" />
        <CDropdownItem onClick={handleProfileClick}>Profile</CDropdownItem>
        <CDropdownItem onClick={handleSettingsClick}>Settings</CDropdownItem>
        <CDropdownItem divider="true" />
        <CDropdownItem onClick={handleLogout}>Logout</CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  );
};

export default AppHeaderDropdown;
