import { MessagesSquare, Construction } from "lucide-react";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  softPink: "#FDEBED",
  border: "#EEE2E0",
  text: "#2E1B16",
  muted: "#6F625F",
};

export default function MessagesPage() {
  return (
    <>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Messages</h1>
          <p style={styles.subtitle}>
            Monitor conversations between pet owners and pet sitters.
          </p>
        </div>

        <div style={styles.breadcrumb}>
          <span>Dashboard</span>
          <span style={styles.chevron}>›</span>
          <span>Messages</span>
        </div>
      </header>

      <section style={styles.placeholderCard}>
        <div style={styles.iconCircle}>
          <MessagesSquare size={42} />
        </div>


        <h2 style={styles.placeholderTitle}>Messages Module</h2>

      </section>
    </>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
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

  placeholderCard: {
    width: "100%",
    minHeight: 430,
    borderRadius: 18,
    border: `1px solid ${BRAND.border}`,
    background: "#FFFFFF",
    boxShadow: "0 8px 18px rgba(51, 26, 18, 0.07)",
    padding: "48px 24px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: "50%",
    background: BRAND.softPink,
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  statusBadge: {
    minHeight: 32,
    borderRadius: 999,
    padding: "0 13px",
    background: "#FFF4DF",
    color: "#B36200",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 15,
  },

  placeholderTitle: {
    margin: 0,
    color: BRAND.text,
    fontSize: 25,
    fontWeight: 900,
  },

  placeholderText: {
    maxWidth: 590,
    margin: "12px 0 0",
    color: BRAND.muted,
    fontSize: 14,
    lineHeight: 1.7,
  },
};