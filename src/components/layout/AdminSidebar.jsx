import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  LogOut,
  MessageSquare,
  MessagesSquare,
  Settings,
  User,
  Users,
} from "lucide-react";
import { useAdminSettings } from "../../context/AdminSettingsContext";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
};

const MENU_ITEMS = [
  { to: "/bookings", text: "Bookings", icon: CalendarDays },
  { to: "/sitters", text: "Pet Sitters", icon: User },
  { to: "/messages", text: "Messages", icon: MessagesSquare },
  { to: "/applicants", text: "Applicants", icon: Users },
  { to: "/feedbacks", text: "Feedbacks", icon: MessageSquare },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { settings, fontScale } = useAdminSettings();
  const darkMode = settings.darkMode;

  const [admin, setAdmin] = useState(() => getStoredAdmin());

  useEffect(() => {
    function refreshAdmin() {
      setAdmin(getStoredAdmin());
    }

    window.addEventListener(
      "admin-profile-updated",
      refreshAdmin
    );

    window.addEventListener("storage", refreshAdmin);

    return () => {
      window.removeEventListener(
        "admin-profile-updated",
        refreshAdmin
      );

      window.removeEventListener("storage", refreshAdmin);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("admin");
    navigate("/login");
  }

  const normalText = darkMode
    ? "#FFF7F4"
    : BRAND.brown;

  const mutedText = darkMode
    ? "#CFC2BE"
    : "#8D7575";

  return (
    <aside
      style={{
        ...styles.sidebar,
        background: darkMode
          ? "linear-gradient(180deg, #241D1A 0%, #2B2320 48%, #1D1816 100%)"
          : "linear-gradient(180deg, #FCE4E7 0%, #FDEEEF 45%, #FFF8F8 100%)",
        borderRightColor: darkMode
          ? "#443934"
          : "transparent",
      }}
    >
      <div
        style={{
          ...styles.logoBox,
          background: "#FFFFFF",
          borderColor: darkMode
            ? "#5A4B45"
            : "#E8DAD7",
          boxShadow: darkMode
            ? "0 8px 18px rgba(0, 0, 0, 0.28)"
            : "0 8px 18px rgba(85,54,48,0.12)",
        }}
      >
        <img
          src="/nannylogo.png"
          alt="Nanny Paws"
          style={styles.logo}
        />
      </div>

      <nav style={styles.nav}>
        {MENU_ITEMS.map(({ to, text, icon: Icon }) => (
          <SidebarItem
            key={to}
            to={to}
            icon={<Icon size={20} />}
            text={text}
            darkMode={darkMode}
            fontScale={fontScale}
          />
        ))}
      </nav>

      <div style={styles.sidebarBottom}>
        <NavLink
          to="/profile"
          style={({ isActive }) => ({
            ...styles.profileCard,
            background: darkMode
              ? "#3A302C"
              : "#F9DADF",
            borderColor: isActive
              ? BRAND.pink
              : darkMode
              ? "#514540"
              : "transparent",
            boxShadow: isActive
              ? "0 0 0 2px rgba(217, 67, 104, 0.10)"
              : "none",
          })}
        >
          <div
            style={{
              ...styles.profileIcon,
              background: darkMode
                ? "#2B2421"
                : "#FFFFFF",
            }}
          >
            <User size={24} />
          </div>

          <div style={styles.profileInfo}>
            <h4
              style={{
                ...styles.profileName,
                color: normalText,
                fontSize: 15 * fontScale,
              }}
            >
              {admin.admin_username || "Administrator"}
            </h4>

            <p
              style={{
                ...styles.profileEmail,
                color: mutedText,
                fontSize: 11 * fontScale,
              }}
            >
              {admin.admin_email || "admin@nannypaws.com"}
            </p>
          </div>
        </NavLink>

        <SidebarItem
          to="/settings"
          icon={<Settings size={20} />}
          text="Settings"
          darkMode={darkMode}
          fontScale={fontScale}
        />

        <button
          type="button"
          onClick={handleLogout}
          style={{
            ...styles.logoutBtn,
            color: normalText,
            fontSize: 16 * fontScale,
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({
  to,
  icon,
  text,
  darkMode,
  fontScale,
}) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...styles.navItem,
        color: isActive
          ? "#D74264"
          : darkMode
          ? "#FFF7F4"
          : BRAND.brown,
        background: isActive
          ? darkMode
            ? "#4A3038"
            : "#F9CDD4"
          : "transparent",
        fontSize: 16 * fontScale,
      })}
    >
      {icon}
      <span>{text}</span>
    </NavLink>
  );
}

function getStoredAdmin() {
  try {
    return (
      JSON.parse(localStorage.getItem("admin")) || {
        admin_username: "Administrator",
        admin_email: "admin@nannypaws.com",
      }
    );
  } catch {
    return {
      admin_username: "Administrator",
      admin_email: "admin@nannypaws.com",
    };
  }
}

const styles = {
  sidebar: {
    width: 250,
    minWidth: 250,
    height: "100vh",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    flexShrink: 0,
    borderRight: "1px solid transparent",
    transition:
      "background 0.2s ease, border-color 0.2s ease",
  },

  logoBox: {
    width: 104,
    height: 104,
    minWidth: 104,
    minHeight: 104,
    margin: "0 auto 28px",
    borderRadius: "50%",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    boxSizing: "border-box",
    transition:
      "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
  },

  logo: {
    width: 88,
    height: 88,
    display: "block",
    borderRadius: "50%",
    objectFit: "contain",
    objectPosition: "center",
    flexShrink: 0,
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  navItem: {
    width: "100%",
    height: 56,
    overflow: "hidden",
    border: "none",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "0 18px",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
    textDecoration: "none",
    boxSizing: "border-box",
    transition:
      "background 0.2s ease, color 0.2s ease",
  },

  sidebarBottom: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  profileCard: {
    height: 82,
    borderRadius: 10,
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    cursor: "pointer",
    boxSizing: "border-box",
    textDecoration: "none",
    border: "1px solid",
    transition:
      "background 0.2s ease, border-color 0.2s ease",
  },

  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  profileInfo: {
    minWidth: 0,
  },

  profileName: {
    margin: 0,
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 145,
  },

  profileEmail: {
    margin: "4px 0 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 145,
  },

  logoutBtn: {
    width: "100%",
    height: 50,
    border: "none",
    borderRadius: 10,
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "0 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
};