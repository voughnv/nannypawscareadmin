import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const DEFAULT_ADMIN_SETTINGS = {
  fontSize: "Default",
  darkMode: false,
};

export const FONT_SCALE_VALUES = {
  Default: 1,
  Large: 1.08,
};

const AdminSettingsContext = createContext(null);

export function AdminSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => getStoredSettings());

  useEffect(() => {
    applyDocumentSettings(settings);

    function handleStorage(event) {
      if (event.key === "adminSettings") {
        setSettings(getStoredSettings());
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);

      const root = document.documentElement;
      root.removeAttribute("data-admin-theme");
      root.removeAttribute("data-admin-font-size");
      root.style.removeProperty("--admin-font-scale");

      document.body.style.removeProperty("background-color");
      document.body.style.removeProperty("color");
    };
  }, [settings]);

  function saveSettings(nextSettings) {
    const normalized = normalizeSettings(nextSettings);

    localStorage.setItem("adminSettings", JSON.stringify(normalized));
    setSettings(normalized);

    window.dispatchEvent(
      new CustomEvent("admin-settings-updated", {
        detail: normalized,
      })
    );

    return normalized;
  }

  function resetSettings() {
    return saveSettings(DEFAULT_ADMIN_SETTINGS);
  }

  const value = useMemo(
    () => ({
      settings,
      fontScale:
        FONT_SCALE_VALUES[settings.fontSize] || FONT_SCALE_VALUES.Default,
      saveSettings,
      resetSettings,
    }),
    [settings]
  );

  return (
    <AdminSettingsContext.Provider value={value}>
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext);

  if (!context) {
    throw new Error(
      "useAdminSettings must be used inside AdminSettingsProvider."
    );
  }

  return context;
}

function getStoredSettings() {
  try {
    const stored = JSON.parse(
      localStorage.getItem("adminSettings") || "{}"
    );

    return normalizeSettings(stored);
  } catch {
    return { ...DEFAULT_ADMIN_SETTINGS };
  }
}

function normalizeSettings(settings) {
  const validFontSize = Object.prototype.hasOwnProperty.call(
    FONT_SCALE_VALUES,
    settings?.fontSize
  )
    ? settings.fontSize
    : DEFAULT_ADMIN_SETTINGS.fontSize;

  return {
    fontSize: validFontSize,
    darkMode: Boolean(settings?.darkMode),
  };
}

function applyDocumentSettings(settings) {
  const root = document.documentElement;
  const darkMode = Boolean(settings.darkMode);
  const fontScale =
    FONT_SCALE_VALUES[settings.fontSize] || FONT_SCALE_VALUES.Default;

  root.dataset.adminTheme = darkMode ? "dark" : "light";
  root.dataset.adminFontSize = settings.fontSize;
  root.style.setProperty("--admin-font-scale", String(fontScale));

  document.body.style.backgroundColor = darkMode ? "#171311" : "#FFF9F8";
  document.body.style.color = darkMode ? "#FFF7F4" : "#2E1B16";
}