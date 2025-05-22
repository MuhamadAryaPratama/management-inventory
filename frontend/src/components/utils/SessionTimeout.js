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
      document.addEventListener(event, resetTimeout);
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
 * @returns {Promise<boolean>} Whether the refresh was successful
 */
export const refreshUserToken = async () => {
  try {
    // Call refresh token endpoint - we don't need to pass token in header for refresh
    const response = await fetch(
      "http://localhost:5000/api/auth/refresh-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();

    // Save the new token with expiry
    setTokenWithExpiry(data.token || data.newToken);

    // If the API also returns user data, update it
    if (data.user) {
      localStorage.setItem("userData", JSON.stringify(data.user));
    }

    // Dispatch an event to notify other components
    window.dispatchEvent(new Event("userLoggedIn"));

    return true;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return false;
  }
};

/**
 * Create a timeout warning modal component
 * @returns {HTMLElement} The warning modal element
 */
export const createTimeoutWarningModal = () => {
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
  `;

  const title = document.createElement("h3");
  title.textContent = "Session Timeout Warning";
  title.style.marginBottom = "15px";

  const message = document.createElement("p");
  message.id = "timeout-message";
  message.textContent =
    "Your session will expire in 30 seconds due to inactivity.";
  message.style.marginBottom = "20px";

  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "center";
  buttonContainer.style.gap = "10px";

  const continueButton = document.createElement("button");
  continueButton.id = "continue-session";
  continueButton.textContent = "Continue Session";
  continueButton.style.cssText = `
    padding: 8px 16px;
    background-color: #321fdb;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;

  const logoutButton = document.createElement("button");
  logoutButton.id = "logout-now";
  logoutButton.textContent = "Logout Now";
  logoutButton.style.cssText = `
    padding: 8px 16px;
    background-color: #e55353;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;

  // Append elements
  buttonContainer.appendChild(continueButton);
  buttonContainer.appendChild(logoutButton);
  modalContent.appendChild(title);
  modalContent.appendChild(message);
  modalContent.appendChild(buttonContainer);
  modalOverlay.appendChild(modalContent);

  // Add to document body
  document.body.appendChild(modalOverlay);

  return {
    show: () => {
      modalOverlay.style.opacity = "1";
      modalOverlay.style.visibility = "visible";
    },
    hide: () => {
      modalOverlay.style.opacity = "0";
      modalOverlay.style.visibility = "hidden";
    },
    setCountdown: (seconds) => {
      message.textContent = `Your session will expire in ${seconds} seconds due to inactivity.`;
    },
  };
};
