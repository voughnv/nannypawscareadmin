import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  HandCoins,
  KeyRound,
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
import { useConfirmation } from "./context/ConfirmationProvider";
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
    .business-earnings-page .earnings-pagination,
    .business-earnings-page .payout-header,
    .business-earnings-page .payout-toolbar {
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

    .business-earnings-page .payout-detail-summary-grid {
      grid-template-columns: 1fr !important;
    }

    .business-earnings-page .payout-detail-footer {
      align-items: stretch !important;
    }
  }

  .business-earnings-page .payout-row {
    cursor: pointer;
  }

  .business-earnings-page .payout-row:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.42);
    outline-offset: -2px;
  }

  .business-earnings-page .payout-row:hover td {
    background: var(--earn-hover);
  }

  .business-earnings-page .payout-row:hover td:first-child {
    box-shadow: inset 3px 0 0 ${BRAND.pink};
  }

  .business-earnings-page .payout-modal-table-row td {
    transition: background-color 150ms ease;
  }

  .business-earnings-page .payout-modal-table-row:hover td {
    background: var(--earn-hover);
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
  const requestConfirmation = useConfirmation();
  const { settings } = useAdminSettings();
  const darkMode = Boolean(settings?.darkMode);

  const [accessGranted, setAccessGranted] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authenticating, setAuthenticating] = useState(false);

  const [showChangePasswordPanel, setShowChangePasswordPanel] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showChangePasswords, setShowChangePasswords] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [unfinalizedCount, setUnfinalizedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [payoutPeriod, setPayoutPeriod] = useState("month");
  const [customPayoutStart, setCustomPayoutStart] = useState("");
  const [customPayoutEnd, setCustomPayoutEnd] = useState("");
  const [payoutRows, setPayoutRows] = useState([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutNotice, setPayoutNotice] = useState("");
  const [payoutSearch, setPayoutSearch] = useState("");
  const [payoutUpdatingId, setPayoutUpdatingId] = useState(null);
  const [selectedPayoutSitterId, setSelectedPayoutSitterId] = useState(null);
  const [payoutConfirmationOpen, setPayoutConfirmationOpen] = useState(false);

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
    if (!accessGranted) return;

    setPayoutNotice("");
    setSelectedPayoutSitterId(null);
    setPayoutConfirmationOpen(false);

    if (payoutPeriod === "custom") {
      if (!customPayoutStart || !customPayoutEnd) {
        setPayoutRows([]);
        setPayoutLoading(false);
        setPayoutError("");
        return;
      }

      if (customPayoutEnd < customPayoutStart) {
        setPayoutRows([]);
        setPayoutLoading(false);
        setPayoutError(
          "The end date cannot be earlier than the start date."
        );
        return;
      }
    }

    fetchPayoutSummary(true);
  }, [
    payoutPeriod,
    customPayoutStart,
    customPayoutEnd,
    accessGranted,
  ]);

  useEffect(() => {
    if (!accessGranted) return undefined;

    const earningsChannel = supabase
      .channel("business-owner-earnings-transaction-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "BUSINESS_EARNINGS",
        },
        () => {
          fetchFinancialData(false);
          fetchPayoutSummary(false);
        }
      )
      .subscribe();

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
          fetchPayoutSummary(false);
        }
      )
      .subscribe();

    const sitterChannel = supabase
      .channel("business-owner-earnings-sitter-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "PET SITTER",
        },
        () => {
          fetchPayoutSummary(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(earningsChannel);
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(sitterChannel);
    };
  }, [accessGranted]);

  async function handleBusinessOwnerLogin(event) {
    event.preventDefault();

    if (!password) {
      setAuthError("Enter the Business Owner access password to continue.");
      return;
    }

    setAuthenticating(true);
    setAuthError("");

    try {
      const { data, error: verifyError } = await supabase.rpc(
        "verify_business_owner_password",
        { p_password: password }
      );

      if (verifyError) {
        throw verifyError;
      }

      if (!data) {
        setAuthError("The Business Owner access password is incorrect. Please try again.");
        return;
      }

      const verifiedPassword = password;
      setAccessPassword(verifiedPassword);
      setPassword("");
      setShowPassword(false);
      setShowChangePasswordPanel(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowChangePasswords(false);
      setChangePasswordError("");
      setAccessGranted(true);
      await fetchFinancialData(true, verifiedPassword);
    } catch (loginError) {
      console.error("Unable to verify Business Owner password:", loginError);

      const errorText = `${loginError?.code || ""} ${
        loginError?.message || ""
      }`.toLowerCase();

      if (
        errorText.includes("verify_business_owner_password") ||
        errorText.includes("pgrst202") ||
        errorText.includes("42883")
      ) {
        setAuthError(
          "Business Owner financial access has not been configured. Please contact the system administrator."
        );
      } else {
        setAuthError(
          "Business Owner financial access could not be verified. Please try again."
        );
      }
    } finally {
      setAuthenticating(false);
    }
  }

  async function fetchFinancialData(firstLoad = false, passwordOverride = "") {
    const activePassword = passwordOverride || accessPassword;

    if (!activePassword) return;

    if (firstLoad) {
      setLoading(true);
    }

    setError("");

    try {
      const [earningsResult, missingResult] = await Promise.all([
        supabase.rpc("get_business_earnings_transactions", {
          p_password: activePassword,
        }),
        supabase.rpc("get_business_earnings_missing_snapshot_count", {
          p_password: activePassword,
        }),
      ]);

      if (earningsResult.error) {
        throw earningsResult.error;
      }

      const earningsRows = earningsResult.data || [];
      const enrichedEarningsRows = await enrichTransactionsWithPetSitters(
        earningsRows
      );
      setTransactions(enrichedEarningsRows);

      if (missingResult.error) {
        console.error(
          "Unable to check missing Business Earnings snapshots:",
          missingResult.error
        );
        setUnfinalizedCount(0);
      } else {
        setUnfinalizedCount(Number(missingResult.data || 0));
      }

    } catch (fetchError) {
      console.error("Unable to load Business Earnings:", fetchError);

      const errorText = `${fetchError?.code || ""} ${
        fetchError?.message || ""
      }`.toLowerCase();

      if (
        errorText.includes("get_business_earnings_transactions") ||
        errorText.includes("pgrst202") ||
        errorText.includes("42883") ||
        errorText.includes("business_earnings") &&
          (errorText.includes("does not exist") || errorText.includes("42p01"))
      ) {
        setError(
          "Business Earnings is not fully configured. Please contact the system administrator."
        );
      } else if (
        errorText.includes("incorrect business owner password") ||
        errorText.includes("business owner authorization") ||
        errorText.includes("42501")
      ) {
        setError(
          "Your Business Owner financial access is no longer valid. Lock the dashboard, then enter the current access password again."
        );
      } else {
        setError(
          "Business Earnings could not be loaded at this time. Refresh the page and try again."
        );
      }
    } finally {
      if (firstLoad) {
        setLoading(false);
      }
    }
  }

  async function fetchPayoutSummary(showBusyState = true, passwordOverride = "") {
    const activePassword = passwordOverride || accessPassword;

    if (!activePassword) return;

    const range = getSelectedPayoutRange(
      payoutPeriod,
      customPayoutStart,
      customPayoutEnd
    );

    if (!range.start || !range.end) {
      setPayoutRows([]);
      if (showBusyState) setPayoutLoading(false);
      return;
    }

    if (range.end < range.start) {
      setPayoutRows([]);
      setPayoutError(
        "The end date cannot be earlier than the start date."
      );
      if (showBusyState) setPayoutLoading(false);
      return;
    }

    if (showBusyState) {
      setPayoutLoading(true);
    }

    setPayoutError("");

    try {
      const { data, error: payoutFetchError } = await supabase.rpc(
        "get_pet_sitter_payout_summary",
        {
          p_password: activePassword,
          p_period_start: range.start,
          p_period_end: range.end,
        }
      );

      if (payoutFetchError) throw payoutFetchError;

      setPayoutRows(data || []);
    } catch (payoutFetchError) {
      console.error("Unable to load Pet Sitter payout summary:", payoutFetchError);

      const errorText = `${payoutFetchError?.code || ""} ${
        payoutFetchError?.message || ""
      }`.toLowerCase();

      if (
        errorText.includes("get_pet_sitter_payout_summary") ||
        errorText.includes("pgrst202") ||
        errorText.includes("42883")
      ) {
        setPayoutError(
          "Pet Sitter payout tracking is not yet configured. Please apply the payout setup in the database."
        );
      } else {
        setPayoutError(
          "Pet Sitter payout information could not be loaded. Please refresh the page and try again."
        );
      }

      setPayoutRows([]);
    } finally {
      if (showBusyState) {
        setPayoutLoading(false);
      }
    }
  }

  async function updatePetSitterPayoutStatus(row, markPaid) {
    if (!row?.petsitter_id || payoutUpdatingId !== null) return;

    const range = getSelectedPayoutRange(
      payoutPeriod,
      customPayoutStart,
      customPayoutEnd
    );

    if (!range.start || !range.end || range.end < range.start) {
      setPayoutError(
        "Select a valid payout date range before updating the Pet Sitter payout status."
      );
      return;
    }

    const sitterName = row.sitter_name || `Pet Sitter ${row.petsitter_id}`;
    const amount = formatPeso(row.total_earnings);
    const periodLabel = formatPayoutRange(range.start, range.end);

    setPayoutConfirmationOpen(true);

    const confirmed = await requestConfirmation({
      title: markPaid ? "Mark Pet Sitter payout as paid?" : "Mark Pet Sitter payout as unpaid?",
      message: markPaid
        ? `Confirm that ${sitterName} has received ${amount} for ${periodLabel}. This records the payout status only and does not change the booking or earnings amount.`
        : `Mark ${sitterName}'s ${amount} payout for ${periodLabel} as unpaid? The earnings amount will remain unchanged.`,
      confirmText: markPaid ? "Mark as Paid" : "Mark as Unpaid",
      cancelText: "Cancel",
      variant: markPaid ? "primary" : "danger",
    });

    if (!confirmed) {
      setPayoutConfirmationOpen(false);
      return;
    }

    setPayoutUpdatingId(row.petsitter_id);
    setPayoutError("");
    setPayoutNotice("");

    try {
      const { data, error: payoutUpdateError } = await supabase.rpc(
        "set_pet_sitter_payout_status",
        {
          p_password: accessPassword,
          p_sitter_id: row.petsitter_id,
          p_period_start: range.start,
          p_period_end: range.end,
          p_paid: markPaid,
        }
      );

      if (payoutUpdateError) throw payoutUpdateError;

      const updatedCount = Number(data || 0);

      if (updatedCount <= 0) {
        throw new Error("No finalized Pet Sitter earnings were found for the selected period.");
      }

      await fetchPayoutSummary(false);

      setPayoutNotice(
        `${sitterName}'s payout for ${periodLabel} was marked as ${
          markPaid ? "Paid" : "Unpaid"
        }.`
      );
    } catch (payoutUpdateError) {
      console.error("Unable to update Pet Sitter payout status:", payoutUpdateError);

      const errorText = `${payoutUpdateError?.code || ""} ${
        payoutUpdateError?.message || ""
      }`.toLowerCase();

      setPayoutError(
        errorText.includes("set_pet_sitter_payout_status") ||
          errorText.includes("pgrst202") ||
          errorText.includes("42883")
          ? "Pet Sitter payout tracking is not yet configured. Please apply the payout setup in the database."
          : payoutUpdateError?.message ||
              "The Pet Sitter payout status could not be updated. Please try again."
      );
    } finally {
      setPayoutUpdatingId(null);
      setPayoutConfirmationOpen(false);
    }
  }

  function openPayoutSitterModal(row) {
    if (!row?.petsitter_id) return;
    setSelectedPayoutSitterId(row.petsitter_id);
    setPayoutNotice("");
    setPayoutError("");
  }

  function closePayoutSitterModal() {
    if (payoutUpdatingId !== null || payoutConfirmationOpen) return;
    setSelectedPayoutSitterId(null);
  }

  async function handleRefresh() {
    if (!accessGranted || refreshing) return;

    setRefreshing(true);
    await Promise.all([
      fetchFinancialData(false),
      fetchPayoutSummary(false),
    ]);
    setRefreshing(false);
  }

  function openChangePasswordPanel() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowChangePasswords(false);
    setChangePasswordError("");
    setAuthError("");
    setSuccessMessage("");
    setShowChangePasswordPanel(true);
  }

  function closeChangePasswordPanel() {
    if (changingPassword) return;

    setShowChangePasswordPanel(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowChangePasswords(false);
    setChangePasswordError("");
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setChangePasswordError("Enter all required password fields before saving.");
      return;
    }

    if (newPassword.length < 8) {
      setChangePasswordError("The new password must contain at least 8 characters.");
      return;
    }

    if (newPassword === currentPassword) {
      setChangePasswordError(
        "The new password must be different from the current password."
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("The new password and confirmation must match.");
      return;
    }

    setChangingPassword(true);
    setChangePasswordError("");

    try {
      const { data, error: changeError } = await supabase.rpc(
        "change_business_owner_password",
        {
          p_current_password: currentPassword,
          p_new_password: newPassword,
        }
      );

      if (changeError) {
        throw changeError;
      }

      if (!data) {
        setChangePasswordError(
          "The current Business Owner access password is incorrect."
        );
        return;
      }

      setAccessPassword(newPassword);
      setShowChangePasswordPanel(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowChangePasswords(false);
      setPassword("");
      setShowPassword(false);
      setAuthError("");
      setSuccessMessage(
        "Business Owner access password was updated successfully. Use the new password to access Business Earnings."
      );
    } catch (changeError) {
      console.error("Unable to change Business Owner password:", changeError);

      const errorText = `${changeError?.code || ""} ${
        changeError?.message || ""
      }`.toLowerCase();

      if (errorText.includes("current business owner password is incorrect")) {
        setChangePasswordError("The current Business Owner access password is incorrect.");
      } else if (
        errorText.includes("change_business_owner_password") ||
        errorText.includes("pgrst202") ||
        errorText.includes("42883")
      ) {
        setChangePasswordError(
          "Password management has not been configured. Please contact the system administrator."
        );
      } else {
        setChangePasswordError(
          "The Business Owner access password could not be updated. Please try again."
        );
      }
    } finally {
      setChangingPassword(false);
    }
  }

  function lockBusinessEarnings() {
    setAccessGranted(false);
    setAccessPassword("");
    setPassword("");
    setShowPassword(false);
    setTransactions([]);
    setUnfinalizedCount(0);
    setPayoutRows([]);
    setPayoutLoading(false);
    setPayoutError("");
    setPayoutNotice("");
    setPayoutSearch("");
    setPayoutPeriod("month");
    setCustomPayoutStart("");
    setCustomPayoutEnd("");
    setPayoutUpdatingId(null);
    setSelectedPayoutSitterId(null);
    setPayoutConfirmationOpen(false);
    setError("");
    setSuccessMessage("");
    setShowChangePasswordPanel(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowChangePasswords(false);
    setChangePasswordError("");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  }

  const stats = useMemo(() => {
    return transactions.reduce(
      (summary, transaction) => {
        summary.totalRevenue += toMoneyNumber(transaction.service_price_snapshot);
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
        transaction.service_name_snapshot,
        transaction.sitter_name,
      ]
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value).toLowerCase());

      const matchesSearch =
        !keyword || searchableValues.some((value) => value.includes(keyword));

      const transactionDate = getDateOnlyValue(
        transaction.financial_finalized_at
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

  const payoutRange = useMemo(
    () =>
      getSelectedPayoutRange(
        payoutPeriod,
        customPayoutStart,
        customPayoutEnd
      ),
    [payoutPeriod, customPayoutStart, customPayoutEnd]
  );

  const payoutRangeReady = Boolean(payoutRange.start && payoutRange.end);
  const manilaToday = getManilaTodayDate();

  const filteredPayoutRows = useMemo(() => {
    const keyword = payoutSearch.trim().toLowerCase();

    if (!keyword) return payoutRows;

    return payoutRows.filter((row) =>
      [row.petsitter_id, row.sitter_name, row.sitter_email]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [payoutRows, payoutSearch]);

  const payoutPeriodTotal = useMemo(
    () =>
      payoutRows.reduce(
        (total, row) => total + toMoneyNumber(row.total_earnings),
        0
      ),
    [payoutRows]
  );

  const selectedPayoutRow = useMemo(() => {
    if (selectedPayoutSitterId === null || selectedPayoutSitterId === undefined) {
      return null;
    }

    const selectedKey = normalizeReferenceKey(selectedPayoutSitterId);

    return (
      payoutRows.find(
        (row) => normalizeReferenceKey(row?.petsitter_id) === selectedKey
      ) || null
    );
  }, [payoutRows, selectedPayoutSitterId]);

  const selectedPayoutBookings = useMemo(() => {
    if (selectedPayoutSitterId === null || selectedPayoutSitterId === undefined) {
      return [];
    }

    const selectedKey = normalizeReferenceKey(selectedPayoutSitterId);

    return transactions
      .filter((transaction) => {
        if (normalizeReferenceKey(transaction?.ps_id) !== selectedKey) return false;

        const finalizedDate = getDateOnlyValue(transaction?.financial_finalized_at);

        return (
          payoutRangeReady &&
          finalizedDate &&
          finalizedDate >= payoutRange.start &&
          finalizedDate <= payoutRange.end
        );
      })
      .sort((left, right) => {
        const leftTime = new Date(left?.financial_finalized_at || 0).getTime();
        const rightTime = new Date(right?.financial_finalized_at || 0).getTime();
        return rightTime - leftTime;
      });
  }, [
    transactions,
    selectedPayoutSitterId,
    payoutRange.start,
    payoutRange.end,
    payoutRangeReady,
  ]);

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
              Securely review revenue, earnings allocations, and completed paid transactions.
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
            <p style={styles.authEyebrow}>Restricted Financial Access</p>
            <h2 style={{ ...styles.authTitle, color: "var(--earn-strong)" }}>
              Business Owner Financial Access
            </h2>
            <p style={{ ...styles.authDescription, color: "var(--earn-muted)" }}>
              Enter the Business Owner access password to view the financial dashboard.
              This additional access control is separate from the regular Admin login.
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
                  placeholder="Enter Business Owner access password"
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
                For security, the password is required again after this dashboard is locked or exited.
              </div>

              <button
                type="submit"
                disabled={authenticating}
                style={primaryButtonStyle(authenticating)}
              >
                {authenticating ? (
                  <RefreshCw size={17} className="earnings-spinner-icon" />
                ) : (
                  <LockKeyhole size={17} />
                )}
                {authenticating ? "Verifying..." : "Open Financial Dashboard"}
              </button>
            </div>
          </form>

          <div
            style={{
              ...styles.changePasswordLoginArea,
              borderColor: "var(--earn-border)",
            }}
          >
            {successMessage ? (
              <div style={{ ...styles.successBox, marginBottom: 14 }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{successMessage}</span>
                <button
                  type="button"
                  onClick={() => setSuccessMessage("")}
                  style={styles.messageClose}
                  aria-label="Dismiss success message"
                >
                  <X size={15} />
                </button>
              </div>
            ) : null}

            {!showChangePasswordPanel ? (
              <button
                type="button"
                onClick={openChangePasswordPanel}
                style={{
                  ...styles.changePasswordLinkButton,
                  color: BRAND.pink,
                }}
              >
                <KeyRound size={16} />
                Change Business Owner Access Password
              </button>
            ) : (
              <form
                onSubmit={handleChangePassword}
                style={{
                  ...styles.changePasswordInlinePanel,
                  background: "var(--earn-soft)",
                  borderColor: "var(--earn-border)",
                }}
              >
                <div style={styles.changePasswordInlineHeader}>
                  <div>
                    <p style={{ ...styles.changePasswordInlineTitle, color: "var(--earn-strong)" }}>
                      Change Access Password
                    </p>
                    <p style={{ ...styles.changePasswordInlineSubtitle, color: "var(--earn-muted)" }}>
                      Verify the current password, then enter and confirm a new Business Owner access password.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeChangePasswordPanel}
                    disabled={changingPassword}
                    aria-label="Close password settings"
                    style={{
                      ...styles.inlineCloseButton,
                      background: "var(--earn-card)",
                      borderColor: "var(--earn-border-strong)",
                      color: "var(--earn-strong)",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {changePasswordError ? (
                  <div style={styles.authErrorBox}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{changePasswordError}</span>
                  </div>
                ) : null}

                <PasswordField
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  visible={showChangePasswords}
                  autoComplete="current-password"
                  themeInput={{
                    background: "var(--earn-input)",
                    borderColor: "var(--earn-border-strong)",
                    color: "var(--earn-text)",
                  }}
                />

                <PasswordField
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showChangePasswords}
                  autoComplete="new-password"
                  themeInput={{
                    background: "var(--earn-input)",
                    borderColor: "var(--earn-border-strong)",
                    color: "var(--earn-text)",
                  }}
                />

                <PasswordField
                  label="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={setConfirmNewPassword}
                  visible={showChangePasswords}
                  autoComplete="new-password"
                  themeInput={{
                    background: "var(--earn-input)",
                    borderColor: "var(--earn-border-strong)",
                    color: "var(--earn-text)",
                  }}
                />

                <div style={styles.inlinePasswordFooter}>
                  <label style={{ ...styles.showPasswordRow, color: "var(--earn-muted)", margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={showChangePasswords}
                      onChange={(event) => setShowChangePasswords(event.target.checked)}
                    />
                    Show passwords
                  </label>

                  <div style={styles.inlinePasswordActions}>
                    <button
                      type="button"
                      onClick={closeChangePasswordPanel}
                      disabled={changingPassword}
                      style={{
                        ...styles.modalSecondaryButton,
                        background: "var(--earn-card)",
                        borderColor: "var(--earn-border-strong)",
                        color: "var(--earn-strong)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={changingPassword}
                      style={{
                        ...styles.modalPrimaryButton,
                        opacity: changingPassword ? 0.7 : 1,
                        cursor: changingPassword ? "not-allowed" : "pointer",
                      }}
                    >
                      {changingPassword ? (
                        <RefreshCw size={17} className="earnings-spinner-icon" />
                      ) : (
                        <KeyRound size={17} />
                      )}
                      {changingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
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
            Review revenue allocations and paid transaction records from completed services.
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
          description="Revenue from completed paid bookings"
        />
        <StatCard
          icon={<WalletCards size={30} />}
          iconStyle={styles.statGreen}
          title="Business Owner Earnings"
          value={formatPeso(stats.ownerEarnings)}
          description="Total allocated business share"
        />
        <StatCard
          icon={<HandCoins size={31} />}
          iconStyle={styles.statOrange}
          title="Pet Sitter Earnings"
          value={formatPeso(stats.sitterEarnings)}
          description="Total allocated sitter share"
        />
        <StatCard
          icon={<ReceiptText size={30} />}
          iconStyle={styles.statBlue}
          title="Total Transactions"
          value={stats.totalTransactions}
          description="Completed and paid bookings"
        />
      </section>

      {successMessage ? (
        <div style={styles.successBox}>
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            style={styles.messageClose}
            aria-label="Dismiss success message"
          >
            <X size={17} />
          </button>
        </div>
      ) : null}

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
            {unfinalizedCount === 1 ? " does" : "s do"} not have a historical
            earnings record and {unfinalizedCount === 1 ? "is" : "are"} excluded
            from the totals. This prevents a newer revenue-sharing percentage
            from being applied to past transactions.
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
                placeholder="Search by booking ID, service, or pet sitter"
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
              {showDateFilter ? "Hide Date Range" : "Filter by Date"}
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
              title="Business Owner financial access"
            >
              <ShieldCheck size={16} color={BRAND.pink} />
              <span>
                Authorized: Business Owner
              </span>
            </div>

            <div
              style={{
                ...styles.currentSplit,
                background: "var(--earn-soft)",
                borderColor: "var(--earn-border)",
                color: "var(--earn-muted)",
              }}
              title="Revenue-sharing percentages are configured individually for each Pet Sitter in Maintenance."
            >
              Revenue Sharing:&nbsp;
              <strong style={{ color: "var(--earn-strong)" }}>Per Pet Sitter</strong>
            </div>

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
              title="Lock the Business Owner financial dashboard"
            >
              <LogOut size={18} />
              Lock Dashboard
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
              Start Date
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
              End Date
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
              Clear Dates
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
                <Th width="120px">Booking ID</Th>
                <Th width="150px">Finalized Date</Th>
                <Th width="210px">Service</Th>
                <Th width="190px">Pet Sitter</Th>
                <Th width="140px" align="right">Service Price</Th>
                <Th width="120px" align="center">Sitter Share</Th>
                <Th width="150px" align="right">Sitter Earnings</Th>
                <Th width="120px" align="center">Owner Share</Th>
                <Th width="160px" align="right">Owner Earnings</Th>
                <Th width="120px" align="center">Payment Status</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={styles.emptyCell}>
                    <span style={styles.loadingContent}>
                      <RefreshCw size={20} className="earnings-spinner-icon" />
                      Loading earnings records...
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
                        transaction.financial_finalized_at
                      )}
                    </Td>
                    <Td>
                      <strong style={{ color: "var(--earn-text)" }}>
                        {transaction.service_name_snapshot || "Not specified"}
                      </strong>
                    </Td>
                    <Td>
                      <strong style={{ color: "var(--earn-text)" }}>
                        {transaction.sitter_name || "Not assigned"}
                      </strong>
                      {transaction.ps_id ? (
                        <div style={{
                          marginTop: 3,
                          color: "var(--earn-muted)",
                          fontSize: adminScaledFontSize(11),
                          fontWeight: 700,
                        }}>
                          Sitter ID: {transaction.ps_id}
                        </div>
                      ) : null}
                    </Td>
                    <Td align="right" strong>
                      {formatPeso(transaction.service_price_snapshot)}
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
                  <td colSpan={10} style={styles.emptyCell}>
                    No completed and paid transactions match the selected filters.
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
            Totals include only bookings that are both Completed and Paid and have a
            finalized earnings record. Each transaction retains the service price
            and revenue split recorded when it was finalized; changes in Maintenance
            apply only to future finalized transactions.
          </span>
        </div>
      </section>

      <section
        style={{
          ...styles.payoutCard,
          background: "var(--earn-card)",
          borderColor: "var(--earn-border)",
          boxShadow: "var(--earn-shadow)",
        }}
      >
        <div className="payout-header" style={styles.payoutHeader}>
          <div>
            <h2 style={{ ...styles.payoutTitle, color: "var(--earn-strong)" }}>
              Pet Sitter Payouts
            </h2>
            <p style={{ ...styles.payoutSubtitle, color: "var(--earn-muted)" }}>
              Review each Pet Sitter's earnings for the selected period and record whether the payout has been issued.
            </p>
          </div>

          <div style={styles.payoutPeriodButtons}>
            <button
              type="button"
              onClick={() => setPayoutPeriod("week")}
              style={payoutPeriodButtonStyle(payoutPeriod === "week")}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => {
                setPayoutPeriod("custom");
                setCustomPayoutEnd((current) => current || getManilaTodayDate());
              }}
              style={payoutPeriodButtonStyle(payoutPeriod === "custom")}
            >
              Custom Date Range
            </button>
            <button
              type="button"
              onClick={() => setPayoutPeriod("month")}
              style={payoutPeriodButtonStyle(payoutPeriod === "month")}
            >
              This Month
            </button>
          </div>
        </div>

        {payoutPeriod === "custom" ? (
          <div
            style={{
              ...styles.payoutCustomRangePanel,
              background: "var(--earn-soft)",
              borderColor: "var(--earn-border)",
            }}
          >
            <div style={styles.payoutCustomRangeFields}>
              <label style={{ ...styles.payoutCustomDateLabel, color: "var(--earn-strong)" }}>
                Start Date
                <input
                  className="earnings-date-input"
                  type="date"
                  value={customPayoutStart}
                  max={customPayoutEnd || manilaToday}
                  onChange={(event) => {
                    const nextValue = sanitizeDateInput(event.target.value);
                    setCustomPayoutStart(nextValue);
                    setPayoutError("");
                  }}
                  style={{
                    ...styles.payoutCustomDateInput,
                    background: "var(--earn-input)",
                    borderColor: "var(--earn-border-strong)",
                    color: "var(--earn-text)",
                  }}
                />
              </label>

              <label style={{ ...styles.payoutCustomDateLabel, color: "var(--earn-strong)" }}>
                End Date
                <input
                  className="earnings-date-input"
                  type="date"
                  value={customPayoutEnd}
                  min={customPayoutStart || undefined}
                  max={manilaToday}
                  onChange={(event) => {
                    const nextValue = sanitizeDateInput(event.target.value);
                    setCustomPayoutEnd(nextValue);
                    setPayoutError("");
                  }}
                  style={{
                    ...styles.payoutCustomDateInput,
                    background: "var(--earn-input)",
                    borderColor: "var(--earn-border-strong)",
                    color: "var(--earn-text)",
                  }}
                />
              </label>
            </div>

            <div style={{ ...styles.payoutCustomRangeHelp, color: "var(--earn-muted)" }}>
              <Calendar size={17} color={BRAND.pink} style={{ flexShrink: 0 }} />
              <span>
                Select the start and end dates for the payout period. Only finalized Pet Sitter earnings within this selected date range are included.
              </span>
            </div>
          </div>
        ) : null}

        <div className="payout-toolbar" style={styles.payoutToolbar}>
          <div
            className="earnings-search-shell"
            style={{
              ...styles.payoutSearchBox,
              background: "var(--earn-input)",
              borderColor: "var(--earn-border-strong)",
            }}
          >
            <Search size={20} color="var(--earn-muted)" />
            <input
              value={payoutSearch}
              onChange={(event) => setPayoutSearch(event.target.value)}
              placeholder="Search Pet Sitter"
              style={{ ...styles.searchInput, color: "var(--earn-text)" }}
            />
          </div>

          <div style={{ ...styles.payoutPeriodSummary, color: "var(--earn-muted)" }}>
            <Calendar size={17} color={BRAND.pink} />
            <span>
              <strong style={{ color: "var(--earn-strong)" }}>
                {payoutRangeReady
                  ? formatPayoutRange(payoutRange.start, payoutRange.end)
                  : "Select payout dates"}
              </strong>
              {payoutRangeReady
                ? <> {" • "}Total Sitter Earnings: {formatPeso(payoutPeriodTotal)}</>
                : null}
            </span>
          </div>
        </div>

        {payoutNotice ? (
          <div style={{ ...styles.payoutMessage, ...styles.payoutSuccessMessage }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{payoutNotice}</span>
            <button
              type="button"
              onClick={() => setPayoutNotice("")}
              style={styles.messageClose}
              aria-label="Dismiss payout message"
            >
              <X size={15} />
            </button>
          </div>
        ) : null}

        {payoutError ? (
          <div style={{ ...styles.payoutMessage, ...styles.payoutErrorMessage }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{payoutError}</span>
            <button
              type="button"
              onClick={() => setPayoutError("")}
              style={styles.messageClose}
              aria-label="Dismiss payout error"
            >
              <X size={15} />
            </button>
          </div>
        ) : null}

        <div style={styles.tableWrapper}>
          <table style={styles.payoutTable}>
            <thead>
              <tr
                style={{
                  ...styles.tableHeadRow,
                  background: "var(--earn-soft)",
                  borderColor: "var(--earn-border)",
                }}
              >
                <Th width="260px">Pet Sitter</Th>
                <Th width="150px" align="center">Completed Paid Bookings</Th>
                <Th width="170px" align="right">Sitter Earnings</Th>
                <Th width="140px" align="center">Payout Status</Th>
                <Th width="180px">Paid On</Th>
                <Th width="160px" align="right">Amount Paid</Th>
                <Th width="170px" align="right">Remaining Balance</Th>
                <Th width="130px" align="center">View</Th>
              </tr>
            </thead>
            <tbody>
              {payoutLoading ? (
                <tr>
                  <td colSpan={8} style={styles.emptyCell}>
                    <span style={styles.loadingContent}>
                      <RefreshCw size={20} className="earnings-spinner-icon" />
                      Loading Pet Sitter payout records...
                    </span>
                  </td>
                </tr>
              ) : filteredPayoutRows.length > 0 ? (
                filteredPayoutRows.map((row) => {
                  const status = normalizePayoutStatus(row.payout_status);

                  return (
                    <tr
                      key={row.petsitter_id}
                      className="payout-row"
                      role="button"
                      tabIndex={0}
                      aria-label={`View payout details for ${
                        row.sitter_name || `Pet Sitter ${row.petsitter_id}`
                      }`}
                      onClick={() => openPayoutSitterModal(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openPayoutSitterModal(row);
                        }
                      }}
                      style={{
                        borderBottom: "1px solid var(--earn-border)",
                        cursor: "pointer",
                      }}
                    >
                      <Td>
                        <strong style={{ color: "var(--earn-text)" }}>
                          {row.sitter_name || `Pet Sitter ${row.petsitter_id}`}
                        </strong>
                        <div style={styles.payoutSitterMeta}>
                          ID: {row.petsitter_id}
                          {row.sitter_email ? ` • ${row.sitter_email}` : ""}
                        </div>
                      </Td>
                      <Td align="center" strong>
                        {Number(row.booking_count || 0)}
                      </Td>
                      <Td align="right" strong>
                        {formatPeso(row.total_earnings)}
                      </Td>
                      <Td align="center">
                        <span style={payoutStatusBadgeStyle(status)}>
                          {formatPayoutStatus(status)}
                        </span>
                      </Td>
                      <Td muted>
                        {row.paid_at
                          ? status === "PARTIALLY_PAID"
                            ? `Latest: ${formatDateTime(row.paid_at)}`
                            : formatDateTime(row.paid_at)
                          : "—"}
                      </Td>
                      <Td align="right" strong>
                        {formatPeso(getPayoutAmountPaid(row))}
                      </Td>
                      <Td align="right" strong>
                        {formatPeso(row.remaining_balance)}
                      </Td>
                      <Td align="center">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openPayoutSitterModal(row);
                          }}
                          style={payoutViewButtonStyle()}
                          aria-label={`View ${
                            row.sitter_name || `Pet Sitter ${row.petsitter_id}`
                          } payout details`}
                        >
                          <Eye size={15} />
                          View Details
                        </button>
                      </Td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={styles.emptyCell}>
                    {payoutPeriod === "custom" && !payoutRangeReady
                      ? "Select a start date and end date to load Pet Sitter earnings."
                      : "No Pet Sitters match the current search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
            Payout status is tracked separately from booking payment status. Marking a Pet Sitter as Paid or Unpaid does not change the finalized booking amount or historical earnings allocation.
          </span>
        </div>
      </section>



      {selectedPayoutRow && !payoutConfirmationOpen ? (
        <div
          style={styles.payoutModalOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePayoutSitterModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pet-sitter-payout-modal-title"
            style={{
              ...styles.payoutDetailModal,
              background: "var(--earn-card)",
              borderColor: "var(--earn-border)",
              boxShadow: "var(--earn-shadow)",
            }}
          >
            <div
              style={{
                ...styles.payoutDetailModalHeader,
                borderColor: "var(--earn-border)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={styles.payoutModalEyebrow}>Pet Sitter Payout Details</p>
                <h2
                  id="pet-sitter-payout-modal-title"
                  style={{ ...styles.payoutDetailModalTitle, color: "var(--earn-strong)" }}
                >
                  {selectedPayoutRow.sitter_name ||
                    `Pet Sitter ${selectedPayoutRow.petsitter_id}`}
                </h2>
                <p style={{ ...styles.payoutDetailModalSubtitle, color: "var(--earn-muted)" }}>
                  Sitter ID: {selectedPayoutRow.petsitter_id}
                  {selectedPayoutRow.sitter_email
                    ? ` • ${selectedPayoutRow.sitter_email}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={closePayoutSitterModal}
                disabled={payoutUpdatingId !== null}
                aria-label="Close Pet Sitter payout details"
                style={{
                  ...styles.modalCloseButton,
                  background: "var(--earn-card)",
                  borderColor: "var(--earn-border-strong)",
                  color: "var(--earn-strong)",
                  opacity: payoutUpdatingId !== null ? 0.55 : 1,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.payoutDetailBody}>
              <div
                className="payout-detail-summary-grid"
                style={styles.payoutDetailSummaryGrid}
              >
                <PayoutSummaryBox
                  label="Selected Period"
                  value={
                    payoutRangeReady
                      ? formatPayoutRange(payoutRange.start, payoutRange.end)
                      : "Not selected"
                  }
                />
                <PayoutSummaryBox
                  label="Completed Paid Bookings"
                  value={Number(selectedPayoutRow.booking_count || 0)}
                />
                <PayoutSummaryBox
                  label="Sitter Earnings"
                  value={formatPeso(selectedPayoutRow.total_earnings)}
                  strong
                />
                <PayoutSummaryBox
                  label="Remaining Balance"
                  value={formatPeso(selectedPayoutRow.remaining_balance)}
                  strong
                />
                <PayoutSummaryBox
                  label="Payout Status"
                  value={
                    <span
                      style={payoutStatusBadgeStyle(
                        normalizePayoutStatus(selectedPayoutRow.payout_status)
                      )}
                    >
                      {formatPayoutStatus(selectedPayoutRow.payout_status)}
                    </span>
                  }
                />
              </div>

              <div style={styles.payoutDetailSectionHeader}>
                <div>
                  <h3 style={{ ...styles.payoutDetailSectionTitle, color: "var(--earn-strong)" }}>
                    Bookings Included in This Payout Period
                  </h3>
                  <p style={{ ...styles.payoutDetailSectionSubtitle, color: "var(--earn-muted)" }}>
                    These are the completed and paid bookings that contribute to this Pet Sitter's earnings for the selected period.
                  </p>
                </div>
                <div style={{ ...styles.payoutDetailPaidOn, color: "var(--earn-muted)" }}>
                  {normalizePayoutStatus(selectedPayoutRow.payout_status) === "PAID" &&
                  selectedPayoutRow.paid_at
                    ? `Paid on ${formatDateTime(selectedPayoutRow.paid_at)}`
                    : normalizePayoutStatus(selectedPayoutRow.payout_status) ===
                        "PARTIALLY_PAID" && selectedPayoutRow.paid_at
                      ? `Latest payout recorded on ${formatDateTime(selectedPayoutRow.paid_at)}.`
                      : "No payout date recorded."}
                </div>
              </div>

              <div
                style={{
                  ...styles.payoutDetailTableShell,
                  borderColor: "var(--earn-border)",
                }}
              >
                <div style={styles.tableWrapper}>
                  <table style={styles.payoutDetailTable}>
                    <thead>
                      <tr
                        style={{
                          ...styles.tableHeadRow,
                          background: "var(--earn-soft)",
                          borderColor: "var(--earn-border)",
                        }}
                      >
                        <Th width="120px">Booking ID</Th>
                        <Th width="165px">Finalized Date</Th>
                        <Th width="220px">Service</Th>
                        <Th width="130px" align="right">Service Price</Th>
                        <Th width="115px" align="center">Sitter Share</Th>
                        <Th width="150px" align="right">Sitter Earnings</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPayoutBookings.length > 0 ? (
                        selectedPayoutBookings.map((transaction) => (
                          <tr
                            key={transaction.booking_id}
                            className="payout-modal-table-row"
                            style={{ borderBottom: "1px solid var(--earn-border)" }}
                          >
                            <Td strong>{formatBookingId(transaction.booking_id)}</Td>
                            <Td muted>{formatDateTime(transaction.financial_finalized_at)}</Td>
                            <Td>
                              <strong style={{ color: "var(--earn-text)" }}>
                                {transaction.service_name_snapshot || "Not specified"}
                              </strong>
                            </Td>
                            <Td align="right" strong>
                              {formatPeso(transaction.service_price_snapshot)}
                            </Td>
                            <Td align="center">
                              {formatPercentage(
                                transaction.pet_sitter_percentage_snapshot
                              )}
                            </Td>
                            <Td align="right" strong>
                              {formatPeso(transaction.pet_sitter_earnings)}
                            </Td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={styles.emptyCell}>
                            No completed and paid bookings were finalized for this Pet Sitter during the selected period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div
              className="payout-detail-footer"
              style={{
                ...styles.payoutDetailFooter,
                borderColor: "var(--earn-border)",
                background: "var(--earn-soft)",
              }}
            >
              <div style={{ ...styles.payoutDetailFooterNote, color: "var(--earn-muted)" }}>
                <ShieldCheck size={16} color={BRAND.pink} />
                Payout status is separate from the customer's booking payment status.
              </div>

              <div style={styles.payoutDetailFooterActions}>
                <button
                  type="button"
                  onClick={closePayoutSitterModal}
                  disabled={payoutUpdatingId !== null}
                  style={{
                    ...styles.modalSecondaryButton,
                    background: "var(--earn-card)",
                    borderColor: "var(--earn-border-strong)",
                    color: "var(--earn-strong)",
                    opacity: payoutUpdatingId !== null ? 0.55 : 1,
                  }}
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={
                    Number(selectedPayoutRow.booking_count || 0) <= 0 ||
                    payoutUpdatingId !== null
                  }
                  onClick={() => {
                    const status = normalizePayoutStatus(
                      selectedPayoutRow.payout_status
                    );
                    updatePetSitterPayoutStatus(
                      selectedPayoutRow,
                      status !== "PAID"
                    );
                  }}
                  style={payoutActionButtonStyle({
                    disabled:
                      Number(selectedPayoutRow.booking_count || 0) <= 0 ||
                      payoutUpdatingId !== null,
                    isPaid:
                      normalizePayoutStatus(selectedPayoutRow.payout_status) ===
                      "PAID",
                  })}
                >
                  {payoutUpdatingId === selectedPayoutRow.petsitter_id ? (
                    <RefreshCw size={15} className="earnings-spinner-icon" />
                  ) : normalizePayoutStatus(selectedPayoutRow.payout_status) ===
                    "PAID" ? (
                    <X size={15} />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {Number(selectedPayoutRow.booking_count || 0) <= 0
                    ? "No Earnings"
                    : payoutUpdatingId === selectedPayoutRow.petsitter_id
                      ? "Updating..."
                      : normalizePayoutStatus(selectedPayoutRow.payout_status) ===
                          "PAID"
                        ? "Mark Unpaid"
                        : "Mark Paid"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  autoComplete,
  themeInput,
}) {
  return (
    <label style={styles.fieldLabel}>
      <span style={{ ...styles.fieldTitle, color: "var(--earn-strong)" }}>
        {label}
      </span>
      <input
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ ...styles.authInput, ...themeInput }}
      />
    </label>
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

function PayoutSummaryBox({ label, value, strong = false }) {
  return (
    <div
      style={{
        ...styles.payoutSummaryBox,
        background: "var(--earn-soft)",
        borderColor: "var(--earn-border)",
      }}
    >
      <span style={{ ...styles.payoutSummaryLabel, color: "var(--earn-muted)" }}>
        {label}
      </span>
      <div
        style={{
          ...styles.payoutSummaryValue,
          color: "var(--earn-strong)",
          fontWeight: strong ? 900 : 800,
        }}
      >
        {value}
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

async function enrichTransactionsWithPetSitters(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];

  if (safeRows.length === 0) return [];

  const bookingIds = [
    ...new Set(
      safeRows
        .map((row) => row?.booking_id)
        .filter((id) => id !== null && id !== undefined && id !== "")
    ),
  ];

  if (bookingIds.length === 0) {
    return safeRows.map((row) => ({
      ...row,
      ps_id: null,
      sitter_name: "Not assigned",
    }));
  }

  const { data: bookingRows, error: bookingError } = await supabase
    .from("BOOKING")
    .select("booking_id, ps_id")
    .in("booking_id", bookingIds);

  if (bookingError) {
    console.error(
      "Unable to load booking sitter references for Business Earnings:",
      bookingError
    );

    return safeRows.map((row) => ({
      ...row,
      ps_id: null,
      sitter_name: "Unavailable",
    }));
  }

  const bookingMap = new Map(
    (bookingRows || []).map((booking) => [
      normalizeReferenceKey(booking.booking_id),
      booking,
    ])
  );

  const sitterIds = [
    ...new Set(
      (bookingRows || [])
        .map((booking) => booking?.ps_id)
        .filter((id) => id !== null && id !== undefined && id !== "")
    ),
  ];

  let sitterRows = [];

  if (sitterIds.length > 0) {
    const { data, error: sitterError } = await supabase
      .from("PET SITTER")
      .select("petsitter_id, ps_fname, ps_lname, ps_username")
      .in("petsitter_id", sitterIds);

    if (sitterError) {
      console.error(
        "Unable to load Pet Sitter names for Business Earnings:",
        sitterError
      );
    } else {
      sitterRows = data || [];
    }
  }

  const sitterMap = new Map(
    sitterRows.map((sitter) => [
      normalizeReferenceKey(sitter.petsitter_id),
      sitter,
    ])
  );

  return safeRows.map((row) => {
    const booking =
      bookingMap.get(normalizeReferenceKey(row.booking_id)) || null;
    const sitterId = booking?.ps_id ?? null;
    const sitter =
      sitterMap.get(normalizeReferenceKey(sitterId)) || null;

    return {
      ...row,
      ps_id: sitterId,
      sitter_name: getBusinessEarningsSitterName(sitter, sitterId),
    };
  });
}

function normalizeReferenceKey(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getBusinessEarningsSitterName(sitter, fallbackId) {
  if (!sitter) {
    return fallbackId ? `Pet Sitter ${fallbackId}` : "Not assigned";
  }

  const fullName = `${sitter.ps_fname || ""} ${sitter.ps_lname || ""}`.trim();

  return (
    fullName ||
    sitter.ps_username ||
    (fallbackId ? `Pet Sitter ${fallbackId}` : "Not assigned")
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

function getPayoutAmountPaid(row) {
  const totalEarnings = Math.max(0, toMoneyNumber(row?.total_earnings));

  if (
    row?.remaining_balance !== null &&
    row?.remaining_balance !== undefined &&
    row?.remaining_balance !== ""
  ) {
    const remainingBalance = Math.max(
      0,
      toMoneyNumber(row.remaining_balance)
    );

    return roundTwoDecimals(
      Math.max(0, Math.min(totalEarnings, totalEarnings - remainingBalance))
    );
  }

  return normalizePayoutStatus(row?.payout_status) === "PAID"
    ? roundTwoDecimals(totalEarnings)
    : 0;
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

function getSelectedPayoutRange(period, customStart = "", customEnd = "") {
  if (period === "custom") {
    return {
      start: String(customStart || "").trim(),
      end: String(customEnd || "").trim(),
    };
  }

  return getCurrentPayoutRange(period);
}

function getManilaTodayDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => ["year", "month", "day"].includes(part.type))
      .map((part) => [part.type, Number(part.value)])
  );

  return `${values.year}-${String(values.month).padStart(2, "0")}-${String(
    values.day
  ).padStart(2, "0")}`;
}

function getCurrentPayoutRange(period) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => ["year", "month", "day"].includes(part.type))
      .map((part) => [part.type, Number(part.value)])
  );

  const today = new Date(Date.UTC(values.year, values.month - 1, values.day));

  if (period === "week") {
    const dayIndex = today.getUTCDay();
    const daysSinceMonday = dayIndex === 0 ? 6 : dayIndex - 1;
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - daysSinceMonday);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);

    return {
      start: formatUtcDateOnly(start),
      end: formatUtcDateOnly(end),
    };
  }

  const start = new Date(Date.UTC(values.year, values.month - 1, 1));
  const end = new Date(Date.UTC(values.year, values.month, 0));

  return {
    start: formatUtcDateOnly(start),
    end: formatUtcDateOnly(end),
  };
}

function formatUtcDateOnly(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPayoutRange(start, end) {
  const startDate = new Date(`${start}T00:00:00+08:00`);
  const endDate = new Date(`${end}T00:00:00+08:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return `${start} to ${end}`;
  }

  const startLabel = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
  }).format(startDate);

  const endLabel = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(endDate);

  return `${startLabel} – ${endLabel}`;
}

function normalizePayoutStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();

  if (normalized === "PAID") return "PAID";
  if (normalized === "PARTIALLY_PAID") return "PARTIALLY_PAID";
  if (normalized === "NO_EARNINGS") return "NO_EARNINGS";
  return "UNPAID";
}

function formatPayoutStatus(status) {
  const normalized = normalizePayoutStatus(status);

  if (normalized === "PAID") return "Paid";
  if (normalized === "PARTIALLY_PAID") return "Partially Paid";
  if (normalized === "NO_EARNINGS") return "No Earnings";
  return "Unpaid";
}

function payoutStatusBadgeStyle(status) {
  const normalized = normalizePayoutStatus(status);

  const variants = {
    PAID: {
      border: "#D3ECDD",
      background: "#E7F6ED",
      color: "#167545",
    },
    PARTIALLY_PAID: {
      border: "#F1DBA8",
      background: "#FFF7E1",
      color: "#896300",
    },
    NO_EARNINGS: {
      border: "var(--earn-border)",
      background: "var(--earn-soft)",
      color: "var(--earn-muted)",
    },
    UNPAID: {
      border: "#F2C7CF",
      background: "#FFF0F2",
      color: "#B42335",
    },
  };

  const variant = variants[normalized] || variants.UNPAID;

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: normalized === "PARTIALLY_PAID" ? 104 : 82,
    height: 27,
    padding: "0 9px",
    borderRadius: 7,
    border: `1px solid ${variant.border}`,
    background: variant.background,
    color: variant.color,
    fontSize: adminScaledFontSize(10.8),
    fontWeight: 850,
    whiteSpace: "nowrap",
  };
}

function payoutPeriodButtonStyle(active) {
  return {
    height: 38,
    borderRadius: 8,
    border: `1px solid ${active ? BRAND.pink : "var(--earn-border-strong)"}`,
    background: active ? BRAND.pink : "var(--earn-card)",
    color: active ? "#FFFFFF" : "var(--earn-text)",
    padding: "0 14px",
    fontSize: adminScaledFontSize(12.5),
    fontWeight: 850,
    cursor: "pointer",
  };
}

function payoutViewButtonStyle() {
  return {
    minWidth: 104,
    height: 34,
    borderRadius: 8,
    border: "1px solid var(--earn-border-strong)",
    background: "var(--earn-card)",
    color: "var(--earn-strong)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "0 10px",
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 850,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function payoutActionButtonStyle({ disabled = false, isPaid = false }) {
  return {
    minWidth: 112,
    height: 34,
    borderRadius: 8,
    border: `1px solid ${
      isPaid ? "#E8B7C1" : disabled ? "var(--earn-border)" : "#B9DFC7"
    }`,
    background: isPaid ? "#FFF4F6" : disabled ? "var(--earn-soft)" : "#EDF9F1",
    color: isPaid ? "#B42335" : disabled ? "var(--earn-muted)" : "#167545",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "0 11px",
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 850,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.58 : 1,
    whiteSpace: "nowrap",
  };
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

  changePasswordLoginArea: {
    width: "min(560px, 100%)",
    marginTop: 18,
    paddingTop: 16,
    borderTop: "1px solid",
  },

  changePasswordLinkButton: {
    width: "100%",
    minHeight: 40,
    border: 0,
    background: "transparent",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "7px 10px",
    fontSize: adminScaledFontSize(12.5),
    fontWeight: 900,
    cursor: "pointer",
  },

  changePasswordInlinePanel: {
    border: "1px solid",
    borderRadius: 12,
    padding: 16,
  },

  changePasswordInlineHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 14,
  },

  changePasswordInlineTitle: {
    margin: 0,
    fontSize: adminScaledFontSize(15),
    fontWeight: 900,
  },

  changePasswordInlineSubtitle: {
    margin: "4px 0 0",
    fontSize: adminScaledFontSize(11.5),
    lineHeight: 1.45,
  },

  inlineCloseButton: {
    width: 32,
    height: 32,
    border: "1px solid",
    borderRadius: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },

  inlinePasswordFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 4,
  },

  inlinePasswordActions: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginLeft: "auto",
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

  successBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    marginBottom: 18,
    borderRadius: 10,
    border: "1px solid #BFE6CC",
    background: "#ECF9F0",
    color: "#167545",
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

  payoutCard: {
    width: "100%",
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 16,
    border: "1px solid",
    overflow: "hidden",
  },

  payoutHeader: {
    padding: "20px 22px",
    borderBottom: "1px solid var(--earn-border)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
  },

  payoutTitle: {
    margin: 0,
    fontSize: adminScaledFontSize(21),
    fontWeight: 900,
  },

  payoutSubtitle: {
    margin: "6px 0 0",
    maxWidth: 760,
    fontSize: adminScaledFontSize(12.5),
    lineHeight: 1.5,
  },

  payoutPeriodButtons: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    flexWrap: "wrap",
  },

  payoutCustomRangePanel: {
    padding: "15px 22px",
    borderBottom: "1px solid",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
  },

  payoutCustomRangeFields: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },

  payoutCustomDateLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    fontSize: adminScaledFontSize(12),
    fontWeight: 850,
  },

  payoutCustomDateInput: {
    width: 180,
    height: 42,
    border: "1px solid",
    borderRadius: 8,
    padding: "0 10px",
    fontSize: adminScaledFontSize(12.5),
    fontWeight: 700,
  },

  payoutCustomRangeHelp: {
    maxWidth: 560,
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontSize: adminScaledFontSize(11.8),
    lineHeight: 1.5,
  },

  payoutToolbar: {
    padding: "16px 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    borderBottom: "1px solid var(--earn-border)",
  },

  payoutSearchBox: {
    width: 330,
    maxWidth: "100%",
    height: 44,
    border: "1px solid",
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
  },

  payoutPeriodSummary: {
    minHeight: 40,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: adminScaledFontSize(12),
    fontWeight: 700,
  },

  payoutMessage: {
    margin: "14px 22px 0",
    padding: "11px 13px",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontSize: adminScaledFontSize(12.5),
    fontWeight: 700,
  },

  payoutSuccessMessage: {
    border: "1px solid #BFE6CC",
    background: "#ECF9F0",
    color: "#167545",
  },

  payoutErrorMessage: {
    border: "1px solid #F1BFC5",
    background: "#FFF0F2",
    color: "#B42335",
  },

  payoutTable: {
    width: "100%",
    minWidth: 1380,
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },

  payoutSitterMeta: {
    marginTop: 4,
    color: "var(--earn-muted)",
    fontSize: adminScaledFontSize(10.8),
    fontWeight: 650,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  payoutModalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1200,
    background: "rgba(35, 20, 16, 0.50)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    backdropFilter: "blur(2px)",
  },

  payoutDetailModal: {
    width: "min(1120px, 100%)",
    maxHeight: "calc(100vh - 44px)",
    borderRadius: 18,
    border: "1px solid",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },

  payoutDetailModalHeader: {
    padding: "20px 22px 17px",
    borderBottom: "1px solid",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexShrink: 0,
  },

  payoutModalEyebrow: {
    margin: "0 0 5px",
    color: BRAND.pink,
    fontSize: adminScaledFontSize(11),
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  payoutDetailModalTitle: {
    margin: 0,
    fontSize: adminScaledFontSize(23),
    fontWeight: 900,
  },

  payoutDetailModalSubtitle: {
    margin: "6px 0 0",
    fontSize: adminScaledFontSize(12.5),
    lineHeight: 1.5,
  },

  payoutDetailBody: {
    padding: 22,
    overflowY: "auto",
    minHeight: 0,
  },

  payoutDetailSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 12,
  },

  payoutSummaryBox: {
    minHeight: 86,
    border: "1px solid",
    borderRadius: 11,
    padding: "13px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 7,
  },

  payoutSummaryLabel: {
    fontSize: adminScaledFontSize(10.8),
    fontWeight: 800,
  },

  payoutSummaryValue: {
    fontSize: adminScaledFontSize(15),
    lineHeight: 1.35,
  },

  payoutDetailSectionHeader: {
    marginTop: 22,
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 18,
    flexWrap: "wrap",
  },

  payoutDetailSectionTitle: {
    margin: 0,
    fontSize: adminScaledFontSize(17),
    fontWeight: 900,
  },

  payoutDetailSectionSubtitle: {
    margin: "5px 0 0",
    maxWidth: 720,
    fontSize: adminScaledFontSize(11.8),
    lineHeight: 1.5,
  },

  payoutDetailPaidOn: {
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 750,
  },

  payoutDetailTableShell: {
    border: "1px solid",
    borderRadius: 11,
    overflow: "hidden",
  },

  payoutDetailTable: {
    width: "100%",
    minWidth: 900,
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },

  payoutDetailFooter: {
    padding: "14px 22px",
    borderTop: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    flexShrink: 0,
  },

  payoutDetailFooterNote: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 700,
  },

  payoutDetailFooterActions: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginLeft: "auto",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 180,
    background: "rgba(35, 20, 16, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  passwordModal: {
    width: "min(560px, 100%)",
    borderRadius: 18,
    border: "1px solid",
    overflow: "hidden",
  },

  modalHeader: {
    padding: "20px 22px 16px",
    borderBottom: "1px solid",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },

  modalTitle: {
    margin: 0,
    fontSize: adminScaledFontSize(22),
    fontWeight: 900,
  },

  modalSubtitle: {
    margin: "7px 0 0",
    fontSize: adminScaledFontSize(12.5),
    lineHeight: 1.5,
  },

  modalCloseButton: {
    width: 36,
    height: 36,
    border: "1px solid",
    borderRadius: 9,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },

  modalBody: {
    padding: "20px 22px 8px",
  },

  showPasswordRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    margin: "0 0 10px",
    fontSize: adminScaledFontSize(12),
    fontWeight: 700,
    cursor: "pointer",
  },

  modalFooter: {
    padding: "14px 22px 18px",
    borderTop: "1px solid",
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  modalSecondaryButton: {
    height: 40,
    border: "1px solid",
    borderRadius: 9,
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: adminScaledFontSize(13),
    fontWeight: 800,
    cursor: "pointer",
  },

  modalPrimaryButton: {
    height: 40,
    border: `1px solid ${BRAND.pink}`,
    borderRadius: 9,
    background: BRAND.pink,
    color: "#FFFFFF",
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: adminScaledFontSize(13),
    fontWeight: 900,
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
    minWidth: 1470,
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
