import { useCallback, useEffect, useRef, useState } from "react";
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

  const mountedRef = useRef(true);
  const verificationPromiseRef = useRef(null);

  const verifyAdminSession = useCallback(
    async ({ showChecking = false } = {}) => {
      /*
        If another verification is already running, reuse it instead
        of starting another request.

        This prevents overlapping focus / heartbeat / history checks
        from leaving the page stuck in a loading state.
      */
      if (verificationPromiseRef.current) {
        if (showChecking && mountedRef.current) {
          setSessionState("checking");
        }

        return verificationPromiseRef.current;
      }

      if (showChecking && mountedRef.current) {
        setSessionState("checking");
      }

      const verificationPromise = (async () => {
        try {
          /*
            No local Admin or no local session token means this
            browser is not authenticated.
          */
          if (!hasLocalAdminSession()) {
            clearLocalAdminSession();

            if (mountedRef.current) {
              setSessionState("unauthenticated");
            }

            return false;
          }

          /*
            Verify the local token against the active session stored
            in the ADMIN table.
          */
          const validSession =
            await refreshAdminSession();

          if (!validSession) {
            clearLocalAdminSession();

            if (mountedRef.current) {
              setSessionState("unauthenticated");
            }

            return false;
          }

          if (mountedRef.current) {
            setSessionState("authenticated");
          }

          return true;
        } catch (error) {
          console.error(
            "Unable to verify administrator session:",
            error
          );

          /*
            If Supabase explicitly fails while verifying the session,
            treat the local session as invalid rather than leaving the
            application on a blank page.
          */
          clearLocalAdminSession();

          if (mountedRef.current) {
            setSessionState("unauthenticated");
          }

          return false;
        } finally {
          verificationPromiseRef.current = null;
        }
      })();

      verificationPromiseRef.current =
        verificationPromise;

      return verificationPromise;
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;

    /*
      Initial protected-page verification.
      This is the only normal load where we intentionally show
      the session-checking screen before protected content.
    */
    verifyAdminSession({
      showChecking: true,
    });

    /*
      Heartbeat:
      Refresh the database session in the background.

      IMPORTANT:
      It does NOT hide the page and does NOT switch the page back
      to a blank "checking" state while the Admin is already using it.
    */
    const heartbeat = window.setInterval(() => {
      verifyAdminSession({
        showChecking: false,
      });
    }, ADMIN_SESSION_HEARTBEAT_MS);

    /*
      Browser Back / Forward can restore a cached protected page.

      On history restoration we re-check the session before allowing
      the page to continue.
    */
    function handleHistoryCheck() {
      verifyAdminSession({
        showChecking: true,
      });
    }

    /*
      When returning to this browser tab we verify silently in the
      background. This avoids random white screens when switching tabs.
    */
    function handleFocusCheck() {
      verifyAdminSession({
        showChecking: false,
      });
    }

    /*
      If another tab logs out or changes the stored session,
      immediately re-check this protected page.
    */
    function handleStorageChange(event) {
      if (
        !event ||
        event.key === "admin" ||
        event.key === "adminSessionToken"
      ) {
        verifyAdminSession({
          showChecking: true,
        });
      }
    }

    /*
      releaseAdminSession() dispatches this event during Logout.
    */
    function handleSessionEnded() {
      clearLocalAdminSession();

      if (mountedRef.current) {
        setSessionState("unauthenticated");
      }
    }

    window.addEventListener(
      "pageshow",
      handleHistoryCheck
    );

    window.addEventListener(
      "popstate",
      handleHistoryCheck
    );

    window.addEventListener(
      "focus",
      handleFocusCheck
    );

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    window.addEventListener(
      "admin-session-ended",
      handleSessionEnded
    );

    return () => {
      mountedRef.current = false;

      window.clearInterval(heartbeat);

      window.removeEventListener(
        "pageshow",
        handleHistoryCheck
      );

      window.removeEventListener(
        "popstate",
        handleHistoryCheck
      );

      window.removeEventListener(
        "focus",
        handleFocusCheck
      );

      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      window.removeEventListener(
        "admin-session-ended",
        handleSessionEnded
      );
    };
  }, [verifyAdminSession]);

  /*
    Do not return a completely blank page while performing the
    initial/history session check.
  */
  if (sessionState === "checking") {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>
            Checking administrator session...
          </p>
        </div>
      </div>
    );
  }

  if (sessionState === "unauthenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}

const styles = {
  loadingPage: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FFF9F9",
    boxSizing: "border-box",
  },

  loadingCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "15px 18px",
    borderRadius: 12,
    border: "1px solid #EEE2E0",
    background: "#FFFFFF",
    boxShadow:
      "0 8px 20px rgba(58, 30, 20, 0.08)",
  },

  spinner: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "3px solid #F5D8DE",
    borderTopColor: "#D94368",
    boxSizing: "border-box",
  },

  loadingText: {
    margin: 0,
    color: "#3A1E14",
    fontSize: 14,
    fontWeight: 800,
  },
};