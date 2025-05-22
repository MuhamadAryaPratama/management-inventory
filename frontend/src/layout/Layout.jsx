import React, { useState, useEffect, useCallback } from "react";
import {
  CSidebar,
  CSidebarNav,
  CSidebarBrand,
  CSidebarToggler,
  CContainer,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CToast,
  CToastBody,
  CToastHeader,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilMenu } from "@coreui/icons";
import { AppHeaderDropdown } from "../components/header";
import SidebarContent from "../components/sidebar/SidebarContent";
import { Outlet, useNavigate } from "react-router-dom";
import {
  initSessionTimeout,
  isTokenExpired,
  createTimeoutWarningModal,
  refreshUserToken,
  setTokenWithExpiry,
} from "../components/utils/SessionTimeout";

const Layout = () => {
  const [sidebarShow, setSidebarShow] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showTimeoutToast, setShowTimeoutToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState("warning");
  const navigate = useNavigate();

  // Automatic logout function
  const handleSessionTimeout = useCallback(() => {
    // Clear user data from localStorage
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("tokenExpiry");

    // Dispatch an event to notify other components
    window.dispatchEvent(new Event("userLoggedOut"));

    // Show timeout notification
    setToastMessage(
      "Your session has expired due to inactivity. Redirecting to login..."
    );
    setToastColor("warning");
    setShowTimeoutToast(true);

    // Redirect to login after a short delay
    setTimeout(() => {
      navigate("/login", {
        state: {
          message:
            "Your session has expired due to inactivity. Please log in again.",
          alertType: "warning",
        },
      });
    }, 1500);
  }, [navigate]);

  // Check token validity on component mount and when it becomes visible
  useEffect(() => {
    const checkTokenValidity = () => {
      if (isTokenExpired()) {
        handleSessionTimeout();
      }
    };

    // Check initially
    checkTokenValidity();

    // Also check when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkTokenValidity();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleSessionTimeout]);

  // Set up the session timeout manager
  useEffect(() => {
    // Initialize timeout manager with logout callback
    const sessionManager = initSessionTimeout(handleSessionTimeout);

    // Create timeout warning modal
    const timeoutModal = createTimeoutWarningModal();

    // Handle the warning event
    const handleTimeoutWarning = () => {
      timeoutModal.show();
      let secondsLeft = 30;

      const countdownInterval = setInterval(() => {
        secondsLeft -= 1;
        timeoutModal.setCountdown(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

      // Set up continue button
      const continueBtn = document.getElementById("continue-session");
      if (continueBtn) {
        continueBtn.onclick = async () => {
          // Show a loading state for the button
          continueBtn.textContent = "Refreshing...";
          continueBtn.disabled = true;

          try {
            // Call the refresh token endpoint
            const refreshResponse = await fetch(
              "http://localhost:5000/api/auth/refresh-token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include", // Include cookies for refresh token
              }
            );

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();

              // Update token in localStorage
              localStorage.setItem("userToken", refreshData.token);
              setTokenWithExpiry(refreshData.token);

              // Update user data if available
              if (refreshData.user) {
                localStorage.setItem(
                  "userData",
                  JSON.stringify(refreshData.user)
                );
              }

              // Reset the session timeout
              sessionManager.reset();

              // Hide the modal and clear the countdown
              timeoutModal.hide();
              clearInterval(countdownInterval);

              // Show success notification
              setToastMessage("Your session has been refreshed successfully.");
              setToastColor("success");
              setShowTimeoutToast(true);

              // Dispatch an event to notify other components about token refresh
              window.dispatchEvent(new Event("userLoggedIn"));

              // Stay on the current page - no navigation needed
            } else {
              // If refresh token fails, perform logout
              timeoutModal.hide();
              clearInterval(countdownInterval);
              handleSessionTimeout();
            }
          } catch (error) {
            console.error("Error during session refresh:", error);
            // If refresh token fails, perform logout
            timeoutModal.hide();
            clearInterval(countdownInterval);
            handleSessionTimeout();
          }
        };
      }

      // Set up logout button
      const logoutBtn = document.getElementById("logout-now");
      if (logoutBtn) {
        logoutBtn.onclick = () => {
          timeoutModal.hide();
          clearInterval(countdownInterval);
          handleSessionTimeout();
        };
      }
    };

    window.addEventListener("sessionTimeoutWarning", handleTimeoutWarning);

    // Start tracking user activity
    sessionManager.start();

    // Cleanup function
    return () => {
      sessionManager.stop();
      window.removeEventListener("sessionTimeoutWarning", handleTimeoutWarning);
    };
  }, [handleSessionTimeout]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      // Only auto-hide sidebar on initial load or when transitioning to mobile
      if (mobile) {
        setSidebarShow(false);
      } else {
        setSidebarShow(true);
      }
    };
    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check authentication when component mounts
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="d-flex">
      {/* Session timeout toast notification */}
      {showTimeoutToast && (
        <CToast
          visible={true}
          className="position-fixed top-0 end-0 m-3"
          color={toastColor}
          onClose={() => setShowTimeoutToast(false)}
          autohide={true}
          delay={3000}
        >
          <CToastHeader closeButton>
            <strong className="me-auto">Session Notice</strong>
          </CToastHeader>
          <CToastBody>{toastMessage}</CToastBody>
        </CToast>
      )}

      {/* Sidebar */}
      <CSidebar
        position="fixed"
        visible={sidebarShow}
        onVisibleChange={(visible) => {
          setSidebarShow(visible);
        }}
        className={sidebarShow && isMobile ? "c-sidebar-show" : ""}
      >
        <CSidebarBrand className="d-none d-md-flex" to="/">
          <div className="sidebar-brand-full">Inventory System</div>
          <div className="sidebar-brand-narrow">IS</div>
        </CSidebarBrand>
        <CSidebarNav>
          <SidebarContent />
        </CSidebarNav>
        <CSidebarToggler
          className="d-none d-lg-flex"
          onClick={() => setSidebarShow(!sidebarShow)}
        />
      </CSidebar>

      {/* Main content area */}
      <div
        className="wrapper d-flex flex-column min-vh-100 bg-light"
        style={{
          marginLeft: sidebarShow && !isMobile ? "250px" : "0",
          transition: "margin-left 0.3s",
        }}
      >
        {/* Header with hamburger menu */}
        <CHeader position="sticky" className="mb-4">
          <CContainer fluid>
            <CHeaderToggler
              className="ps-1"
              onClick={() => setSidebarShow(!sidebarShow)}
            >
              <CIcon icon={cilMenu} size="lg" />
            </CHeaderToggler>
            <CHeaderNav className="ms-auto">
              <AppHeaderDropdown />
            </CHeaderNav>
          </CContainer>
        </CHeader>

        {/* Content */}
        <div className="body flex-grow-1 px-3">
          <CContainer fluid>
            <Outlet />
          </CContainer>
        </div>

        {/* Footer */}
        <CContainer fluid>
          <div className="footer d-flex flex-wrap justify-content-between align-items-center py-2 my-4 border-top">
            <p className="col-md-4 mb-0 text-muted">
              © 2025 Inventory Management System
            </p>
          </div>
        </CContainer>
      </div>

      {/* Mobile overlay to close sidebar when clicked outside */}
      {sidebarShow && isMobile && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarShow(false)}
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1025,
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        />
      )}
    </div>
  );
};

export default Layout;
