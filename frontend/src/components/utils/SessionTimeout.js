/**
 * Session timeout utility to handle user inactivity
 * This will automatically log out users after a specified period of inactivity
 */

const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds
let timeoutId = null;
let warningId = null;
let isWarningShown = false;

/**
 * Initialize the session timeout tracker
 * @param {Function} logoutCallback - Function to call when timeout occurs
 */
export const initSessionTimeout = (logoutCallback) => {
  // Reset timeout on user activity
  const resetTimeout = () => {
    clearTimeout(timeoutId);
    clearTimeout(warningId);
    isWarningShown = false;

    // Hide any existing warning modal
    const existingModal = document.getElementById("session-timeout-modal");
    if (existingModal) {
      existingModal.style.opacity = "0";
      existingModal.style.visibility = "hidden";
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      // First show warning if not already shown
      if (!isWarningShown) {
        isWarningShown = true;
        // Dispatch custom event that components can listen for
        window.dispatchEvent(
          new CustomEvent("sessionTimeoutWarning", {
            detail: { remainingTime: 30 }, // 30 seconds warning
          })
        );

        // Set timeout for final logout after warning
        warningId = setTimeout(() => {
          logoutCallback();
        }, 30000); // 30 seconds after warning
      }
    }, INACTIVITY_TIMEOUT - 30000); // Show warning 30 seconds before timeout
  };

  // Start watching for user activity
  const startActivityTracking = () => {
    // List of events that indicate user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
    ];

    // Add event listeners for each activity type
    activityEvents.forEach((event) => {
      document.addEventListener(event, resetTimeout, { passive: true });
    });

    // Initial timeout setup
    resetTimeout();
  };

  // Function to cleanup event listeners
  const stopActivityTracking = () => {
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
    ];

    activityEvents.forEach((event) => {
      document.removeEventListener(event, resetTimeout);
    });

    clearTimeout(timeoutId);
    clearTimeout(warningId);
  };

  // Return methods to control the timeout tracking
  return {
    start: startActivityTracking,
    stop: stopActivityTracking,
    reset: resetTimeout,
  };
};

/**
 * Check if the current token is expired based on expiry time
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = () => {
  const tokenExpiry = localStorage.getItem("tokenExpiry");
  if (!tokenExpiry) return true;

  const expiryTime = parseInt(tokenExpiry, 10);
  return Date.now() > expiryTime;
};

/**
 * Set token with expiration time
 * @param {string} token - The authentication token
 */
export const setTokenWithExpiry = (token) => {
  if (!token) return;

  localStorage.setItem("userToken", token);
  // Set token expiry to current time + 3 minutes
  const expiry = Date.now() + INACTIVITY_TIMEOUT;
  localStorage.setItem("tokenExpiry", expiry.toString());
};

/**
 * Refresh the user token by calling the refresh token endpoint
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} Result of refresh operation
 */
export const refreshUserToken = async () => {
  try {
    // Get current token for authorization header
    const currentToken = localStorage.getItem("userToken");

    const response = await fetch(
      "http://localhost:5000/api/auth/refresh-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
        },
        credentials: "include", // Include cookies for refresh token
      }
    );

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`Failed to refresh token: ${errorMessage}`);
    }

    const data = await response.json();

    // Handle different possible response structures
    const newToken = data.token || data.accessToken || data.newToken;

    if (!newToken) {
      throw new Error("No token received from refresh endpoint");
    }

    // Save the new token with expiry
    setTokenWithExpiry(newToken);

    // If the API also returns user data, update it
    if (data.user) {
      localStorage.setItem("userData", JSON.stringify(data.user));
    }

    // Update token expiry time in localStorage
    if (data.expiresIn) {
      const expiry = Date.now() + data.expiresIn * 1000; // Convert to milliseconds
      localStorage.setItem("tokenExpiry", expiry.toString());
    }

    // Dispatch an event to notify other components that token was refreshed
    window.dispatchEvent(
      new CustomEvent("tokenRefreshed", {
        detail: { token: newToken, userData: data.user },
      })
    );

    console.log("Token refreshed successfully");
    return { success: true, data };
  } catch (error) {
    console.error("Error refreshing token:", error);

    // Clear invalid tokens on refresh failure
    localStorage.removeItem("userToken");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("userData");

    return { success: false, error: error.message };
  }
};

/**
 * Create a timeout warning modal component with improved continue session functionality
 * @returns {Object} Modal control object
 */
export const createTimeoutWarningModal = () => {
  // Remove existing modal if it exists
  const existingModal = document.getElementById("session-timeout-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal elements
  const modalOverlay = document.createElement("div");
  modalOverlay.id = "session-timeout-modal";
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  `;

  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 8px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    position: relative;
  `;

  const title = document.createElement("h3");
  title.textContent = "Session Timeout Warning";
  title.style.cssText = `
    margin-bottom: 15px;
    color: #333;
    font-size: 1.2em;
  `;

  const message = document.createElement("p");
  message.id = "timeout-message";
  message.textContent =
    "Your session will expire in 30 seconds due to inactivity.";
  message.style.cssText = `
    margin-bottom: 20px;
    color: #666;
    line-height: 1.4;
  `;

  const statusMessage = document.createElement("p");
  statusMessage.id = "status-message";
  statusMessage.style.cssText = `
    margin-bottom: 15px;
    color: #666;
    font-size: 0.9em;
    min-height: 20px;
  `;

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  `;

  const continueButton = document.createElement("button");
  continueButton.id = "continue-session";
  continueButton.textContent = "Continue Session";
  continueButton.style.cssText = `
    padding: 10px 20px;
    background-color: #321fdb;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
    min-width: 140px;
  `;

  const logoutButton = document.createElement("button");
  logoutButton.id = "logout-now";
  logoutButton.textContent = "Logout Now";
  logoutButton.style.cssText = `
    padding: 10px 20px;
    background-color: #e55353;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
    min-width: 120px;
  `;

  // Add hover effects
  continueButton.addEventListener("mouseenter", () => {
    if (!continueButton.disabled) {
      continueButton.style.backgroundColor = "#2819c7";
    }
  });
  continueButton.addEventListener("mouseleave", () => {
    if (!continueButton.disabled) {
      continueButton.style.backgroundColor = "#321fdb";
    }
  });

  logoutButton.addEventListener("mouseenter", () => {
    if (!logoutButton.disabled) {
      logoutButton.style.backgroundColor = "#d63947";
    }
  });
  logoutButton.addEventListener("mouseleave", () => {
    if (!logoutButton.disabled) {
      logoutButton.style.backgroundColor = "#e55353";
    }
  });

  // Append elements
  buttonContainer.appendChild(continueButton);
  buttonContainer.appendChild(logoutButton);
  modalContent.appendChild(title);
  modalContent.appendChild(message);
  modalContent.appendChild(statusMessage);
  modalContent.appendChild(buttonContainer);
  modalOverlay.appendChild(modalContent);

  // Add to document body
  document.body.appendChild(modalOverlay);

  // Modal control object
  const modalController = {
    show: () => {
      modalOverlay.style.opacity = "1";
      modalOverlay.style.visibility = "visible";
    },

    hide: () => {
      modalOverlay.style.opacity = "0";
      modalOverlay.style.visibility = "hidden";
      // Remove modal after animation
      setTimeout(() => {
        if (modalOverlay.parentNode) {
          modalOverlay.parentNode.removeChild(modalOverlay);
        }
      }, 300);
    },

    setCountdown: (seconds) => {
      message.textContent = `Your session will expire in ${seconds} seconds due to inactivity.`;
    },

    setStatus: (text, isError = false) => {
      statusMessage.textContent = text;
      statusMessage.style.color = isError ? "#e55353" : "#28a745";
    },

    disableButtons: () => {
      continueButton.disabled = true;
      logoutButton.disabled = true;
      continueButton.style.opacity = "0.6";
      logoutButton.style.opacity = "0.6";
      continueButton.style.cursor = "not-allowed";
      logoutButton.style.cursor = "not-allowed";
    },

    enableButtons: () => {
      continueButton.disabled = false;
      logoutButton.disabled = false;
      continueButton.style.opacity = "1";
      logoutButton.style.opacity = "1";
      continueButton.style.cursor = "pointer";
      logoutButton.style.cursor = "pointer";
    },

    remove: () => {
      if (modalOverlay.parentNode) {
        modalOverlay.parentNode.removeChild(modalOverlay);
      }
    },

    // Get button references for external event handling
    getContinueButton: () => continueButton,
    getLogoutButton: () => logoutButton,
  };

  return modalController;
};
