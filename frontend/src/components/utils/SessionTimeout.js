const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 menit
const WARNING_TIME = 30 * 1000; // Tampilkan peringatan 30 detik sebelum timeout

let timeoutId = null;
let warningId = null;
let isWarningShown = false;

export const setTokenWithExpiry = (token) => {
  if (!token) return;
  localStorage.setItem("userToken", token);
  const expiry = Date.now() + INACTIVITY_TIMEOUT;
  localStorage.setItem("tokenExpiry", expiry.toString());
};

export const isTokenExpired = () => {
  const tokenExpiry = localStorage.getItem("tokenExpiry");
  if (!tokenExpiry) return true;
  return Date.now() > parseInt(tokenExpiry, 10);
};

export const refreshUserToken = async () => {
  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/refresh-token",
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const newToken = data.token;

    if (!newToken) throw new Error("No token received");

    setTokenWithExpiry(newToken);

    if (data.user) {
      localStorage.setItem("userData", JSON.stringify(data.user));
    }

    return { success: true, data: { token: newToken, user: data.user } };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return { success: false, error: error.message };
  }
};

export const logout = () => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("tokenExpiry");
  localStorage.removeItem("userData");
  localStorage.removeItem("userRole");

  fetch("http://localhost:5000/api/auth/logout", {
    method: "POST",
    credentials: "include",
  }).catch((err) => console.error("Logout error:", err));

  window.location.href = "/login";
};

export const initSessionTimeout = (onTimeout, onWarning) => {
  const resetTimeout = () => {
    clearTimeout(timeoutId);
    clearTimeout(warningId);
    isWarningShown = false;

    timeoutId = setTimeout(() => {
      if (!isWarningShown) {
        isWarningShown = true;
        onWarning();

        warningId = setTimeout(() => {
          onTimeout();
        }, WARNING_TIME);
      }
    }, INACTIVITY_TIMEOUT - WARNING_TIME);
  };

  const startTracking = () => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((e) => document.addEventListener(e, resetTimeout));
    resetTimeout();
  };

  const stopTracking = () => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((e) => document.removeEventListener(e, resetTimeout));
    clearTimeout(timeoutId);
    clearTimeout(warningId);
  };

  return { start: startTracking, stop: stopTracking, reset: resetTimeout };
};

export const createTimeoutModal = (onContinue, onCancel) => {
  // Hapus modal jika sudah ada
  const existingModal = document.getElementById("session-timeout-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "session-timeout-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 400px;
    width: 90%;
    text-align: center;
  `;

  const title = document.createElement("h3");
  title.textContent = "Sesi Anda Akan Berakhir";
  title.style.marginBottom = "1rem";

  const message = document.createElement("p");
  message.textContent =
    "Sesi Anda akan berakhir karena tidak ada aktivitas. Lanjutkan sesi?";
  message.style.marginBottom = "2rem";

  const buttonGroup = document.createElement("div");
  buttonGroup.style.display = "flex";
  buttonGroup.style.gap = "1rem";
  buttonGroup.style.justifyContent = "center";

  const continueBtn = document.createElement("button");
  continueBtn.textContent = "Lanjut";
  continueBtn.style.cssText = `
    padding: 0.5rem 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  continueBtn.onclick = async () => {
    continueBtn.disabled = true;
    cancelBtn.disabled = true;
    continueBtn.textContent = "Memproses...";

    try {
      const result = await refreshUserToken();
      if (result.success) {
        modal.remove();
        // Reset timer setelah refresh berhasil
        initSessionTimeout(onTimeout, onWarning).reset();
      } else {
        message.textContent =
          "Gagal memperpanjang sesi. Silakan login kembali.";
        setTimeout(() => logout(), 2000);
      }
    } catch (error) {
      message.textContent = "Terjadi kesalahan. Silakan login kembali.";
      setTimeout(() => logout(), 2000);
    }
  };

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Batal";
  cancelBtn.style.cssText = `
    padding: 0.5rem 1rem;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  cancelBtn.onclick = () => {
    logout();
  };

  buttonGroup.appendChild(continueBtn);
  buttonGroup.appendChild(cancelBtn);
  modalContent.appendChild(title);
  modalContent.appendChild(message);
  modalContent.appendChild(buttonGroup);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  return {
    remove: () => modal.remove(),
    updateMessage: (text) => (message.textContent = text),
  };
};
