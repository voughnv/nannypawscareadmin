import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import {
  ADMIN_SESSION_HEARTBEAT_MS,
  ADMIN_SESSION_TTL_MS,
  clearLocalAdminSession,
  getAdminLastActivity,
  hasLocalAdminSession,
  isAdminSessionInactive,
  markAdminActivity,
  refreshAdminSession,
  releaseAdminSession,
} from "../utils/adminSession";

export default function ProtectedAdminRoute() {
  const location = useLocation();

  const [sessionState, setSessionState] =
    useState("checking");

  const mountedRef = useRef(true);
  const verificationPromiseRef = useRef(null);
  const inactivityTimerRef = useRef(null);

  const clearInactivityTimer =
    useCallback(() => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(
          inactivityTimerRef.current
        );

        inactivityTimerRef.current =
          null;
      }
    }, []);

  const expireAdminSession =
    useCallback(async () => {
      clearInactivityTimer();

      try {
        await releaseAdminSession();
      } catch (error) {
        console.error(
          "Unable to expire administrator session:",
          error
        );

        clearLocalAdminSession();
      }

      if (mountedRef.current) {
        setSessionState(
          "unauthenticated"
        );
      }
    }, [clearInactivityTimer]);

  const scheduleInactivityLogout =
    useCallback(() => {
      clearInactivityTimer();

      const lastActivity =
        getAdminLastActivity();

      if (!lastActivity) {
        return;
      }

      const elapsed =
        Date.now() - lastActivity;

      const remaining =
        ADMIN_SESSION_TTL_MS - elapsed;

      if (remaining <= 0) {
        expireAdminSession();
        return;
      }

      inactivityTimerRef.current =
        window.setTimeout(() => {
          expireAdminSession();
        }, remaining);
    }, [
      clearInactivityTimer,
      expireAdminSession,
    ]);

  const verifyAdminSession = useCallback(
    async ({ showChecking = false } = {}) => {
      if (verificationPromiseRef.current) {
        if (
          showChecking &&
          mountedRef.current
        ) {
          setSessionState("checking");
        }

        return verificationPromiseRef.current;
      }

      if (
        showChecking &&
        mountedRef.current
      ) {
        setSessionState("checking");
      }

      const verificationPromise =
        (async () => {
          try {
            if (!hasLocalAdminSession()) {
              clearLocalAdminSession();
              clearInactivityTimer();

              if (mountedRef.current) {
                setSessionState(
                  "unauthenticated"
                );
              }

              return false;
            }

            /*
              Check inactivity BEFORE refreshing Supabase.
              This prevents an idle browser from keeping
              the session alive forever.
            */
            if (isAdminSessionInactive()) {
              await expireAdminSession();
              return false;
            }

            const validSession =
              await refreshAdminSession();

            if (!validSession) {
              clearLocalAdminSession();
              clearInactivityTimer();

              if (mountedRef.current) {
                setSessionState(
                  "unauthenticated"
                );
              }

              return false;
            }

            if (mountedRef.current) {
              setSessionState(
                "authenticated"
              );
            }

            scheduleInactivityLogout();

            return true;
          } catch (error) {
            console.error(
              "Unable to verify administrator session:",
              error
            );

            clearLocalAdminSession();
            clearInactivityTimer();

            if (mountedRef.current) {
              setSessionState(
                "unauthenticated"
              );
            }

            return false;
          } finally {
            verificationPromiseRef.current =
              null;
          }
        })();

      verificationPromiseRef.current =
        verificationPromise;

      return verificationPromise;
    },
    [
      clearInactivityTimer,
      expireAdminSession,
      scheduleInactivityLogout,
    ]
  );

  useEffect(() => {
    mountedRef.current = true;

    /*
      Verify once when a protected Admin page loads.
    */
    verifyAdminSession({
      showChecking: true,
    });

    /*
      Keep the server-side session synchronized while
      the Admin remains active.
    */
    const heartbeat =
      window.setInterval(() => {
        verifyAdminSession({
          showChecking: false,
        });
      }, ADMIN_SESSION_HEARTBEAT_MS);

    /*
      Clicking, typing, touching, or scrolling counts
      as activity and resets the 30-minute timer.
    */
    function handleAdminActivity() {
      if (!hasLocalAdminSession()) {
        return;
      }

      markAdminActivity();
      scheduleInactivityLogout();
    }

    function handleHistoryCheck() {
      verifyAdminSession({
        showChecking: true,
      });
    }

    /*
      Returning to the tab first verifies whether the
      old session already expired. Only a still-valid
      session is marked active again.
    */
    async function handleFocusCheck() {
      const valid =
        await verifyAdminSession({
          showChecking: false,
        });

      if (valid) {
        markAdminActivity();
        scheduleInactivityLogout();
      }
    }

    function handleStorageChange(event) {
      if (
        !event ||
        event.key === "admin" ||
        event.key ===
          "adminSessionToken" ||
        event.key ===
          "adminLastActivity"
      ) {
        verifyAdminSession({
          showChecking: true,
        });
      }
    }

    function handleSessionEnded() {
      clearInactivityTimer();
      clearLocalAdminSession();

      if (mountedRef.current) {
        setSessionState(
          "unauthenticated"
        );
      }
    }

    window.addEventListener(
      "pointerdown",
      handleAdminActivity
    );

    window.addEventListener(
      "keydown",
      handleAdminActivity
    );

    window.addEventListener(
      "touchstart",
      handleAdminActivity
    );

    window.addEventListener(
      "scroll",
      handleAdminActivity,
      { passive: true }
    );

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

      window.clearInterval(
        heartbeat
      );

      clearInactivityTimer();

      window.removeEventListener(
        "pointerdown",
        handleAdminActivity
      );

      window.removeEventListener(
        "keydown",
        handleAdminActivity
      );

      window.removeEventListener(
        "touchstart",
        handleAdminActivity
      );

      window.removeEventListener(
        "scroll",
        handleAdminActivity
      );

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
  }, [
    clearInactivityTimer,
    scheduleInactivityLogout,
    verifyAdminSession,
  ]);

  if (
    sessionState === "checking"
  ) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />

          <p style={styles.loadingText}>
            Checking administrator
            session...
          </p>
        </div>
      </div>
    );
  }

  if (
    sessionState ===
    "unauthenticated"
  ) {
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