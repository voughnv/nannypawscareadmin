import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

export default function ProtectedAdminRoute() {
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(getStoredAdmin())
  );

  useEffect(() => {
    function verifyAdminSession() {
      const hasValidAdmin = Boolean(getStoredAdmin());

      setIsAuthenticated(hasValidAdmin);

      if (!hasValidAdmin) {
        // Hide a page restored from the browser back-forward cache
        // before redirecting to the login page.
        document.documentElement.style.visibility = "hidden";
        window.location.replace("/login");
        return;
      }

      document.documentElement.style.visibility = "";
    }

    verifyAdminSession();

    window.addEventListener("pageshow", verifyAdminSession);
    window.addEventListener("popstate", verifyAdminSession);
    window.addEventListener("storage", verifyAdminSession);
    window.addEventListener(
      "admin-session-ended",
      verifyAdminSession
    );

    return () => {
      window.removeEventListener(
        "pageshow",
        verifyAdminSession
      );
      window.removeEventListener(
        "popstate",
        verifyAdminSession
      );
      window.removeEventListener(
        "storage",
        verifyAdminSession
      );
      window.removeEventListener(
        "admin-session-ended",
        verifyAdminSession
      );

      document.documentElement.style.visibility = "";
    };
  }, []);

  if (!isAuthenticated) {
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

function getStoredAdmin() {
  const storedAdmin = localStorage.getItem("admin");

  if (!storedAdmin) return null;

  try {
    const admin = JSON.parse(storedAdmin);

    const hasAdminIdentity =
      admin &&
      (admin.admin_id ||
        admin.admin_email ||
        admin.admin_username);

    if (!hasAdminIdentity) {
      localStorage.removeItem("admin");
      return null;
    }

    return admin;
  } catch {
    localStorage.removeItem("admin");
    return null;
  }
}