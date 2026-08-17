import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Type, Moon, RotateCcw } from "lucide-react";
import {
  DEFAULT_ADMIN_SETTINGS,
  useAdminSettings,
} from "./context/AdminSettingsContext";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  border: "#EEE2E0",
  text: "#2E1B16",
  muted: "#6F625F",
};

const SETTINGS_INTERACTION_CSS = `
  .settings-interactive {
    transition:
      transform 0.14s ease,
      box-shadow 0.18s ease,
      filter 0.18s ease,
      border-color 0.18s ease,
      background-color 0.18s ease,
      color 0.18s ease !important;
    transform-origin: center;
  }

  .settings-interactive:not(:disabled):hover {
    transform: translateY(-2px);
  }

  .settings-interactive:not(:disabled):active {
    transform: translateY(0) scale(0.975);
  }

  .settings-interactive:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.52);
    outline-offset: 2px;
  }

  .settings-row-interactive {
    transition:
      transform 0.16s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease,
      background-color 0.18s ease;
  }

  .settings-row-interactive:hover {
    transform: translateY(-1px);
    border-color: rgba(217, 67, 104, 0.38) !important;
    box-shadow: 0 6px 16px rgba(58, 30, 20, 0.07);
  }

  .settings-select {
    transition:
      transform 0.16s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      background-color 0.18s ease;
    cursor: pointer;
  }

  .settings-select:hover {
    border-color: rgba(217, 67, 104, 0.46) !important;
  }

  .settings-select:focus {
    border-color: rgba(217, 67, 104, 0.74) !important;
    box-shadow: 0 0 0 3px rgba(217, 67, 104, 0.10);
    transform: translateY(-1px);
  }

  .settings-toggle:not(:disabled):hover {
    box-shadow:
      0 6px 14px rgba(217, 67, 104, 0.18),
      0 0 0 3px rgba(217, 67, 104, 0.07);
  }

  .settings-toggle:not(:disabled):hover span {
    transform: scale(1.06);
  }

  .settings-reset:not(:disabled):hover {
    color: #D94368 !important;
    border-color: rgba(217, 67, 104, 0.48) !important;
    box-shadow: 0 7px 16px rgba(58, 30, 20, 0.09);
  }

  .settings-save:not(:disabled):hover {
    filter: brightness(1.04);
    box-shadow:
      0 8px 18px rgba(217, 67, 104, 0.22),
      0 0 0 2px rgba(217, 67, 104, 0.07);
  }

  .settings-save:disabled {
    transform: none !important;
    box-shadow: none !important;
    filter: none !important;
  }

  .settings-alert {
    animation: settingsAlertIn 0.20s ease both;
  }

  @keyframes settingsAlertIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default function SettingPage() {
  const navigate = useNavigate();

  const {
    settings,
    savedSettings,
    saveSettings,
    previewAdminSettings,
    clearSettingsPreview,
  } = useAdminSettings();

  const [draftSettings, setDraftSettings] = useState(savedSettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("admin")) {
      navigate("/login");
    }
  }, [navigate]);

  // Start with the last saved settings whenever this page opens.
  useEffect(() => {
    setDraftSettings(savedSettings);
  }, [savedSettings]);

  // Preview changes across the entire website.
  useEffect(() => {
    previewAdminSettings(draftSettings);
  }, [draftSettings, previewAdminSettings]);

  // Leaving this page without saving restores the last saved settings.
  useEffect(() => {
    return () => {
      clearSettingsPreview();
    };
  }, [clearSettingsPreview]);

  const hasChanges = useMemo(
    () =>
      draftSettings.fontSize !== savedSettings.fontSize ||
      draftSettings.darkMode !== savedSettings.darkMode,
    [draftSettings, savedSettings]
  );

  function showMessage(text) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function handleFontSizeChange(event) {
    setDraftSettings((previous) => ({
      ...previous,
      fontSize: event.target.value,
    }));
  }

  function handleDarkModeToggle() {
    setDraftSettings((previous) => ({
      ...previous,
      darkMode: !previous.darkMode,
    }));
  }

  function handleSave(event) {
    event.preventDefault();

    saveSettings(draftSettings);

    showMessage(
      "Your settings have been saved and applied across the administrator website."
    );
  }

  function handleReset() {
    setDraftSettings({ ...DEFAULT_ADMIN_SETTINGS });

    showMessage(
      "Default settings selected. Click Save Settings to keep them."
    );
  }

  // The page follows the effective settings, including the temporary preview.
  const darkMode = settings.darkMode;
  const selectedFontSize = draftSettings.fontSize;
  const selectedDarkMode = draftSettings.darkMode;

  const cardBackground = darkMode
    ? "#2B2421"
    : "#FFFFFF";

  const rowBackground = darkMode
    ? "#312925"
    : "#FFFCFB";

  const mainText = darkMode
    ? "#FFF7F4"
    : BRAND.brown;

  const secondaryText = darkMode
    ? "#CFC2BE"
    : BRAND.muted;

  const controlBackground = darkMode
    ? "#362E2A"
    : "#FFFFFF";

  const controlBorder = darkMode
    ? "#514540"
    : BRAND.border;

  return (
    <div
      style={{
        ...styles.page,
        background: darkMode
          ? "#201A18"
          : "transparent",
      }}
    >
      <style>{SETTINGS_INTERACTION_CSS}</style>
      <header style={styles.header}>
        <div>
          <h1 style={{ ...styles.title, color: mainText }}>
            Settings
          </h1>

          <p style={{ ...styles.subtitle, color: secondaryText }}>
            Customize the appearance of your administrator website.
          </p>
        </div>

        <div style={{ ...styles.breadcrumb, color: mainText }}>
          <span>Dashboard</span>
          <span style={styles.chevron}>›</span>
          <span>Settings</span>
        </div>
      </header>

      {message && (
        <div
          className="settings-alert"
          style={styles.alertSuccess}
        >
          {message}
        </div>
      )}

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
            <h2
              style={{
                ...styles.sectionHeading,
                color: mainText,
              }}
            >
              Display & Appearance
            </h2>

            <p
              style={{
                ...styles.sectionDesc,
                color: secondaryText,
              }}
            >
              Preview your preferred text size and display theme.
              Click Save Settings to keep the changes.
            </p>
          </div>
        </div>

        <div style={styles.settingsList}>
          <label
            className="settings-row-interactive"
            style={{
              ...styles.settingRow,
              background: rowBackground,
              borderColor: controlBorder,
            }}
          >
            <div>
              <h3
                style={{
                  ...styles.optionTitle,
                  color: mainText,
                }}
              >
                Font Size
              </h3>

              <p
                style={{
                  ...styles.optionDesc,
                  color: secondaryText,
                }}
              >
                Choose the text size used across the administrator
                website.
              </p>
            </div>

            <select
              className="settings-select"
              value={selectedFontSize}
              onChange={handleFontSizeChange}
              style={{
                ...styles.select,
                background: controlBackground,
                borderColor: controlBorder,
                color: darkMode
                  ? "#FFF7F4"
                  : BRAND.text,
              }}
            >
              <option value="Default">Default</option>
              <option value="Large">Large</option>
            </select>
          </label>

          <div
            className="settings-row-interactive"
            style={{
              ...styles.settingRow,
              background: rowBackground,
              borderColor: controlBorder,
            }}
          >
            <div style={styles.optionInfo}>
              <div
                style={{
                  ...styles.optionIcon,
                  background: darkMode
                    ? "#4A3A36"
                    : "#F9DCE5",
                }}
              >
                <Moon size={20} />
              </div>

              <div>
                <h3
                  style={{
                    ...styles.optionTitle,
                    color: mainText,
                  }}
                >
                  Dark Mode
                </h3>

                <p
                  style={{
                    ...styles.optionDesc,
                    color: secondaryText,
                  }}
                >
                  Switch to a darker theme across all administrator
                  pages.
                </p>
              </div>
            </div>

            <button
              className="settings-interactive settings-toggle"
              type="button"
              aria-label="Toggle dark mode"
              aria-pressed={selectedDarkMode}
              onClick={handleDarkModeToggle}
              style={{
                ...styles.toggle,
                background: selectedDarkMode
                  ? BRAND.pink
                  : "#E6D9D7",
              }}
            >
              <span
                style={{
                  ...styles.toggleCircle,
                  transform: selectedDarkMode
                    ? "translateX(22px)"
                    : "translateX(0)",
                }}
              />
            </button>
          </div>
        </div>

        <div
          style={{
            ...styles.buttonRow,
            borderColor: controlBorder,
          }}
        >
          <button
            className="settings-interactive settings-reset"
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
            Restore Defaults
          </button>

          <button
            className="settings-interactive settings-save"
            type="submit"
            disabled={!hasChanges}
            style={{
              ...styles.saveBtn,
              ...(!hasChanges ? styles.disabledSaveBtn : {}),
            }}
          >
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
    transition:
      "transform 0.16s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease",
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
    transition:
      "transform 0.16s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
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
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, background 0.18s ease",
  },

  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#FFFFFF",
    transition:
      "transform 0.2s ease, box-shadow 0.18s ease",
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
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, color 0.18s ease",
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
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, filter 0.18s ease",
  },

  disabledSaveBtn: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
};