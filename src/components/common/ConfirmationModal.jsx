import { useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  X,
} from "lucide-react";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  text: "#2E1B16",
  muted: "#6F625F",
  border: "#EEE2E0",
};

const VARIANTS = {
  primary: {
    icon: CircleAlert,
    iconBackground: "#FDEBED",
    iconColor: BRAND.pink,
    buttonBackground: BRAND.pink,
  },
  success: {
    icon: CheckCircle2,
    iconBackground: "#DDF4E7",
    iconColor: "#0B8F45",
    buttonBackground: "#0B8F45",
  },
  warning: {
    icon: AlertTriangle,
    iconBackground: "#FDEADB",
    iconColor: "#F2650C",
    buttonBackground: "#F2650C",
  },
  danger: {
    icon: CircleAlert,
    iconBackground: "#F8D8DB",
    iconColor: "#DF101D",
    buttonBackground: "#DF101D",
  },
  info: {
    icon: Info,
    iconBackground: "#E6EDFF",
    iconColor: "#0C4BB3",
    buttonBackground: "#0C4BB3",
  },
};

export default function ConfirmationModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  onConfirm,
  onCancel,
}) {
  const variantStyle = VARIANTS[variant] || VARIANTS.primary;
  const Icon = variantStyle.icon;

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      style={styles.overlay}
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-message"
        style={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close confirmation"
          style={styles.closeButton}
          onClick={onCancel}
        >
          <X size={19} />
        </button>

        <div
          style={{
            ...styles.iconBox,
            background: variantStyle.iconBackground,
            color: variantStyle.iconColor,
          }}
        >
          <Icon size={28} />
        </div>

        <h2 id="confirmation-modal-title" style={styles.title}>
          {title}
        </h2>

        <p id="confirmation-modal-message" style={styles.message}>
          {message}
        </p>

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.cancelButton}
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            style={{
              ...styles.confirmButton,
              background: variantStyle.buttonBackground,
            }}
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    padding: 20,
    background: "rgba(35, 20, 16, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modal: {
    position: "relative",
    width: "min(430px, 100%)",
    borderRadius: 18,
    border: `1px solid ${BRAND.border}`,
    background: "#FFFFFF",
    boxShadow: "0 24px 60px rgba(51, 26, 18, 0.24)",
    padding: "28px 26px 24px",
    boxSizing: "border-box",
    textAlign: "center",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 9,
    border: `1px solid ${BRAND.border}`,
    background: "#FFFFFF",
    color: BRAND.brown,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  iconBox: {
    width: 58,
    height: 58,
    margin: "0 auto 16px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    margin: 0,
    color: BRAND.brown,
    fontSize: 22,
    fontWeight: 900,
  },

  message: {
    margin: "10px auto 0",
    maxWidth: 350,
    color: BRAND.muted,
    fontSize: 14,
    lineHeight: 1.6,
  },

  actions: {
    marginTop: 24,
    display: "flex",
    justifyContent: "center",
    gap: 10,
  },

  cancelButton: {
    minWidth: 110,
    height: 42,
    borderRadius: 9,
    border: `1px solid ${BRAND.border}`,
    background: "#FFFFFF",
    color: BRAND.brown,
    padding: "0 16px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },

  confirmButton: {
    minWidth: 130,
    height: 42,
    borderRadius: 9,
    border: "none",
    color: "#FFFFFF",
    padding: "0 16px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
};