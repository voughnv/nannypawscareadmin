import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

const BRAND = {
  maroon: "#7A1F3D",
  maroonDark: "#5C1730",
  maroonLight: "#F6E9EE",
  blush: "#FBEFF1",
  text: "#2B1A20",
  sub: "#8A7177",
};

function EyeIcon({ size = 17, color = "#8A7177" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ size = 17, color = "#8A7177" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function MailIcon({ size = 17, color = "#8A7177" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function LockIcon({ size = 17, color = "#8A7177" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2E7D45"
      strokeWidth="2.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Logo({ size = 56 }) {
  return (
    <img
      src="/nannylogo.png"
      alt="Nanny Paws Logo"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        border: `2px solid ${BRAND.maroonLight}`,
        boxShadow: "0 2px 8px rgba(122,31,61,0.12)",
      }}
    />
  );
}

function PrimaryButton({ children, disabled }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="submit"
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        height: 46,
        borderRadius: 10,
        border: "none",
        background: disabled
          ? "#BFA3AD"
          : hover
          ? BRAND.maroonDark
          : BRAND.maroon,
        color: "#fff",
        fontSize: 14.5,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 4,
      }}
    >
      {children}
    </button>
  );
}

function TextInput({ error, icon: Icon, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <Icon size={17} color={error ? "#B3404A" : BRAND.sub} />
      </div>

      <input
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 10,
          border: `1.5px solid ${
            error ? "#D98E94" : focused ? BRAND.maroon : "#E8D9DD"
          }`,
          background: "#fff",
          padding: "0 14px 0 40px",
          fontSize: 14.5,
          color: BRAND.text,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, error }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <LockIcon size={17} color={error ? "#B3404A" : BRAND.sub} />
      </div>

      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 10,
          border: `1.5px solid ${
            error ? "#D98E94" : focused ? BRAND.maroon : "#E8D9DD"
          }`,
          background: "#fff",
          padding: "0 40px",
          fontSize: 14.5,
          color: BRAND.text,
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      <button
        type="button"
        onClick={() => setShow((current) => !current)}
        aria-label={show ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
        }}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: BRAND.text,
          marginBottom: 6,
        }}
      >
        {label}
      </label>

      {children}

      {error && (
        <span
          style={{
            display: "block",
            fontSize: 12,
            color: "#B3404A",
            marginTop: 5,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  function validateEmail(email) {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid email.";
    }
    return "";
  }

  function validatePassword(password) {
    if (!password) return "Password is required.";
    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return "";
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    const newErrors = {
      email: validateEmail(loginEmail),
      password: validatePassword(loginPass),
    };

    setErrors(newErrors);

    if (newErrors.email || newErrors.password) return;

    setLoading(true);

    try {
      const email = loginEmail.trim().toLowerCase();

      const { data, error } = await supabase
        .from("ADMIN")
        .select("*")
        .eq("admin_email", email)
        .eq("admin_password", loginPass)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setMessage("Invalid admin email or password.");
        return;
      }

      localStorage.setItem("admin", JSON.stringify(data));
      setSuccessText("Redirecting to bookings page...");
      setSubmitted(true);

      window.setTimeout(() => {
        navigate("/bookings");
      }, 1000);
    } catch (error) {
      setMessage(error?.message || "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: `linear-gradient(135deg, ${BRAND.blush} 0%, #fff 50%, ${BRAND.blush} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: 20,
        boxSizing: "border-box",
        overflow: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          minHeight: 500,
          background: "#fff",
          borderRadius: 24,
          border: "1px solid rgba(240, 222, 227, 0.5)",
          boxShadow:
            "0 20px 60px rgba(122,31,61,0.08), 0 8px 24px rgba(122,31,61,0.04)",
          padding: "34px 40px 26px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <Logo size={80} />

          <h1
            style={{
              margin: "14px 0 4px",
              fontSize: 20,
              fontWeight: 700,
              color: BRAND.text,
            }}
          >
            Nanny Paws Care
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: BRAND.sub,
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            Administrator Portal
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {submitted ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#E7F4EA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckIcon />
              </div>

              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: BRAND.text,
                  fontSize: 16,
                }}
              >
                Login Successful
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: BRAND.sub,
                  textAlign: "center",
                }}
              >
                {successText}
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <Field label="Email Address" error={errors.email}>
                <TextInput
                  icon={MailIcon}
                  type="email"
                  placeholder="admin@nannypaws.com"
                  value={loginEmail}
                  onChange={(event) =>
                    setLoginEmail(event.target.value.toLowerCase())
                  }
                  error={errors.email}
                />
              </Field>

              <Field label="Password" error={errors.password}>
                <PasswordInput
                  placeholder="Enter your password"
                  value={loginPass}
                  onChange={(event) => setLoginPass(event.target.value)}
                  error={errors.password}
                />
              </Field>

              {message && (
                <p
                  style={{
                    color: "#B3404A",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  {message}
                </p>
              )}

              <PrimaryButton disabled={loading}>
                {loading ? (
                  "Logging in..."
                ) : (
                  <>
                    Log In <ArrowRightIcon />
                  </>
                )}
              </PrimaryButton>

              <p
                style={{
                  margin: "14px 0 0",
                  fontSize: 12,
                  color: BRAND.sub,
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                Sign in using your administrator account.
              </p>
            </form>
          )}
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: BRAND.sub,
            marginTop: 18,
            marginBottom: 0,
          }}
        >
          Nanny Paws Care • Administration Panel
        </p>
      </div>
    </div>
  );
}