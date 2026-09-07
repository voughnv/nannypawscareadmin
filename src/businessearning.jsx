import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  HandCoins,
  LockKeyhole,
  LogOut,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import {
  adminScaledFontSize,
  useAdminSettings,
} from "./context/AdminSettingsContext";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  text: "#2E1B16",
  muted: "#6F625F",
  border: "#EEE2DF",
};

const ROWS_PER_PAGE = 8;
const BUSINESS_OWNER_ACCESS_PASSWORD = "businessowner@123456";

const EARNINGS_CSS = `
  .business-earnings-page * {
    box-sizing: border-box;
  }

  .business-earnings-page button,
  .business-earnings-page input {
    font-family: inherit;
  }

  .business-earnings-page button:not(:disabled) {
    transition:
      transform 160ms ease,
      box-shadow 180ms ease,
      border-color 180ms ease,
      background-color 180ms ease,
      color 180ms ease,
      filter 180ms ease;
  }

  .business-earnings-page button:not(:disabled):hover {
    transform: translateY(-1px);
    filter: brightness(1.01);
  }

  .business-earnings-page button:not(:disabled):active {
    transform: translateY(0) scale(0.98);
  }

  .business-earnings-page button:focus-visible,
  .business-earnings-page input:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.42);
    outline-offset: 2px;
  }

  .business-earnings-page .earnings-stat-card {
    transition:
      transform 160ms ease,
      box-shadow 180ms ease,
      border-color 180ms ease;
  }

  .business-earnings-page .earnings-stat-card:hover {
    transform: translateY(-3px);
    border-color: rgba(217, 67, 104, 0.45) !important;
    box-shadow:
      0 13px 26px rgba(58, 30, 20, 0.11),
      0 0 0 2px rgba(217, 67, 104, 0.05) !important;
  }

  .business-earnings-page .earnings-search-shell {
    transition:
      transform 170ms ease,
      border-color 170ms ease,
      box-shadow 170ms ease,
      background-color 170ms ease;
  }

  .business-earnings-page .earnings-search-shell:focus-within {
    transform: translateY(-1px);
    border-color: ${BRAND.pink} !important;
    box-shadow:
      0 0 0 3px rgba(217, 67, 104, 0.10),
      0 7px 16px rgba(58, 30, 20, 0.06);
  }

  .business-earnings-page .earnings-date-input {
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease,
      background-color 160ms ease;
  }

  .business-earnings-page .earnings-date-input:focus {
    outline: none;
    transform: translateY(-1px);
    border-color: ${BRAND.pink} !important;
    box-shadow: 0 0 0 3px rgba(217, 67, 104, 0.10);
  }

  .business-earnings-page .earnings-row td {
    transition: background-color 150ms ease, box-shadow 150ms ease;
  }

  .business-earnings-page .earnings-row:hover td {
    background: var(--earn-hover);
  }

  .business-earnings-page .earnings-row:hover td:first-child {
    box-shadow: inset 3px 0 0 ${BRAND.pink};
  }

  .business-earnings-page .earnings-spinner-icon {
    animation: earnings-spin 0.8s linear infinite;
  }

  @keyframes earnings-spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1150px) {
    .business-earnings-page .earnings-stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 760px) {
    .business-earnings-page .earnings-header,
    .business-earnings-page .earnings-toolbar,
    .business-earnings-page .earnings-date-panel,
    .business-earnings-page .earnings-pagination {
      flex-direction: column;
      align-items: stretch !important;
    }

    .business-earnings-page .earnings-stats-grid {
      grid-template-columns: 1fr !important;
    }

    .business-earnings-page .earnings-search-shell {
      width: 100% !important;
      max-width: none !important;
    }

    .business-earnings-page .earnings-auth-actions {
      flex-direction: column-reverse;
    }

    .business-earnings-page .earnings-auth-actions button {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .business-earnings-page *,
    .business-earnings-page *::before,
    .business-earnings-page *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default function BusinessEarningPage() {
  const { settings } = useAdminSettings();
  const darkMode = Boolean(settings?.darkMode);

  const [accessGranted, setAccessGranted] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [unfinalizedCount, setUnfinalizedCount] = useState(0);
  const [currentSplit, setCurrentSplit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const theme = useMemo(
    () => ({
      "--earn-page": darkMode ? "#201A18" : "#FFFCFB",
      "--earn-card": darkMode ? "#2B2421" : "#FFFFFF",
      "--earn-soft": darkMode ? "#342C28" : "#FFFBFA",
      "--earn-input": darkMode ? "#362E2A" : "#FFFFFF",
      "--earn-text": darkMode ? "#FFF7F4" : "#1F1714",
      "--earn-strong": darkMode ? "#FFF7F4" : BRAND.brown,
      "--earn-muted": darkMode ? "#CFC2BE" : "#6D5F5B",
      "--earn-border": darkMode ? "#514540" : "#EEE2DF",
      "--earn-border-strong": darkMode ? "#5D4E48" : "#E2D5D3",
      "--earn-hover": darkMode ? "#34282C" : "#FFF5F7",
      "--earn-shadow": darkMode
        ? "0 8px 18px rgba(0,0,0,0.24)"
        : "0 8px 18px rgba(51,26,18,0.07)",
    }),
    [darkMode]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFrom, dateTo]);

  useEffect(() => {
    if (!accessGranted) return undefined;

    const bookingChannel = supabase
      .channel("business-owner-earnings-booking-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "BOOKING",
        },
        () => {
          fetchFinancialData(false);
        }
      )
      .subscribe();

    const serviceChannel = supabase
      .channel("business-owner-earnings-service-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "SERVICE_CATALOG",
        },
        () => {
          fetchFinancialData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(serviceChannel);
    };
  }, [accessGranted]);

  async function handleBusinessOwnerLogin(event) {
    event.preventDefault();

    if (!password) {
      setAuthError("Enter the Business Owner password to continue.");
      return;
    }

    if (password !== BUSINESS_OWNER_ACCESS_PASSWORD) {
      setAuthError("Incorrect Business Owner password. Please try again.");
      return;
    }

    setAuthError("");
    setPassword("");
    setShowPassword(false);
    setAccessGranted(true);
    await fetchFinancialData(true);
  }

  async function fetchFinancialData(firstLoad = false) {
    if (firstLoad) {
      setLoading(true);
    }

    setError("");

    try {
      const [bookingResult, splitResult] = await Promise.all([
        supabase
          .from("BOOKING")
          .select(
            "booking_id, service_type, payment_status, booking_status, paid_at, financial_service_price, pet_sitter_percentage_snapshot, business_owner_percentage_snapshot, pet_sitter_earnings, business_owner_earnings, financial_finalized_at"
          )
          .order("paid_at", { ascending: false }),
        supabase
          .from("SERVICE_CATALOG")
          .select("pet_sitter_percentage, business_owner_percentage"),
      ]);

      if (bookingResult.error) {
        throw bookingResult.error;
      }

      const paidCompletedRows = (bookingResult.data || []).filter((row) => {
        const bookingStatus = String(row?.booking_status || "")
          .trim()
          .toLowerCase();
        const paymentStatus = String(row?.payment_status || "")
          .trim()
          .toLowerCase();

        return (
          (bookingStatus === "completed" || bookingStatus === "complete") &&
          paymentStatus === "paid"
        );
      });

      const finalized = paidCompletedRows.filter((row) =>
        Boolean(row.financial_finalized_at)
      );
      const missingSnapshot = paidCompletedRows.filter(
        (row) => !row.financial_finalized_at
      ).length;

      setTransactions(finalized);
      setUnfinalizedCount(missingSnapshot);

      if (splitResult.error) {
        console.error(
          "Unable to load current Maintenance revenue split:",
          splitResult.error
        );
        setCurrentSplit(null);
      } else {
        const configuredRows = (splitResult.data || []).filter((row) => {
          const sitter = Number(row?.pet_sitter_percentage);
          const owner = Number(row?.business_owner_percentage);
          return Number.isFinite(sitter) && Number.isFinite(owner);
        });

        if (configuredRows.length === 0) {
          setCurrentSplit(null);
        } else {
          const sitterValues = [
            ...new Set(
              configuredRows.map((row) =>
                Number(row.pet_sitter_percentage).toFixed(2)
              )
            ),
          ];
          const ownerValues = [
            ...new Set(
              configuredRows.map((row) =>
                Number(row.business_owner_percentage).toFixed(2)
              )
            ),
          ];

          const sitter = Number(sitterValues[0]);
          const owner = Number(ownerValues[0]);

          if (
            sitterValues.length === 1 &&
            ownerValues.length === 1 &&
            Math.abs(sitter + owner - 100) < 0.005
          ) {
            setCurrentSplit({
              pet_sitter_percentage: sitter,
              business_owner_percentage: owner,
            });
          } else {
            console.error(
              "SERVICE_CATALOG revenue-sharing percentages are inconsistent."
            );
            setCurrentSplit(null);
          }
        }
      }
    } catch (fetchError) {
      console.error("Unable to load Business Earnings:", fetchError);

      const errorText = `${fetchError?.code || ""} ${
        fetchError?.message || ""
      }`.toLowerCase();

      if (
        errorText.includes("financial_service_price") ||
        errorText.includes("financial_finalized_at") ||
        errorText.includes("42703")
      ) {
        setError(
          "Business Earnings database setup is not complete yet. Run the Business Earnings SQL setup in Supabase first."
        );
      } else if (
        errorText.includes("permission") ||
        errorText.includes("row-level security") ||
        errorText.includes("42501")
      ) {
        setError(
          "The current Admin session does not have permission to read Business Earnings data. Please check the existing RLS policies."
        );
      } else {
        setError(
          "Business Earnings could not be loaded at this time. Please refresh the page and try again."
        );
      }
    } finally {
      if (firstLoad) {
        setLoading(false);
      }
    }
  }

  async function handleRefresh() {
    if (!accessGranted || refreshing) return;

    setRefreshing(true);
    await fetchFinancialData(false);
    setRefreshing(false);
  }

  function lockBusinessEarnings() {
    setAccessGranted(false);
    setPassword("");
    setShowPassword(false);
    setTransactions([]);
    setUnfinalizedCount(0);
    setCurrentSplit(null);
    setError("");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  }

  const stats = useMemo(() => {
    return transactions.reduce(
      (summary, transaction) => {
        summary.totalRevenue += toMoneyNumber(transaction.financial_service_price);
        summary.ownerEarnings += toMoneyNumber(transaction.business_owner_earnings);
        summary.sitterEarnings += toMoneyNumber(transaction.pet_sitter_earnings);
        summary.totalTransactions += 1;
        return summary;
      },
      {
        totalRevenue: 0,
        ownerEarnings: 0,
        sitterEarnings: 0,
        totalTransactions: 0,
      }
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const searchableValues = [
        transaction.booking_id,
        formatBookingId(transaction.booking_id),
        transaction.service_type,
      ]
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value).toLowerCase());

      const matchesSearch =
        !keyword || searchableValues.some((value) => value.includes(keyword));

      const transactionDate = getDateOnlyValue(
        transaction.financial_finalized_at || transaction.paid_at
      );

      const matchesDateFrom =
        !dateFrom || (transactionDate && transactionDate >= dateFrom);
      const matchesDateTo =
        !dateTo || (transactionDate && transactionDate <= dateTo);

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [transactions, search, dateFrom, dateTo]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / ROWS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredTransactions.slice(start, start + ROWS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const firstVisible =
    filteredTransactions.length === 0
      ? 0
      : (currentPage - 1) * ROWS_PER_PAGE + 1;

  const lastVisible = Math.min(
    currentPage * ROWS_PER_PAGE,
    filteredTransactions.length
  );

  if (!accessGranted) {
    return (
      <div className="business-earnings-page" style={{ ...theme, width: "100%" }}>
        <style>{EARNINGS_CSS}</style>

        <header className="earnings-header" style={styles.header}>
          <div>
            <h1 style={{ ...styles.title, color: "var(--earn-strong)" }}>
              Business Earnings
            </h1>
            <p style={{ ...styles.subtitle, color: "var(--earn-muted)" }}>
              Review completed and paid service earnings securely.
            </p>
          </div>

          <div style={{ ...styles.breadcrumb, color: "var(--earn-strong)" }}>
            <span>Dashboard</span>
            <span style={styles.chevron}>›</span>
            <span>Business Earnings</span>
          </div>
        </header>

        <section
          style={{
            ...styles.authShell,
            background: "var(--earn-card)",
            borderColor: "var(--earn-border)",
            boxShadow: "var(--earn-shadow)",
          }}
        >
          <div style={styles.authIconBox}>
            <LockKeyhole size={31} />
          </div>

          <div style={{ textAlign: "center", maxWidth: 560 }}>
            <p style={styles.authEyebrow}>Protected Financial Access</p>
            <h2 style={{ ...styles.authTitle, color: "var(--earn-strong)" }}>
              Business Owner Access
            </h2>
            <p style={{ ...styles.authDescription, color: "var(--earn-muted)" }}>
              Enter the Business Owner password to open the financial dashboard.
              This access gate is separate from the regular Admin login.
            </p>
          </div>

          <form onSubmit={handleBusinessOwnerLogin} style={styles.authForm}>
            {authError ? (
              <div style={styles.authErrorBox}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{authError}</span>
                <button
                  type="button"
                  onClick={() => setAuthError("")}
                  aria-label="Dismiss authentication message"
                  style={styles.messageClose}
                >
                  <X size={15} />
                </button>
              </div>
            ) : null}

            <label style={styles.fieldLabel}>
              <span style={{ ...styles.fieldTitle, color: "var(--earn-strong)" }}>
                Password
              </span>
              <div style={styles.passwordShell}>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="off"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter Business Owner password"
                  style={{
                    ...styles.authInput,
                    paddingRight: 48,
                    background: "var(--earn-input)",
                    borderColor: "var(--earn-border-strong)",
                    color: "var(--earn-text)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    ...styles.passwordToggle,
                    color: "var(--earn-muted)",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div className="earnings-auth-actions" style={styles.authActions}>
              <div style={{ ...styles.securityNote, color: "var(--earn-muted)" }}>
                <ShieldCheck size={17} color={BRAND.pink} />
                The password is required again after you lock or leave this page.
              </div>

              <button
                type="submit"
                style={primaryButtonStyle(false)}
              >
                <LockKeyhole size={17} />
                Open Business Earnings
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="business-earnings-page" style={{ ...theme, width: "100%" }}>
      <style>{EARNINGS_CSS}</style>

      <header className="earnings-header" style={styles.header}>
        <div>
          <h1 style={{ ...styles.title, color: "var(--earn-strong)" }}>
            Business Earnings
          </h1>
          <p style={{ ...styles.subtitle, color: "var(--earn-muted)" }}>
            Monitor financial results from completed and paid services.
          </p>
        </div>

        <div style={{ ...styles.headerRight, color: "var(--earn-strong)" }}>
          <div style={styles.breadcrumb}>
            <span>Dashboard</span>
            <span style={styles.chevron}>›</span>
            <span>Business Earnings</span>
          </div>
        </div>
      </header>

      <section className="earnings-stats-grid" style={styles.statsGrid}>
        <StatCard
          icon={<Banknote size={31} />}
          iconStyle={styles.statPink}
          title="Total Revenue"
          value={formatPeso(stats.totalRevenue)}
          description="Finalized paid services"
        />
        <StatCard
          icon={<WalletCards size={30} />}
          iconStyle={styles.statGreen}
          title="Business Owner Earnings"
          value={formatPeso(stats.ownerEarnings)}
          description="Historical owner share"
        />
        <StatCard
          icon={<HandCoins size={31} />}
          iconStyle={styles.statOrange}
          title="Pet Sitter Earnings"
          value={formatPeso(stats.sitterEarnings)}
          description="Historical sitter share"
        />
        <StatCard
          icon={<ReceiptText size={30} />}
          iconStyle={styles.statBlue}
          title="Total Transactions"
          value={stats.totalTransactions}
          description="Unique paid bookings"
        />
      </section>

      {error ? (
        <div style={styles.errorBox}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            style={styles.messageClose}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      ) : null}

      {unfinalizedCount > 0 ? (
        <div style={styles.warningBox}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>
            {unfinalizedCount} completed and paid booking
            {unfinalizedCount === 1 ? " is" : "s are"} missing a historical
            earnings snapshot and {unfinalizedCount === 1 ? "is" : "are"} not
            included in the totals. This prevents older transactions from being
            recalculated using a newer Maintenance percentage.
          </span>
        </div>
      ) : null}

      <section
        style={{
          ...styles.tableCard,
          background: "var(--earn-card)",
          borderColor: "var(--earn-border)",
          boxShadow: "var(--earn-shadow)",
        }}
      >
        <div className="earnings-toolbar" style={styles.toolbar}>
          <div style={styles.toolbarLeft}>
            <div
              className="earnings-search-shell"
              style={{
                ...styles.searchBox,
                background: "var(--earn-input)",
                borderColor: "var(--earn-border-strong)",
              }}
            >
              <Search size={21} color="var(--earn-muted)" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search booking ID or service"
                style={{ ...styles.searchInput, color: "var(--earn-text)" }}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowDateFilter((previous) => !previous)}
              style={{
                ...styles.secondaryToolbarButton,
                background: "var(--earn-card)",
                borderColor: "var(--earn-border-strong)",
                color: "var(--earn-strong)",
              }}
            >
              <Calendar size={19} />
              {showDateFilter ? "Hide date range" : "Select date range"}
            </button>
          </div>

          <div style={styles.toolbarActions}>
            <div
              style={{
                ...styles.accessBadge,
                background: "var(--earn-soft)",
                borderColor: "var(--earn-border)",
                color: "var(--earn-muted)",
              }}
              title="Business Owner password access"
            >
              <ShieldCheck size={16} color={BRAND.pink} />
              <span>
                Access: Business Owner
              </span>
            </div>

            {currentSplit ? (
              <div
                style={{
                  ...styles.currentSplit,
                  background: "var(--earn-soft)",
                  borderColor: "var(--earn-border)",
                  color: "var(--earn-muted)",
                }}
                title="Current Maintenance percentage. Historical totals use each transaction's saved snapshot."
              >
                Current Split:&nbsp;
                <strong style={{ color: "var(--earn-strong)" }}>
                  {formatPercentage(currentSplit.pet_sitter_percentage)} Sitter /{" "}
                  {formatPercentage(currentSplit.business_owner_percentage)} Owner
                </strong>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              style={{
                ...styles.secondaryToolbarButton,
                background: "var(--earn-card)",
                borderColor: "var(--earn-border-strong)",
                color: "var(--earn-strong)",
              }}
            >
              <RefreshCw
                size={18}
                className={refreshing ? "earnings-spinner-icon" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={lockBusinessEarnings}
              style={styles.lockButton}
              title="Lock Business Owner financial access"
            >
              <LogOut size={18} />
              Lock Access
            </button>
          </div>
        </div>

        {showDateFilter ? (
          <div
            className="earnings-date-panel"
            style={{
              ...styles.datePanel,
              background: "var(--earn-soft)",
              borderColor: "var(--earn-border)",
            }}
          >
            <label style={{ ...styles.dateLabel, color: "var(--earn-strong)" }}>
              From
              <input
                className="earnings-date-input"
                type="date"
                value={dateFrom}
                max={dateTo || "9999-12-31"}
                onChange={(event) => {
                  const nextValue = sanitizeDateInput(event.target.value);
                  setDateFrom(nextValue);
                  if (dateTo && nextValue && nextValue > dateTo) {
                    setDateTo(nextValue);
                  }
                }}
                style={{
                  ...styles.dateInput,
                  background: "var(--earn-input)",
                  borderColor: "var(--earn-border-strong)",
                  color: "var(--earn-text)",
                }}
              />
            </label>

            <label style={{ ...styles.dateLabel, color: "var(--earn-strong)" }}>
              To
              <input
                className="earnings-date-input"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                max="9999-12-31"
                onChange={(event) =>
                  setDateTo(sanitizeDateInput(event.target.value))
                }
                style={{
                  ...styles.dateInput,
                  background: "var(--earn-input)",
                  borderColor: "var(--earn-border-strong)",
                  color: "var(--earn-text)",
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              style={{
                ...styles.clearButton,
                background: "var(--earn-card)",
                borderColor: "var(--earn-border-strong)",
                color: "var(--earn-strong)",
              }}
            >
              Clear filters
            </button>
          </div>
        ) : null}

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr
                style={{
                  ...styles.tableHeadRow,
                  background: "var(--earn-soft)",
                  borderColor: "var(--earn-border)",
                }}
              >
                <Th width="120px">Transaction</Th>
                <Th width="150px">Date</Th>
                <Th width="220px">Service</Th>
                <Th width="140px" align="right">Service Price</Th>
                <Th width="120px" align="center">Sitter %</Th>
                <Th width="150px" align="right">Sitter Earnings</Th>
                <Th width="120px" align="center">Owner %</Th>
                <Th width="160px" align="right">Owner Earnings</Th>
                <Th width="120px" align="center">Payment</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={styles.emptyCell}>
                    <span style={styles.loadingContent}>
                      <RefreshCw size={20} className="earnings-spinner-icon" />
                      Loading financial records...
                    </span>
                  </td>
                </tr>
              ) : paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction) => (
                  <tr
                    key={transaction.booking_id}
                    className="earnings-row"
                    style={{ borderBottom: "1px solid var(--earn-border)" }}
                  >
                    <Td strong>{formatBookingId(transaction.booking_id)}</Td>
                    <Td muted>
                      {formatDateTime(
                        transaction.financial_finalized_at || transaction.paid_at
                      )}
                    </Td>
                    <Td>
                      <strong style={{ color: "var(--earn-text)" }}>
                        {transaction.service_type || "Not specified"}
                      </strong>
                    </Td>
                    <Td align="right" strong>
                      {formatPeso(transaction.financial_service_price)}
                    </Td>
                    <Td align="center">
                      {formatPercentage(
                        transaction.pet_sitter_percentage_snapshot
                      )}
                    </Td>
                    <Td align="right" strong>
                      {formatPeso(transaction.pet_sitter_earnings)}
                    </Td>
                    <Td align="center">
                      {formatPercentage(
                        transaction.business_owner_percentage_snapshot
                      )}
                    </Td>
                    <Td align="right" strong>
                      {formatPeso(transaction.business_owner_earnings)}
                    </Td>
                    <Td align="center">
                      <span style={styles.paidBadge}>Paid</span>
                    </Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={styles.emptyCell}>
                    No finalized paid transactions match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="earnings-pagination" style={styles.pagination}>
          <p style={{ ...styles.pageText, color: "var(--earn-text)" }}>
            Showing {firstVisible} to {lastVisible} of{" "}
            {filteredTransactions.length} transactions
          </p>

          <div style={styles.pages}>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
              style={pageButtonStyle(currentPage === 1, false)}
            >
              <ChevronLeft size={18} />
            </button>

            {getVisiblePages(currentPage, totalPages).map((page) =>
              typeof page === "string" ? (
                <span key={page} style={styles.ellipsis}>
                  …
                </span>
              ) : (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={pageButtonStyle(false, currentPage === page)}
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(page + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              style={pageButtonStyle(currentPage === totalPages, false)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          style={{
            ...styles.footerNote,
            borderColor: "var(--earn-border)",
            color: "var(--earn-muted)",
          }}
        >
          <ShieldCheck size={17} color={BRAND.pink} style={{ flexShrink: 0 }} />
          <span>
            Totals are calculated only from completed and paid bookings with an
            immutable financial snapshot. Current Maintenance percentages are
            shown for reference only and are never used to recalculate older
            finalized transactions.
          </span>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, iconStyle, title, value, description }) {
  return (
    <div
      className="earnings-stat-card"
      style={{
        ...styles.statCard,
        background: "var(--earn-card)",
        borderColor: "var(--earn-border)",
        boxShadow: "var(--earn-shadow)",
      }}
    >
      <div style={{ ...styles.statIcon, ...iconStyle }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ ...styles.statTitle, color: "var(--earn-text)" }}>{title}</p>
        <h2 style={{ ...styles.statValue, color: "var(--earn-strong)" }}>
          {value}
        </h2>
        <p style={{ ...styles.statDescription, color: "var(--earn-muted)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function Th({ children, width, align = "left" }) {
  return (
    <th
      style={{
        ...styles.th,
        width,
        textAlign: align,
        color: "var(--earn-text)",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left", muted = false, strong = false }) {
  return (
    <td
      style={{
        ...styles.td,
        textAlign: align,
        color: muted ? "var(--earn-muted)" : "var(--earn-text)",
        fontWeight: strong ? 800 : 500,
      }}
    >
      {children}
    </td>
  );
}

function formatBookingId(id) {
  if (id === null || id === undefined || id === "") return "N/A";
  return `BK-${String(id).padStart(4, "0")}`;
}

function toMoneyNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatPeso(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "₱0.00";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatPercentage(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${roundTwoDecimals(number)}%`;
}

function roundTwoDecimals(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getDateOnlyValue(value) {
  if (!value) return "";

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text.slice(0, 10);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function sanitizeDateInput(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const parts = text.split("-");
  const year = String(parts[0] || "").replace(/\D/g, "").slice(0, 4);
  const month = String(parts[1] || "").replace(/\D/g, "").slice(0, 2);
  const day = String(parts[2] || "").replace(/\D/g, "").slice(0, 2);

  if (year.length < 4 || month.length < 2 || day.length < 2) {
    return text;
  }

  const normalized = `${year}-${month}-${day}`;
  return normalized > "9999-12-31" ? "9999-12-31" : normalized;
}

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-left",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-left",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-right",
    totalPages,
  ];
}

function primaryButtonStyle(disabled = false) {
  return {
    minHeight: 44,
    border: "none",
    borderRadius: 9,
    background: BRAND.pink,
    color: "#FFFFFF",
    padding: "0 17px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: adminScaledFontSize(13),
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.58 : 1,
    boxShadow: disabled ? "none" : "0 6px 14px rgba(217,67,104,0.18)",
  };
}

function pageButtonStyle(disabled, active) {
  return {
    width: 34,
    height: 34,
    borderRadius: 7,
    border: `1px solid ${active ? BRAND.pink : "var(--earn-border-strong)"}`,
    background: active ? BRAND.pink : "var(--earn-card)",
    color: active ? "#FFFFFF" : "var(--earn-text)",
    fontSize: adminScaledFontSize(13),
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    marginBottom: 24,
  },

  title: {
    margin: 0,
    fontSize: adminScaledFontSize(34),
    fontWeight: 900,
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: adminScaledFontSize(15),
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    fontSize: adminScaledFontSize(14),
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  chevron: {
    color: "#9A8C89",
    fontSize: adminScaledFontSize(22),
  },

  authShell: {
    width: "min(760px, 100%)",
    minHeight: 520,
    margin: "30px auto 0",
    padding: "36px 34px",
    borderRadius: 18,
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  authIconBox: {
    width: 70,
    height: 70,
    borderRadius: 18,
    background: "#F9DCE5",
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  authEyebrow: {
    margin: "0 0 6px",
    color: BRAND.pink,
    fontSize: adminScaledFontSize(12),
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.7px",
  },

  authTitle: {
    margin: 0,
    fontSize: adminScaledFontSize(25),
    fontWeight: 900,
  },

  authDescription: {
    margin: "10px auto 0",
    fontSize: adminScaledFontSize(13.5),
    lineHeight: 1.6,
  },

  authForm: {
    width: "min(560px, 100%)",
    marginTop: 26,
  },

  authErrorBox: {
    marginBottom: 16,
    padding: "11px 13px",
    borderRadius: 9,
    border: "1px solid #F1BFC5",
    background: "#FFF0F2",
    color: "#B42335",
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    fontSize: adminScaledFontSize(12.5),
    fontWeight: 700,
    lineHeight: 1.5,
  },

  fieldLabel: {
    display: "block",
    marginBottom: 15,
  },

  fieldTitle: {
    display: "block",
    marginBottom: 7,
    fontSize: adminScaledFontSize(12.5),
    fontWeight: 900,
  },

  authInput: {
    width: "100%",
    height: 46,
    border: "1px solid",
    borderRadius: 8,
    padding: "0 13px",
    outline: "none",
    fontSize: adminScaledFontSize(14),
  },

  passwordShell: {
    position: "relative",
  },

  passwordToggle: {
    position: "absolute",
    top: "50%",
    right: 8,
    transform: "translateY(-50%)",
    width: 34,
    height: 34,
    border: 0,
    background: "transparent",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  authActions: {
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  securityNote: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 700,
    lineHeight: 1.45,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 18,
    marginBottom: 24,
  },

  statCard: {
    width: "100%",
    height: 118,
    borderRadius: 16,
    border: "1px solid",
    padding: 18,
    display: "flex",
    alignItems: "center",
    gap: 16,
    minWidth: 0,
  },

  statIcon: {
    width: 64,
    height: 64,
    minWidth: 64,
    borderRadius: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  statPink: {
    background: "#F9DCE5",
    color: "#D94D72",
  },

  statGreen: {
    background: "#DDF3E7",
    color: "#0D9B4A",
  },

  statOrange: {
    background: "#FCEBDD",
    color: "#F16C08",
  },

  statBlue: {
    background: "#E4ECFF",
    color: "#4D80DC",
  },

  statTitle: {
    margin: 0,
    fontSize: adminScaledFontSize(13),
    fontWeight: 800,
  },

  statValue: {
    margin: "5px 0 3px",
    fontSize: adminScaledFontSize(23),
    fontWeight: 900,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  },

  statDescription: {
    margin: 0,
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 600,
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    marginBottom: 18,
    borderRadius: 10,
    border: "1px solid #F1BFC5",
    background: "#FFF0F2",
    color: "#B42335",
    fontSize: adminScaledFontSize(13),
    fontWeight: 700,
  },

  warningBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "12px 14px",
    marginBottom: 18,
    borderRadius: 10,
    border: "1px solid #F0DCA3",
    background: "#FFF8E7",
    color: "#7A5A00",
    fontSize: adminScaledFontSize(12.5),
    fontWeight: 700,
    lineHeight: 1.5,
  },

  messageClose: {
    width: 26,
    height: 26,
    padding: 0,
    border: 0,
    background: "transparent",
    color: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  tableCard: {
    width: "100%",
    borderRadius: 16,
    border: "1px solid",
    padding: "22px 14px 0",
    overflow: "hidden",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    padding: "0 12px 22px",
  },

  toolbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flex: 1,
    minWidth: 0,
    flexWrap: "wrap",
  },

  toolbarActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  },

  searchBox: {
    width: 420,
    maxWidth: "100%",
    height: 48,
    border: "1px solid",
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
  },

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    marginLeft: 11,
    fontSize: adminScaledFontSize(14),
    background: "transparent",
    minWidth: 0,
  },

  secondaryToolbarButton: {
    height: 48,
    border: "1px solid",
    borderRadius: 7,
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    fontSize: adminScaledFontSize(13.5),
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  lockButton: {
    height: 48,
    border: "1px solid #EFC8D2",
    borderRadius: 7,
    background: "#FFF7F8",
    color: BRAND.pink,
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: adminScaledFontSize(13),
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  accessBadge: {
    minHeight: 48,
    border: "1px solid",
    borderRadius: 7,
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  currentSplit: {
    minHeight: 48,
    border: "1px solid",
    borderRadius: 7,
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    fontSize: adminScaledFontSize(11.5),
    whiteSpace: "nowrap",
  },

  datePanel: {
    margin: "0 12px 18px",
    padding: 14,
    border: "1px solid",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  dateLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: adminScaledFontSize(13),
    fontWeight: 800,
  },

  dateInput: {
    height: 38,
    border: "1px solid",
    borderRadius: 7,
    padding: "0 10px",
    outline: "none",
  },

  clearButton: {
    height: 38,
    border: "1px solid",
    borderRadius: 7,
    padding: "0 14px",
    fontSize: adminScaledFontSize(13),
    fontWeight: 800,
    cursor: "pointer",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: 1280,
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },

  tableHeadRow: {
    borderTop: "1px solid",
    borderBottom: "1px solid",
  },

  th: {
    padding: "15px 12px",
    fontSize: adminScaledFontSize(12),
    fontWeight: 900,
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },

  td: {
    padding: "16px 12px",
    fontSize: adminScaledFontSize(12.5),
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },

  paidBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 74,
    height: 26,
    padding: "0 9px",
    borderRadius: 7,
    border: "1px solid #D3ECDD",
    background: "#E7F6ED",
    color: "#167545",
    fontSize: adminScaledFontSize(11),
    fontWeight: 850,
  },

  emptyCell: {
    padding: 38,
    textAlign: "center",
    color: "var(--earn-muted)",
    fontSize: adminScaledFontSize(13.5),
    fontWeight: 700,
  },

  loadingContent: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
  },

  pagination: {
    padding: "15px 12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },

  pageText: {
    margin: 0,
    fontSize: adminScaledFontSize(13),
  },

  pages: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },

  ellipsis: {
    width: 24,
    textAlign: "center",
    color: "var(--earn-muted)",
    fontWeight: 800,
  },

  footerNote: {
    borderTop: "1px solid",
    padding: "13px 12px 15px",
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    fontSize: adminScaledFontSize(11.5),
    lineHeight: 1.5,
    fontWeight: 650,
  },
};
