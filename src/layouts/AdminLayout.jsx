import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import AdminSidebar from "../components/layout/AdminSidebar";
import {
  AdminSettingsProvider,
  useAdminSettings,
} from "../context/AdminSettingsContext";

export default function AdminLayout() {
  return (
    <AdminSettingsProvider>
      <AdminLayoutContent />
    </AdminSettingsProvider>
  );
}

function AdminLayoutContent() {
  const { settings, fontScale } = useAdminSettings();
  const darkMode = settings.darkMode;
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <style>{GLOBAL_ADMIN_THEME_CSS}</style>

      <div
        style={{
          ...styles.page,
          background: darkMode ? "#171311" : "#FFFCFB",
          color: darkMode ? "#FFF7F4" : "#2E1B16",
        }}
      >
        <div
          style={{
            ...styles.sidebarShell,
            width: sidebarOpen ? 250 : 0,
            minWidth: sidebarOpen ? 250 : 0,
          }}
        >
          <div
            style={{
              ...styles.sidebarInner,
              transform: sidebarOpen
                ? "translateX(0)"
                : "translateX(-100%)",
              opacity: sidebarOpen ? 1 : 0,
              pointerEvents: sidebarOpen ? "auto" : "none",
            }}
          >
            <AdminSidebar
              onCollapse={() => setSidebarOpen(false)}
            />
          </div>
        </div>

        {!sidebarOpen && (
          <button
            type="button"
            aria-label="Show sidebar"
            title="Show sidebar"
            className="admin-sidebar-reopen"
            onClick={() => setSidebarOpen(true)}
            style={{
              ...styles.reopenButton,
              background: darkMode ? "#2B2320" : "#FFFFFF",
              color: darkMode ? "#FFF7F4" : "#3A1E14",
              borderColor: darkMode ? "#514540" : "#E6D9D7",
            }}
          >
            <Menu size={21} />
          </button>
        )}

        <main
          data-admin-content="true"
          style={{
            ...styles.main,
            background: darkMode ? "#201A18" : "#FFFCFB",
            paddingLeft: sidebarOpen ? 32 : 76,
          }}
        >
          <div
            style={{
              ...styles.scaledContent,
              width: `${100 / fontScale}%`,
              zoom: fontScale,
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}

const GLOBAL_ADMIN_THEME_CSS = `
  html[data-admin-theme="dark"] {
    color-scheme: dark;
  }

  html[data-admin-theme="dark"] body {
    background: #171311 !important;
    color: #fff7f4 !important;
  }

  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="background: rgb(255, 255, 255)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="background-color: rgb(255, 255, 255)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="background: rgb(255, 252, 251)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="background: rgb(255, 251, 250)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="background: rgb(255, 249, 248)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="background: rgb(255, 248, 248)"],
  html[data-admin-theme="dark"] body > [role="dialog"],
  html[data-admin-theme="dark"] [role="dialog"] {
    background: #2b2421 !important;
    color: #fff7f4 !important;
  }

  html[data-admin-theme="dark"] [data-admin-content="true"] input,
  html[data-admin-theme="dark"] [data-admin-content="true"] select,
  html[data-admin-theme="dark"] [data-admin-content="true"] textarea,
  html[data-admin-theme="dark"] [role="dialog"] input,
  html[data-admin-theme="dark"] [role="dialog"] select,
  html[data-admin-theme="dark"] [role="dialog"] textarea {
    background: #362e2a !important;
    color: #fff7f4 !important;
    border-color: #514540 !important;
  }

  html[data-admin-theme="dark"] [data-admin-content="true"] input::placeholder,
  html[data-admin-theme="dark"] [data-admin-content="true"] textarea::placeholder {
    color: #a99994 !important;
  }

  html[data-admin-theme="dark"] [data-admin-content="true"] table,
  html[data-admin-theme="dark"] [data-admin-content="true"] thead,
  html[data-admin-theme="dark"] [data-admin-content="true"] tbody,
  html[data-admin-theme="dark"] [data-admin-content="true"] tr,
  html[data-admin-theme="dark"] [data-admin-content="true"] th,
  html[data-admin-theme="dark"] [data-admin-content="true"] td {
    border-color: #514540 !important;
  }

  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="color: rgb(58, 30, 20)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="color: rgb(46, 27, 22)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="color: rgb(31, 23, 20)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="color: rgb(27, 20, 18)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="color: rgb(22, 16, 14)"],
  html[data-admin-theme="dark"] [role="dialog"]
  [style*="color: rgb(58, 30, 20)"],
  html[data-admin-theme="dark"] [role="dialog"]
  [style*="color: rgb(46, 27, 22)"],
  html[data-admin-theme="dark"] [role="dialog"]
  [style*="color: rgb(31, 23, 20)"] {
    color: #fff7f4 !important;
  }

  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="color: rgb(111, 98, 95)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="color: rgb(93, 83, 81)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="color: rgb(109, 95, 91)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="color: rgb(94, 75, 69)"],
  html[data-admin-theme="dark"] [role="dialog"]
  [style*="color: rgb(111, 98, 95)"] {
    color: #cfc2be !important;
  }

  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="border: 1px solid rgb(238, 226, 223)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="border: 1px solid rgb(238, 226, 224)"],
  html[data-admin-theme="dark"] [data-admin-content="true"]
  [style*="border: 1px solid rgb(230, 217, 215)"],
  html[data-admin-theme="dark"] [role="dialog"]
  [style*="border: 1px solid rgb(238, 226, 223)"] {
    border-color: #514540 !important;
  }

  html[data-admin-theme="dark"] ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  html[data-admin-theme="dark"] ::-webkit-scrollbar-track {
    background: #201a18;
  }

  html[data-admin-theme="dark"] ::-webkit-scrollbar-thumb {
    background: #5b4b45;
    border-radius: 999px;
  }

  .admin-sidebar-reopen {
    transition:
      transform 0.14s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease,
      background 0.18s ease;
  }

  .admin-sidebar-reopen:hover {
    transform: translateY(-1px);
    color: #D94368 !important;
    border-color: rgba(217, 67, 104, 0.55) !important;
    box-shadow:
      0 7px 16px rgba(58, 30, 20, 0.11),
      0 0 0 2px rgba(217, 67, 104, 0.06);
  }

  .admin-sidebar-reopen:active {
    transform: translateY(0) scale(0.96);
  }

  .admin-sidebar-reopen:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.45);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-sidebar-reopen {
      transition-duration: 0.01ms !important;
    }
  }
`;

const styles = {
  page: {
    height: "100vh",
    width: "100%",
    display: "flex",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: "hidden",
    transition: "background 0.2s ease, color 0.2s ease",
  },

  sidebarShell: {
    height: "100vh",
    flexShrink: 0,
    overflow: "hidden",
    transition:
      "width 0.24s ease, min-width 0.24s ease",
  },

  sidebarInner: {
    width: 250,
    height: "100vh",
    transition:
      "transform 0.24s ease, opacity 0.18s ease",
    willChange: "transform",
  },

  reopenButton: {
    position: "fixed",
    top: 20,
    left: 18,
    zIndex: 1000,
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  main: {
    flex: 1,
    height: "100vh",
    padding: "24px 32px",
    overflowY: "auto",
    overflowX: "hidden",
    minWidth: 0,
    boxSizing: "border-box",
    transition:
      "background 0.2s ease, padding-left 0.24s ease",
  },

  scaledContent: {
    minHeight: "100%",
    transformOrigin: "top left",
  },
};
