import { Outlet } from "react-router-dom";
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
  const { settings } = useAdminSettings();
  const darkMode = settings.darkMode;

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
        <AdminSidebar />

        <main
          data-admin-content="true"
          style={{
            ...styles.main,
            background: darkMode ? "#201A18" : "#FFFCFB",
          }}
        >
          <div style={styles.scaledContent}>
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

  /* Keep Lucide icons and images crisp while font size changes. */
  [data-admin-content="true"] svg,
  [role="dialog"] svg {
    flex-shrink: 0;
    shape-rendering: geometricPrecision;
  }

  [data-admin-content="true"] svg *,
  [role="dialog"] svg * {
    vector-effect: non-scaling-stroke;
  }

  [data-admin-content="true"] img,
  [role="dialog"] img {
    image-rendering: auto;
  }

  /* Scale text only. Do not zoom cards, logos, images, or SVG icons. */
  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 10px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 10px"] {
    font-size: calc(10px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 11px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 11px"] {
    font-size: calc(11px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 12px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 12px"] {
    font-size: calc(12px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 13px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 13px"] {
    font-size: calc(13px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 14px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 14px"] {
    font-size: calc(14px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 15px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 15px"] {
    font-size: calc(15px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 16px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 16px"] {
    font-size: calc(16px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 17px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 17px"] {
    font-size: calc(17px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 18px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 18px"] {
    font-size: calc(18px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 19px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 19px"] {
    font-size: calc(19px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 20px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 20px"] {
    font-size: calc(20px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 21px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 21px"] {
    font-size: calc(21px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 22px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 22px"] {
    font-size: calc(22px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 23px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 23px"] {
    font-size: calc(23px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 24px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 24px"] {
    font-size: calc(24px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 25px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 25px"] {
    font-size: calc(25px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 26px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 26px"] {
    font-size: calc(26px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 27px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 27px"] {
    font-size: calc(27px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 28px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 28px"] {
    font-size: calc(28px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 29px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 29px"] {
    font-size: calc(29px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 30px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 30px"] {
    font-size: calc(30px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 31px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 31px"] {
    font-size: calc(31px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 32px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 32px"] {
    font-size: calc(32px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 33px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 33px"] {
    font-size: calc(33px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 34px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 34px"] {
    font-size: calc(34px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 35px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 35px"] {
    font-size: calc(35px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 36px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 36px"] {
    font-size: calc(36px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 37px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 37px"] {
    font-size: calc(37px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 38px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 38px"] {
    font-size: calc(38px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 39px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 39px"] {
    font-size: calc(39px * var(--admin-font-scale, 1)) !important;
  }

  [data-admin-content="true"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 40px"],
  [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, a, button, input, select, textarea, label, th, td, small, strong)[style*="font-size: 40px"] {
    font-size: calc(40px * var(--admin-font-scale, 1)) !important;
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

  main: {
    flex: 1,
    height: "100vh",
    padding: "24px 32px",
    overflowY: "auto",
    overflowX: "hidden",
    minWidth: 0,
    boxSizing: "border-box",
    transition: "background 0.2s ease",
  },

  scaledContent: {
    minHeight: "100%",
    fontSize: "calc(16px * var(--admin-font-scale, 1))",
  },
};