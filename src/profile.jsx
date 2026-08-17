import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Save,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "./lib/supabase";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  softPink: "#FDEBED",
  border: "#EEE2E0",
  text: "#2E1B16",
  muted: "#6F625F",
};

const PROFILE_INTERACTION_CSS = `
  .profile-interactive {
    transition:
      transform 0.14s ease,
      box-shadow 0.18s ease,
      filter 0.18s ease,
      border-color 0.18s ease,
      background-color 0.18s ease,
      color 0.18s ease !important;
    transform-origin: center;
  }

  .profile-interactive:not(:disabled):hover {
    transform: translateY(-2px);
  }

  .profile-interactive:not(:disabled):active {
    transform: translateY(0) scale(0.975);
  }

  .profile-interactive:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.52);
    outline-offset: 2px;
  }

  .profile-save-button:not(:disabled):hover {
    filter: brightness(1.04);
    box-shadow:
      0 8px 18px rgba(217, 67, 104, 0.22),
      0 0 0 2px rgba(217, 67, 104, 0.07);
  }

  .profile-save-button:not(:disabled):active {
    box-shadow: 0 4px 10px rgba(217, 67, 104, 0.16);
  }

  .profile-eye-button:not(:disabled):hover {
    color: #D94368 !important;
    background: #FDEBED !important;
    transform: scale(1.08);
  }

  .profile-eye-button:not(:disabled):active {
    transform: scale(0.94);
  }

  .profile-input-wrapper {
    transition:
      transform 0.16s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease,
      background-color 0.18s ease;
  }

  .profile-input-wrapper:not(.is-disabled):hover {
    border-color: rgba(217, 67, 104, 0.42) !important;
    box-shadow: 0 5px 14px rgba(58, 30, 20, 0.07);
  }

  .profile-input-wrapper:not(.is-disabled):focus-within {
    border-color: rgba(217, 67, 104, 0.74) !important;
    box-shadow:
      0 0 0 3px rgba(217, 67, 104, 0.10),
      0 6px 16px rgba(58, 30, 20, 0.08);
    transform: translateY(-1px);
  }

  .profile-input-wrapper.has-value:not(.is-disabled) {
    box-shadow: inset 0 0 0 1px rgba(217, 67, 104, 0.10);
  }

  .profile-input-control {
    transition:
      color 0.18s ease,
      background-color 0.18s ease;
  }

  .profile-input-control::selection {
    background: rgba(217, 67, 104, 0.20);
  }

  .profile-alert {
    animation: profileAlertIn 0.20s ease both;
  }

  @keyframes profileAlertIn {
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

export default function ProfilePage() {
  const navigate = useNavigate();

  const storedAdmin = JSON.parse(localStorage.getItem("admin")) || null;


  const [username, setUsername] = useState(
    storedAdmin?.admin_username || "Administrator"
  );
  const [email] = useState(storedAdmin?.admin_email || "admin@nannypaws.com");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    if (!storedAdmin?.admin_id && !storedAdmin?.admin_email) {
      navigate("/login");
    }
  }, [navigate]);

  function showMessage(text, type = "success") {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3500);
  }

  function validatePassword(password) {
    if (!password.trim()) return "New password is required.";
    if (/\s/.test(password)) return "Password must not contain spaces.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must include at least one number.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must include at least one special character.";
    return "";
  }

  async function handleSave() {
    const cleanUsername = username.trim();
    const adminId = storedAdmin?.admin_id;

    if (!adminId) {
      showMessage("Admin account information is missing. Please log in again.", "error");
      return;
    }

    if (!cleanUsername) {
      showMessage("Username is required.", "error");
      return;
    }

    // Require the current password before changing either the username
    // or password. This prevents an unrestricted browser update.
    if (!currentPassword.trim()) {
      showMessage(
        "Enter your current password to save account changes.",
        "error"
      );
      return;
    }

    const wantsPasswordChange =
      Boolean(newPassword.trim()) || Boolean(confirmPassword.trim());

    if (wantsPasswordChange) {
      const passwordError = validatePassword(newPassword);

      if (passwordError) {
        showMessage(passwordError, "error");
        return;
      }

      if (!confirmPassword.trim()) {
        showMessage("Confirm new password is required.", "error");
        return;
      }

      if (newPassword !== confirmPassword) {
        showMessage(
          "New password and confirm new password do not match.",
          "error"
        );
        return;
      }

      if (currentPassword === newPassword) {
        showMessage(
          "New password must be different from the current password.",
          "error"
        );
        return;
      }
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const { data, error: updateError } = await supabase.rpc(
        "update_admin_profile",
        {
          p_admin_id: Number(adminId),
          p_current_password: currentPassword,
          p_new_username: cleanUsername,
          p_new_password: wantsPasswordChange ? newPassword : null,
        }
      );

      if (updateError) throw updateError;

      if (!data || typeof data !== "object") {
        throw new Error(
          "The administrator account was updated, but no updated account information was returned."
        );
      }

      const updatedAdmin = {
        ...storedAdmin,
        ...data,
        admin_id: data.admin_id ?? storedAdmin.admin_id,
        admin_username: data.admin_username || cleanUsername,
        admin_email: data.admin_email || email,
      };

      localStorage.setItem("admin", JSON.stringify(updatedAdmin));

      // The sidebar is already listening for this event.
      window.dispatchEvent(new Event("admin-profile-updated"));

      setUsername(updatedAdmin.admin_username);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      const originalUsername = String(
        storedAdmin?.admin_username || ""
      ).trim();

      const usernameChanged = cleanUsername !== originalUsername;

      let successMessage = "Profile updated successfully.";

      if (usernameChanged && wantsPasswordChange) {
        successMessage = "Username and password updated successfully.";
      } else if (usernameChanged) {
        successMessage = "Username updated successfully.";
      } else if (wantsPasswordChange) {
        successMessage = "Password updated successfully.";
      }

      showMessage(successMessage, "success");
    } catch (error) {
      console.error("Profile update error:", error);

      const errorMessage = String(error?.message || "");
      const lowerMessage = errorMessage.toLowerCase();

      if (lowerMessage.includes("current password is incorrect")) {
        showMessage("Current password is incorrect.", "error");
      } else if (
        lowerMessage.includes("function") &&
        lowerMessage.includes("update_admin_profile")
      ) {
        showMessage(
          "The profile update function is not installed in Supabase. Run the provided SQL script first.",
          "error"
        );
      } else {
        showMessage(
          errorMessage || "Failed to update the administrator profile.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
        <style>{PROFILE_INTERACTION_CSS}</style>

        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Profile</h1>
            <p style={styles.subtitle}>Manage your administrator account and security settings.</p>
          </div>

          <div style={styles.breadcrumb}>
            <span>Dashboard</span>
            <span style={styles.chevron}>›</span>
            <span>Profile</span>
          </div>
        </header>

        {message && (
          <div
            className="profile-alert"
            style={
              messageType === "error"
                ? { ...styles.alert, ...styles.alertError }
                : { ...styles.alert, ...styles.alertSuccess }
            }
          >
            {message}
          </div>
        )}

        <div style={styles.grid}>
          <section style={styles.card}>
            <SectionTitle
              icon={<User size={22} />}
              title="Account Information"
              desc="Update your username and review your registered email address."
            />

            <div style={styles.formGrid}>
              <Input
                label="Username"
                icon={<User size={18} />}
                value={username}
                setValue={setUsername}
              />

              <Input
                label="Email Address"
                icon={<Mail size={18} />}
                value={email}
                disabled
                note="This email address is linked to your administrator account and cannot be changed."
              />
            </div>

            <div style={styles.divider} />

            <SectionTitle
              icon={<Lock size={22} />}
              title="Password & Security"
              desc="Enter your current password to save username or password changes. Leave the new password fields blank when changing only your username."
            />

            <div style={styles.formGrid}>
              <div>
                <PasswordInput
                  label="Current Password"
                  value={currentPassword}
                  setValue={setCurrentPassword}
                  show={showCurrentPassword}
                  setShow={setShowCurrentPassword}
                />
                <p style={styles.fieldNote}>
                  Required to confirm any changes to your administrator account.
                </p>
              </div>

              <div>
                <PasswordInput
                  label="New Password"
                  value={newPassword}
                  setValue={setNewPassword}
                  show={showNewPassword}
                  setShow={setShowNewPassword}
                />
                <p style={styles.fieldNote}>
                  Use at least 8 characters, including an uppercase letter, lowercase letter, number, and special character.
                </p>
              </div>

              <PasswordInput
                label="Confirm New Password"
                value={confirmPassword}
                setValue={setConfirmPassword}
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
              />
            </div>

            <button
              className="profile-interactive profile-save-button"
              onClick={handleSave}
              style={{
                ...styles.saveBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              <Save size={18} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </section>


        </div>
    </>
  );
}

function SectionTitle({ icon, title, desc }) {
  return (
    <div style={styles.sectionTitle}>
      <div style={styles.sectionIcon}>{icon}</div>
      <div>
        <h3 style={styles.sectionHeading}>{title}</h3>
        <p style={styles.sectionDesc}>{desc}</p>
      </div>
    </div>
  );
}

function Input({ label, value, setValue, icon, disabled, type = "text", note }) {
  return (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>

      <div
        className={`profile-input-wrapper${value ? " has-value" : ""}${
          disabled ? " is-disabled" : ""
        }`}
        style={
          disabled
            ? { ...styles.inputWrapper, ...styles.disabledWrapper }
            : styles.inputWrapper
        }
      >
        {icon}
        <input
          className="profile-input-control"
          disabled={disabled}
          type={type}
          value={value}
          onChange={(e) => setValue && setValue(e.target.value)}
          style={styles.input}
        />
      </div>

      {note && <p style={styles.fieldNote}>{note}</p>}
    </div>
  );
}

function PasswordInput({ label, value, setValue, show, setShow }) {
  return (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>

      <div
        className={`profile-input-wrapper${value ? " has-value" : ""}`}
        style={styles.inputWrapper}
      >
        <Lock size={18} />
        <input
          className="profile-input-control"
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={styles.input}
        />
        <button
          className="profile-interactive profile-eye-button"
          type="button"
          onClick={() => setShow(!show)}
          style={styles.eyeBtn}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },

  title: {
    margin: 0,
    color: BRAND.brown,
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#5D5351",
    fontSize: 15,
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    color: BRAND.brown,
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  chevron: {
    color: "#9A8C89",
    fontSize: 22,
  },

  alert: {
    marginBottom: 18,
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 14,
    fontWeight: 800,
  },

  alertSuccess: {
    background: "#DDF4E7",
    color: "#0B8F45",
    border: "1px solid #B9E8CE",
  },

  alertError: {
    background: "#FFE5E5",
    color: "#C53030",
    border: "1px solid #FFC7C7",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: 24,
    alignItems: "start",
  },

  card: {
    background: "#fff",
    border: `1px solid ${BRAND.border}`,
    borderRadius: 16,
    boxShadow: "0 8px 18px rgba(51,26,18,0.07)",
    padding: 24,
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
    color: BRAND.brown,
  },

  sectionDesc: {
    margin: "4px 0 0",
    fontSize: 13,
    color: BRAND.muted,
    lineHeight: 1.4,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 18,
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: 800,
    color: BRAND.brown,
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "1px solid #E2D5D3",
    borderRadius: 7,
    padding: "0 14px",
    height: 46,
    background: "#fff",
    color: "#6C5B56",
    transition:
      "transform 0.16s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease",
  },

  disabledWrapper: {
    background: "#F8F3F2",
    color: "#A99B98",
  },

  input: {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: 14,
    color: BRAND.text,
    background: "transparent",
    minWidth: 0,
  },

  fieldNote: {
    margin: 0,
    fontSize: 12,
    color: BRAND.muted,
  },

  eyeBtn: {
    width: 30,
    height: 30,
    border: "none",
    borderRadius: 7,
    background: "transparent",
    color: BRAND.muted,
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition:
      "transform 0.14s ease, background 0.18s ease, color 0.18s ease",
  },

  divider: {
    height: 1,
    background: BRAND.border,
    margin: "14px 0 24px",
  },

  saveBtn: {
    marginTop: 10,
    height: 46,
    border: "none",
    background: BRAND.pink,
    color: "#fff",
    padding: "0 22px",
    borderRadius: 7,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    fontSize: 15,
    fontWeight: 800,
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, filter 0.18s ease",
  },

  noteBox: {
    background: "#FFFCFB",
    border: `1px solid ${BRAND.border}`,
    borderRadius: 12,
    padding: 16,
  },

  noteText: {
    margin: "0 0 10px",
    fontSize: 13,
    color: BRAND.muted,
    lineHeight: 1.5,
  },
};