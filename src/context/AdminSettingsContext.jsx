import {
  createContext,
  useCallback,
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
  const [savedSettings, setSavedSettings] = useState(() =>
    getStoredSettings()
  );

  const [previewSettings, setPreviewSettingsState] = useState(null);

  // Use preview settings while the Settings page is open.
  // Otherwise, use the last saved settings.
  const settings = previewSettings || savedSettings;

  useEffect(() => {
    applyDocumentSettings(settings);
  }, [settings]);

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === "adminSettings") {
        const storedSettings = getStoredSettings();

        setSavedSettings(storedSettings);
        setPreviewSettingsState(null);
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const previewAdminSettings = useCallback((nextSettings) => {
    const normalized = normalizeSettings(nextSettings);
    setPreviewSettingsState(normalized);
    return normalized;
  }, []);

  const clearSettingsPreview = useCallback(() => {
    setPreviewSettingsState(null);
  }, []);

  const saveSettings = useCallback((nextSettings) => {
    const normalized = normalizeSettings(nextSettings);

    localStorage.setItem(
      "adminSettings",
      JSON.stringify(normalized)
    );

    setSavedSettings(normalized);
    setPreviewSettingsState(null);

    window.dispatchEvent(
      new CustomEvent("admin-settings-updated", {
        detail: normalized,
      })
    );

    return normalized;
  }, []);

  const resetSettings = useCallback(() => {
    return saveSettings(DEFAULT_ADMIN_SETTINGS);
  }, [saveSettings]);

  const value = useMemo(
    () => ({
      // Effective settings used by the whole website.
      settings,

      // Last settings actually saved to localStorage.
      savedSettings,

      fontScale:
        FONT_SCALE_VALUES[settings.fontSize] ||
        FONT_SCALE_VALUES.Default,

      saveSettings,
      resetSettings,
      previewAdminSettings,
      clearSettingsPreview,
      isPreviewing: previewSettings !== null,
    }),
    [
      settings,
      savedSettings,
      previewSettings,
      saveSettings,
      resetSettings,
      previewAdminSettings,
      clearSettingsPreview,
    ]
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
    FONT_SCALE_VALUES[settings.fontSize] ||
    FONT_SCALE_VALUES.Default;

  root.dataset.adminTheme = darkMode ? "dark" : "light";
  root.dataset.adminFontSize = settings.fontSize;

  root.style.setProperty(
    "--admin-font-scale",
    String(fontScale)
  );

  root.style.setProperty(
    "--admin-page-background",
    darkMode ? "#171311" : "#FFF9F8"
  );

  root.style.setProperty(
    "--admin-text-color",
    darkMode ? "#FFF7F4" : "#2E1B16"
  );

  root.style.colorScheme = darkMode ? "dark" : "light";

  document.body.style.backgroundColor =
    darkMode ? "#171311" : "#FFF9F8";

  document.body.style.color =
    darkMode ? "#FFF7F4" : "#2E1B16";
}