import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import {
  ADMIN_SESSION_HEARTBEAT_MS,
  clearLocalAdminSession,
  hasLocalAdminSession,
  refreshAdminSession,
} from "../utils/adminSession";

export default function ProtectedAdminRoute() {
  const location = useLocation();

  const [sessionState, setSessionState] =
    useState("checking");

  const verificationRunning = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function verifyAdminSession() {
      if (verificationRunning.current) return;

      verificationRunning.current = true;

      try {
        // Hide a protected page while its database
        // session is being checked.
        document.documentElement.style.visibility =
          "hidden";

        if (!hasLocalAdminSession()) {
          clearLocalAdminSession();

          if (mounted.current) {
            setSessionState("unauthenticated");
          }

          return;
        }

        const validSession =
          await refreshAdminSession();

        if (!validSession) {
          clearLocalAdminSession();

          if (mounted.current) {
            setSessionState("unauthenticated");
          }

          return;
        }

        if (mounted.current) {
          setSessionState("authenticated");
        }

        document.documentElement.style.visibility = "";
      } catch (error) {
        console.error(
          "Unable to verify administrator session:",
          error
        );

        clearLocalAdminSession();

        if (mounted.current) {
          setSessionState("unauthenticated");
        }
      } finally {
        verificationRunning.current = false;
      }
    }

    function verifyAfterHistoryChange() {
      setSessionState("checking");
      verifyAdminSession();
    }

    verifyAdminSession();

    const heartbeat = window.setInterval(
      verifyAdminSession,
      ADMIN_SESSION_HEARTBEAT_MS
    );

    window.addEventListener(
      "pageshow",
      verifyAfterHistoryChange
    );

    window.addEventListener(
      "popstate",
      verifyAfterHistoryChange
    );

    window.addEventListener(
      "focus",
      verifyAdminSession
    );

    window.addEventListener(
      "storage",
      verifyAfterHistoryChange
    );

    window.addEventListener(
      "admin-session-ended",
      verifyAfterHistoryChange
    );

    return () => {
      mounted.current = false;

      window.clearInterval(heartbeat);

      window.removeEventListener(
        "pageshow",
        verifyAfterHistoryChange
      );

      window.removeEventListener(
        "popstate",
        verifyAfterHistoryChange
      );

      window.removeEventListener(
        "focus",
        verifyAdminSession
      );

      window.removeEventListener(
        "storage",
        verifyAfterHistoryChange
      );

      window.removeEventListener(
        "admin-session-ended",
        verifyAfterHistoryChange
      );

      document.documentElement.style.visibility = "";
    };
  }, []);

  useEffect(() => {
    if (
      sessionState === "authenticated" ||
      sessionState === "unauthenticated"
    ) {
      document.documentElement.style.visibility = "";
    }
  }, [sessionState]);

  if (sessionState === "checking") {
    return null;
  }

  if (sessionState === "unauthenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}