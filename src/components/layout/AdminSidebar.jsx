import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  LogOut,
  Menu,
  MessageSquare,
  MessagesSquare,
  Settings,
  User,
  Users,
} from "lucide-react";
import { useAdminSettings } from "../../context/AdminSettingsContext";
import { releaseAdminSession } from "../../utils/adminSession";

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

export default function AdminSidebar({ onCollapse }) {
  const { settings, fontScale } = useAdminSettings();
  const darkMode = settings.darkMode;

  const [admin, setAdmin] = useState(() => getStoredAdmin());
  const [loggingOut, setLoggingOut] = useState(false);

  const [menuHovered, setMenuHovered] = useState(false);
  const [menuPressed, setMenuPressed] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [logoPressed, setLogoPressed] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const [profilePressed, setProfilePressed] = useState(false);
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [logoutPressed, setLogoutPressed] = useState(false);

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

      window.removeEventListener(
        "storage",
        refreshAdmin
      );
    };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await releaseAdminSession();
      setAdmin(null);
    } catch (error) {
      console.error(
        "Unable to logout administrator:",
        error
      );
    } finally {
      window.location.replace("/login");
    }
  }

  const normalText = darkMode
    ? "#FFF7F4"
    : BRAND.brown;

  const mutedText = darkMode
    ? "#CFC2BE"
    : "#8D7575";

  const adminUsername =
    admin?.admin_username || "Administrator";

  const adminEmail =
    admin?.admin_email || "Administrator account";

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
      <button
        type="button"
        aria-label="Hide sidebar"
        title="Hide sidebar"
        onClick={onCollapse}
        onMouseEnter={() => setMenuHovered(true)}
        onMouseLeave={() => {
          setMenuHovered(false);
          setMenuPressed(false);
        }}
        onMouseDown={() => setMenuPressed(true)}
        onMouseUp={() => setMenuPressed(false)}
        onFocus={() => setMenuHovered(true)}
        onBlur={() => {
          setMenuHovered(false);
          setMenuPressed(false);
        }}
        style={{
          ...styles.collapseButton,
          color: menuHovered ? BRAND.pink : normalText,
          background: menuHovered
            ? darkMode
              ? "#392D30"
              : "#FCE3E7"
            : darkMode
            ? "#2F2724"
            : "#FFF7F8",
          borderColor: menuHovered
            ? BRAND.pink
            : darkMode
            ? "#514540"
            : "#E8DAD7",
          boxShadow: menuHovered
            ? darkMode
              ? "0 6px 14px rgba(0, 0, 0, 0.22)"
              : "0 6px 14px rgba(217, 67, 104, 0.10)"
            : "none",
          transform: menuPressed
            ? "scale(0.94)"
            : menuHovered
            ? "translateY(-1px)"
            : "translateY(0)",
        }}
      >
        <Menu size={20} />
      </button>

      <NavLink
        to="/bookings"
        aria-label="Go to Bookings"
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => {
          setLogoHovered(false);
          setLogoPressed(false);
        }}
        onMouseDown={() => setLogoPressed(true)}
        onMouseUp={() => setLogoPressed(false)}
        onFocus={() => setLogoHovered(true)}
        onBlur={() => {
          setLogoHovered(false);
          setLogoPressed(false);
        }}
        style={{
          ...styles.logoBox,
          background: "#FFFFFF",
          borderColor: logoHovered
            ? BRAND.pink
            : darkMode
            ? "#5A4B45"
            : "#E8DAD7",
          boxShadow: logoHovered
            ? darkMode
              ? "0 10px 22px rgba(0, 0, 0, 0.30), 0 0 0 3px rgba(217, 67, 104, 0.10)"
              : "0 10px 22px rgba(85,54,48,0.16), 0 0 0 3px rgba(217, 67, 104, 0.10)"
            : darkMode
            ? "0 8px 18px rgba(0, 0, 0, 0.28)"
            : "0 8px 18px rgba(85,54,48,0.12)",
          transform: logoPressed
            ? "scale(0.96)"
            : logoHovered
            ? "translateY(-2px) scale(1.03)"
            : "translateY(0) scale(1)",
        }}
      >
        <img
          src="/nannylogo.png"
          alt="Nanny Paws"
          style={{
            ...styles.logo,
            transform: logoHovered ? "scale(1.03)" : "scale(1)",
          }}
        />
      </NavLink>

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
          onMouseEnter={() => setProfileHovered(true)}
          onMouseLeave={() => {
            setProfileHovered(false);
            setProfilePressed(false);
          }}
          onMouseDown={() => setProfilePressed(true)}
          onMouseUp={() => setProfilePressed(false)}
          onFocus={() => setProfileHovered(true)}
          onBlur={() => {
            setProfileHovered(false);
            setProfilePressed(false);
          }}
          style={({ isActive }) => ({
            ...styles.profileCard,
            background: isActive
              ? darkMode
                ? "#4A3038"
                : "#F9CDD4"
              : profileHovered
              ? darkMode
                ? "#443733"
                : "#FBE3E7"
              : darkMode
              ? "#3A302C"
              : "#F9DADF",
            borderColor: isActive
              ? BRAND.pink
              : profileHovered
              ? darkMode
                ? "#6B5550"
                : "#EFB7C3"
              : darkMode
              ? "#514540"
              : "transparent",
            boxShadow: isActive
              ? "0 6px 16px rgba(217, 67, 104, 0.16)"
              : profileHovered
              ? darkMode
                ? "0 8px 18px rgba(0, 0, 0, 0.22)"
                : "0 8px 18px rgba(85,54,48,0.12)"
              : "none",
            transform: profilePressed
              ? "translateX(2px) scale(0.985)"
              : profileHovered
              ? "translateX(4px)"
              : "translateX(0)",
          })}
        >
          <div
            style={{
              ...styles.profileIcon,
              background: darkMode
                ? "#2B2421"
                : "#FFFFFF",
              transform: profileHovered
                ? "scale(1.06)"
                : "scale(1)",
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
              {adminUsername}
            </h4>

            <p
              style={{
                ...styles.profileEmail,
                color: mutedText,
                fontSize: 11 * fontScale,
              }}
            >
              {adminEmail}
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
          disabled={loggingOut}
          onMouseEnter={() =>
            !loggingOut && setLogoutHovered(true)
          }
          onMouseLeave={() => {
            setLogoutHovered(false);
            setLogoutPressed(false);
          }}
          onMouseDown={() =>
            !loggingOut && setLogoutPressed(true)
          }
          onMouseUp={() => setLogoutPressed(false)}
          onFocus={() =>
            !loggingOut && setLogoutHovered(true)
          }
          onBlur={() => {
            setLogoutHovered(false);
            setLogoutPressed(false);
          }}
          style={{
            ...styles.logoutBtn,
            color: logoutHovered
              ? BRAND.pink
              : normalText,
            background: logoutHovered
              ? darkMode
                ? "#412B31"
                : "#FBE1E6"
              : "transparent",
            boxShadow: logoutHovered
              ? darkMode
                ? "0 6px 14px rgba(0, 0, 0, 0.20)"
                : "0 6px 14px rgba(217, 67, 104, 0.10)"
              : "none",
            transform: logoutPressed
              ? "translateX(2px) scale(0.985)"
              : logoutHovered
              ? "translateX(4px)"
              : "translateX(0)",
            fontSize: 16 * fontScale,
            opacity: loggingOut ? 0.55 : 1,
            cursor: loggingOut
              ? "not-allowed"
              : "pointer",
          }}
        >
          <LogOut
            size={20}
            style={{
              transform: logoutHovered
                ? "translateX(2px)"
                : "translateX(0)",
              transition: "transform 0.18s ease",
            }}
          />

          <span>
            {loggingOut
              ? "Logging out..."
              : "Logout"}
          </span>
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
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <NavLink
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => {
        setHovered(false);
        setPressed(false);
      }}
      style={({ isActive }) => ({
        ...styles.navItem,
        color: isActive
          ? "#D74264"
          : hovered
          ? BRAND.pink
          : darkMode
          ? "#FFF7F4"
          : BRAND.brown,
        background: isActive
          ? darkMode
            ? "#4A3038"
            : "#F9CDD4"
          : hovered
          ? darkMode
            ? "#392D30"
            : "#FCE3E7"
          : "transparent",
        boxShadow: isActive
          ? "0 5px 14px rgba(217, 67, 104, 0.14)"
          : hovered
          ? darkMode
            ? "0 5px 12px rgba(0, 0, 0, 0.18)"
            : "0 5px 12px rgba(217, 67, 104, 0.08)"
          : "none",
        transform: pressed
          ? "translateX(2px) scale(0.985)"
          : hovered
          ? "translateX(5px)"
          : "translateX(0)",
        fontSize: 16 * fontScale,
      })}
    >
      <span
        style={{
          ...styles.navIcon,
          transform: hovered
            ? "scale(1.08)"
            : "scale(1)",
        }}
      >
        {icon}
      </span>

      <span>{text}</span>
    </NavLink>
  );
}

function getStoredAdmin() {
  const storedAdmin =
    localStorage.getItem("admin");

  if (!storedAdmin) return null;

  try {
    const admin =
      JSON.parse(storedAdmin);

    return admin &&
      (admin.admin_id ||
        admin.admin_email ||
        admin.admin_username)
      ? admin
      : null;
  } catch {
    localStorage.removeItem("admin");
    return null;
  }
}

const styles = {
  sidebar: {
    position: "relative",
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

  collapseButton: {
    position: "absolute",
    top: 18,
    right: 14,
    zIndex: 5,
    width: 38,
    height: 38,
    borderRadius: 9,
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontFamily: "inherit",
    outline: "none",
    transition:
      "transform 0.14s ease, background 0.18s ease, color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
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
    textDecoration: "none",
    cursor: "pointer",
    outline: "none",
    transformOrigin: "center",
    willChange: "transform",
    transition:
      "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.16s ease",
  },

  logo: {
    width: 88,
    height: 88,
    display: "block",
    borderRadius: "50%",
    objectFit: "contain",
    objectPosition: "center",
    flexShrink: 0,
    transition: "transform 0.18s ease",
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
    border: "1px solid transparent",
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
    outline: "none",
    transformOrigin: "left center",
    willChange: "transform",
    transition:
      "background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, transform 0.14s ease",
  },

  navIcon: {
    width: 20,
    height: 20,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "transform 0.18s ease",
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
    outline: "none",
    transformOrigin: "left center",
    willChange: "transform",
    transition:
      "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.14s ease",
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
    transition:
      "background 0.18s ease, transform 0.18s ease",
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
    border: "1px solid transparent",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "0 18px",
    fontWeight: 700,
    textAlign: "left",
    fontFamily: "inherit",
    outline: "none",
    transformOrigin: "left center",
    willChange: "transform",
    transition:
      "background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, transform 0.14s ease, opacity 0.18s ease",
  },
};
