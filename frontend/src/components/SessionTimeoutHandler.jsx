import { useEffect } from "react";
import {
  initSessionTimeout,
  createTimeoutModal,
  logout,
} from "../components/utils/SessionTimeout";
import { useAuth } from "../hooks/useAuth";

const SessionTimeoutHandler = () => {
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated;

  useEffect(() => {
    // Periksa apakah user sudah terautentikasi
    // Jika isAuthenticated adalah boolean, gunakan langsung
    // Jika isAuthenticated adalah function, panggil dulu
    let authStatus;
    if (typeof isAuthenticated === "function") {
      authStatus = isAuthenticated();
    } else {
      authStatus = isAuthenticated;
    }

    // Jika tidak terautentikasi, jangan jalankan timeout
    if (!authStatus) return;

    const handleTimeout = () => {
      logout();
    };

    const handleWarning = () => {
      createTimeoutModal(
        async () => {
          try {
            // Panggil fungsi refresh token jika tersedia
            const refreshResult = await auth.refreshUserToken?.();
            if (!refreshResult?.success) {
              logout();
            }
          } catch (error) {
            console.error("Failed to refresh token:", error);
            logout();
          }
        },
        () => logout()
      );
    };

    const { start, stop } = initSessionTimeout(handleTimeout, handleWarning);
    start();

    return () => {
      stop();
    };
  }, [auth, isAuthenticated]);

  return null;
};

export default SessionTimeoutHandler;
