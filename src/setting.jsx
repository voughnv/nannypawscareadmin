import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Type, Moon, RotateCcw } from "lucide-react";
import { useAdminSettings } from "./context/AdminSettingsContext";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  border: "#EEE2E0",
  text: "#2E1B16",
  muted: "#6F625F",
};

export default function SettingPage() {
  const navigate = useNavigate();
  const { settings, saveSettings } = useAdminSettings();
  const [message, setMessage] = useState("");

  // Temporary selections. Global settings are updated only after Save Settings.
  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [darkMode, setDarkMode] = useState(settings.darkMode);

  useEffect(() => {
    if (!localStorage.getItem("admin")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    setFontSize(settings.fontSize);
    setDarkMode(settings.darkMode);
  }, [settings.fontSize, settings.darkMode]);

  function showMessage(text) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function handleFontSizeChange(event) {
    setFontSize(event.target.value);
  }

  function handleDarkModeToggle() {
    setDarkMode((previous) => !previous);
  }

  function handleSave(event) {
    event.preventDefault();

    saveSettings({
      ...settings,
      fontSize,
      darkMode,
    });

    showMessage(
      "Your settings have been saved and applied across the administrator website."
    );
  }

  function handleReset() {
    setFontSize("Default");
    setDarkMode(false);
    showMessage(
      "Default settings selected. Click Save Settings to apply them."
    );
  }

  const cardBackground = darkMode ? "#2B2421" : "#FFFFFF";
  const mainText = darkMode ? "#FFF7F4" : BRAND.brown;
  const secondaryText = darkMode ? "#CFC2BE" : BRAND.muted;
  const controlBackground = darkMode ? "#362E2A" : "#FFFFFF";
  const controlBorder = darkMode ? "#514540" : BRAND.border;

  return (
    <div
      style={{
        ...styles.page,
        background: darkMode ? "#201A18" : "transparent",
      }}
    >
      <header style={styles.header}>
        <div>
          <h1 style={{ ...styles.title, color: mainText }}>
            Settings
          </h1>

          <p style={{ ...styles.subtitle, color: secondaryText }}>
            Manage the appearance of the entire admin website.
          </p>
        </div>

        <div style={{ ...styles.breadcrumb, color: mainText }}>
          <span>Dashboard</span>
          <span style={styles.chevron}>›</span>
          <span>Settings</span>
        </div>
      </header>

      {message && <div style={styles.alertSuccess}>{message}</div>}

      <form
        onSubmit={handleSave}
        style={{
          ...styles.card,
          background: cardBackground,
          borderColor: controlBorder,
        }}
      >
        <div style={styles.sectionTitle}>
          <div style={styles.sectionIcon}>
            <Type size={22} />
          </div>

          <div>
            <h2 style={{ ...styles.sectionHeading, color: mainText }}>
              Appearance
            </h2>

            <p style={{ ...styles.sectionDesc, color: secondaryText }}>
              Preview your preferred text size and display theme, then click Save Settings to apply them across the admin panel.
            </p>
          </div>
        </div>

        <div style={styles.settingsList}>
          <label
            style={{
              ...styles.settingRow,
              background: darkMode ? "#312925" : "#FFFCFB",
              borderColor: controlBorder,
            }}
          >
            <div>
              <h3 style={{ ...styles.optionTitle, color: mainText }}>
                Font Size
              </h3>

              <p style={{ ...styles.optionDesc, color: secondaryText }}>
                Scale the text and content throughout the admin panel.
              </p>
            </div>

            <select
              value={fontSize}
              onChange={handleFontSizeChange}
              style={{
                ...styles.select,
                background: controlBackground,
                borderColor: controlBorder,
                color: darkMode ? "#FFF7F4" : BRAND.text,
              }}
            >
              <option>Default</option>
              <option>Large</option>
            </select>
          </label>

          <div
            style={{
              ...styles.settingRow,
              background: darkMode ? "#312925" : "#FFFCFB",
              borderColor: controlBorder,
            }}
          >
            <div style={styles.optionInfo}>
              <div
                style={{
                  ...styles.optionIcon,
                  background: darkMode ? "#4A3A36" : "#F9DCE5",
                }}
              >
                <Moon size={20} />
              </div>

              <div>
                <h3 style={{ ...styles.optionTitle, color: mainText }}>
                  Dark Mode
                </h3>

                <p style={{ ...styles.optionDesc, color: secondaryText }}>
                  Use a darker appearance across every admin page.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Toggle dark mode"
              aria-pressed={darkMode}
              onClick={handleDarkModeToggle}
              style={{
                ...styles.toggle,
                background: darkMode ? BRAND.pink : "#E6D9D7",
              }}
            >
              <span
                style={{
                  ...styles.toggleCircle,
                  transform: darkMode
                    ? "translateX(22px)"
                    : "translateX(0)",
                }}
              />
            </button>
          </div>
        </div>

        <div style={{ ...styles.buttonRow, borderColor: controlBorder }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              ...styles.resetBtn,
              background: controlBackground,
              borderColor: controlBorder,
              color: mainText,
            }}
          >
            <RotateCcw size={17} />
            Reset Default
          </button>

          <button type="submit" style={styles.saveBtn}>
            <Save size={18} />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100%",
    borderRadius: 16,
    boxSizing: "border-box",
    transition: "background 0.2s ease",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 24,
  },

  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: 15,
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  chevron: {
    color: "#9A8C89",
    fontSize: 22,
  },

  alertSuccess: {
    marginBottom: 18,
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 14,
    fontWeight: 800,
    background: "#DDF4E7",
    color: "#0B8F45",
    border: "1px solid #B9E8CE",
  },

  card: {
    width: "100%",
    minHeight: "calc(100vh - 180px)",
    borderRadius: 16,
    border: "1px solid",
    boxShadow: "0 8px 18px rgba(51, 26, 18, 0.07)",
    padding: 24,
    boxSizing: "border-box",
    transition: "background 0.2s ease",
  },

  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },

  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#F9DCE5",
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  sectionHeading: {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
  },

  sectionDesc: {
    margin: "4px 0 0",
    fontSize: 13,
    lineHeight: 1.4,
  },

  settingsList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  settingRow: {
    minHeight: 88,
    border: "1px solid",
    borderRadius: 12,
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    boxSizing: "border-box",
  },

  optionInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  optionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 900,
  },

  optionDesc: {
    margin: "5px 0 0",
    fontSize: 13,
    lineHeight: 1.4,
  },

  select: {
    width: 170,
    height: 44,
    border: "1px solid",
    borderRadius: 8,
    padding: "0 12px",
    fontSize: 14,
    fontWeight: 700,
    outline: "none",
    flexShrink: 0,
  },

  toggle: {
    width: 48,
    height: 26,
    borderRadius: 99,
    border: "none",
    padding: 3,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    flexShrink: 0,
  },

  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#FFFFFF",
    transition: "transform 0.2s ease",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.18)",
  },

  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginTop: 22,
    paddingTop: 20,
    borderTop: "1px solid",
    flexWrap: "wrap",
  },

  resetBtn: {
    height: 44,
    border: "1px solid",
    borderRadius: 8,
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },

  saveBtn: {
    height: 44,
    border: "none",
    borderRadius: 8,
    background: BRAND.pink,
    color: "#FFFFFF",
    padding: "0 18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
};