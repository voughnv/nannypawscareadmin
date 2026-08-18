import { useEffect, useMemo, useState } from "react";
import {
  MessagesSquare,
  Search,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  UserRound,
  Clock3,
  MessageSquareText,
  X,
  AlertCircle,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { useAdminSettings } from "./context/AdminSettingsContext";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  softPink: "#FDEBED",
  border: "#EEE2E0",
  text: "#2E1B16",
  muted: "#6F625F",
};

const ROWS_PER_PAGE = 8;
const MESSAGE_FIELDS =
  "message_id, created_at, message_content, message_date, message_time, sender_role, receiver_role";

const MESSAGE_INTERACTION_CSS = `
  .messages-page button:not(:disabled) {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease,
      background-color 160ms ease,
      color 160ms ease,
      filter 160ms ease;
  }

  .messages-page button:not(:disabled):hover {
    transform: translateY(-1px);
    filter: brightness(1.015);
  }

  .messages-page button:not(:disabled):active {
    transform: translateY(0) scale(0.98);
  }

  .messages-page button:focus-visible,
  .messages-page input:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.42);
    outline-offset: 2px;
  }

  .messages-page .message-stat-card:not(:disabled):hover {
    transform: translateY(-4px);
    border-color: rgba(217, 67, 104, 0.55) !important;
    box-shadow:
      0 13px 26px rgba(58, 30, 20, 0.11),
      0 0 0 2px rgba(217, 67, 104, 0.06) !important;
  }

  .messages-page .message-stat-card.is-active {
    border-color: #D94368 !important;
    box-shadow:
      0 8px 18px rgba(217, 67, 104, 0.13),
      0 0 0 2px rgba(217, 67, 104, 0.08) !important;
  }

  .messages-page .message-stat-icon {
    transition: transform 170ms ease;
  }

  .messages-page .message-stat-card:not(:disabled):hover .message-stat-icon {
    transform: scale(1.06);
  }

  .messages-page .message-search-shell {
    transition:
      transform 170ms ease,
      border-color 170ms ease,
      box-shadow 170ms ease,
      background-color 170ms ease;
  }

  .messages-page .message-search-shell:hover {
    border-color: rgba(217, 67, 104, 0.42) !important;
  }

  .messages-page .message-search-shell:focus-within {
    transform: translateY(-1px);
    border-color: #D94368 !important;
    box-shadow:
      0 0 0 3px rgba(217, 67, 104, 0.10),
      0 7px 16px rgba(58, 30, 20, 0.06);
  }

  .messages-page .message-search-shell.has-value {
    border-color: rgba(217, 67, 104, 0.54) !important;
    box-shadow: inset 0 0 0 1px rgba(217, 67, 104, 0.09);
  }

  .messages-page .message-date-input {
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease;
  }

  .messages-page .message-date-input:hover {
    border-color: rgba(217, 67, 104, 0.42) !important;
  }

  .messages-page .message-date-input:focus {
    outline: none;
    transform: translateY(-1px);
    border-color: #D94368 !important;
    box-shadow: 0 0 0 3px rgba(217, 67, 104, 0.10);
  }

  .messages-page .message-clickable-row td {
    transition:
      background-color 150ms ease,
      box-shadow 150ms ease,
      color 150ms ease;
  }

  .messages-page .message-clickable-row:hover td {
    background: var(--msg-hover);
  }

  .messages-page .message-clickable-row:hover td:first-child {
    box-shadow: inset 3px 0 0 #D94368;
  }

  .messages-page .message-clickable-row:active td {
    background: var(--msg-hover-strong);
  }

  .messages-page .message-clickable-row:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.42);
    outline-offset: -2px;
  }

  .messages-page .message-close-button:not(:disabled):hover {
    color: #D94368 !important;
    border-color: rgba(217, 67, 104, 0.50) !important;
    background: var(--msg-hover) !important;
  }

  .messages-page .message-page-button:not(:disabled):hover {
    border-color: rgba(217, 67, 104, 0.55) !important;
    box-shadow: 0 4px 10px rgba(58, 30, 20, 0.08);
  }

  @media (prefers-reduced-motion: reduce) {
    .messages-page *,
    .messages-page *::before,
    .messages-page *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default function MessagesPage() {
  const { settings, fontScale } = useAdminSettings();
  const darkMode = Boolean(settings?.darkMode);

  const pageThemeStyle = useMemo(
    () => ({
      "--msg-page": darkMode ? "#171311" : "#FFF9F8",
      "--msg-card": darkMode ? "#241D1A" : "#FFFFFF",
      "--msg-card-soft": darkMode ? "#2B2320" : "#FFFCFB",
      "--msg-head": darkMode ? "#2B2320" : "#FFFBFA",
      "--msg-input": darkMode ? "#2B2320" : "#FFFFFF",
      "--msg-text": darkMode ? "#FFF7F4" : "#1F1714",
      "--msg-strong": darkMode ? "#FFF7F4" : BRAND.brown,
      "--msg-muted": darkMode ? "#CFC2BE" : "#6D5F5B",
      "--msg-border": darkMode ? "#443934" : "#EEE2DF",
      "--msg-border-strong": darkMode ? "#5A4B45" : "#E2D5D3",
      "--msg-hover": darkMode ? "#34282C" : "#FFF7F9",
      "--msg-hover-strong": darkMode ? "#412E35" : "#FDEBED",
      "--msg-shadow": darkMode
        ? "0 8px 18px rgba(0,0,0,0.24)"
        : "0 8px 18px rgba(51,26,18,0.07)",
      width: "100%",
      minHeight: "100%",
      zoom: Number(fontScale || 1),
      background: "var(--msg-page)",
      color: "var(--msg-text)",
      transition: "background 0.2s ease, color 0.2s ease",
    }),
    [darkMode, fontScale]
  );

  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [cardFilter, setCardFilter] = useState("all");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-message-monitor")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "MESSAGES",
        },
        () => {
          fetchMessages(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, cardFilter, dateFrom, dateTo]);

  async function fetchMessages(showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }

    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("MESSAGES")
        .select(MESSAGE_FIELDS)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const nextMessages = data || [];
      setMessages(nextMessages);

      setSelectedMessage((previous) =>
        previous
          ? nextMessages.find(
              (item) => item.message_id === previous.message_id
            ) || null
          : null
      );
    } catch (fetchError) {
      console.error("Unable to load messages:", fetchError);

      setError(
        fetchError?.message ||
          "Unable to load message records. Check the MESSAGES table and its RLS policies."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  function applyCardFilter(nextFilter) {
    setCardFilter(nextFilter);
    setCurrentPage(1);
  }

  function clearFilters() {
    setSearch("");
    setCardFilter("all");
    setDateFrom("");
    setDateTo("");
    setShowDateFilter(false);
    setCurrentPage(1);
  }

  const today = getPhilippineDateOnly();

  const stats = useMemo(() => {
    const ownerToSitter = messages.filter(
      (message) =>
        isOwnerRole(message.sender_role) &&
        isSitterRole(message.receiver_role)
    ).length;

    const sitterToOwner = messages.filter(
      (message) =>
        isSitterRole(message.sender_role) &&
        isOwnerRole(message.receiver_role)
    ).length;

    const todayCount = messages.filter(
      (message) => getMessageDate(message) === today
    ).length;

    return {
      total: messages.length,
      ownerToSitter,
      sitterToOwner,
      today: todayCount,
    };
  }, [messages, today]);

  const filteredMessages = useMemo(() => {
    const keyword = search.trim().replace(/\s+/g, " ").toLowerCase();

    return messages.filter((message) => {
      const searchableValues = [
        message.message_id,
        formatMessageId(message.message_id),
        message.message_content,
        formatRole(message.sender_role),
        formatRole(message.receiver_role),
        message.sender_role,
        message.receiver_role,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            value !== ""
        )
        .map((value) => String(value).toLowerCase());

      const matchesSearch =
        !keyword ||
        searchableValues.some((value) => value.includes(keyword));

      const matchesCard =
        cardFilter === "all" ||
        (cardFilter === "owner-to-sitter" &&
          isOwnerRole(message.sender_role) &&
          isSitterRole(message.receiver_role)) ||
        (cardFilter === "sitter-to-owner" &&
          isSitterRole(message.sender_role) &&
          isOwnerRole(message.receiver_role)) ||
        (cardFilter === "today" &&
          getMessageDate(message) === today);

      const messageDate = getMessageDate(message);

      const matchesDateFrom =
        !dateFrom || (messageDate && messageDate >= dateFrom);

      const matchesDateTo =
        !dateTo || (messageDate && messageDate <= dateTo);

      return (
        matchesSearch &&
        matchesCard &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [messages, search, cardFilter, dateFrom, dateTo, today]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMessages.length / ROWS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;

    return filteredMessages.slice(
      start,
      start + ROWS_PER_PAGE
    );
  }, [filteredMessages, currentPage]);

  const firstVisible =
    filteredMessages.length > 0
      ? (currentPage - 1) * ROWS_PER_PAGE + 1
      : 0;

  const lastVisible = Math.min(
    currentPage * ROWS_PER_PAGE,
    filteredMessages.length
  );

  return (
    <div className="messages-page" style={pageThemeStyle}>
      <style>{MESSAGE_INTERACTION_CSS}</style>

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

      <section style={styles.statsGrid}>
        <StatCard
          icon={<MessagesSquare size={30} />}
          iconStyle={styles.statPink}
          title="Total Messages"
          value={stats.total}
          desc="All message records"
          active={cardFilter === "all"}
          onClick={() => applyCardFilter("all")}
        />

        <StatCard
          icon={<ArrowRight size={30} />}
          iconStyle={styles.statOrange}
          title="Owner to Sitter"
          value={stats.ownerToSitter}
          desc="Messages sent by pet owners"
          active={cardFilter === "owner-to-sitter"}
          onClick={() => applyCardFilter("owner-to-sitter")}
        />

        <StatCard
          icon={<ArrowRight size={30} />}
          iconStyle={styles.statGreen}
          title="Sitter to Owner"
          value={stats.sitterToOwner}
          desc="Messages sent by pet sitters"
          active={cardFilter === "sitter-to-owner"}
          onClick={() => applyCardFilter("sitter-to-owner")}
        />

        <StatCard
          icon={<Clock3 size={30} />}
          iconStyle={styles.statBlue}
          title="Today"
          value={stats.today}
          desc="Messages sent today"
          active={cardFilter === "today"}
          onClick={() => applyCardFilter("today")}
        />
      </section>

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={20} />
          <span style={styles.errorText}>{error}</span>

          <button
            type="button"
            className="message-close-button"
            style={styles.errorClose}
            onClick={() => setError("")}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <section style={styles.tableCard}>
        <div style={styles.filters}>
          <div style={styles.leftFilters}>
            <div
              className={`message-search-shell${
                search.trim() ? " has-value" : ""
              }`}
              style={styles.searchBox}
            >
              <Search size={21} color={darkMode ? "#CFC2BE" : "#5E4B45"} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search message ID, content, or role"
                style={styles.searchInput}
              />
            </div>

            <button
              type="button"
              style={styles.dateBtn}
              onClick={() =>
                setShowDateFilter((previous) => !previous)
              }
            >
              <Calendar size={19} />
              <span>
                {showDateFilter
                  ? "Hide date range"
                  : "Select date range"}
              </span>
            </button>
          </div>

          <div style={styles.filterActions}>
            <button
              type="button"
              style={styles.refreshBtn}
              onClick={() => fetchMessages()}
              disabled={loading}
              title="Refresh messages"
            >
              <RefreshCw size={18} />
              <span>{loading ? "Loading..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {showDateFilter && (
          <div style={styles.datePanel}>
            <label style={styles.dateLabel}>
              From
              <input
                className="message-date-input"
                type="date"
                value={dateFrom}
                max={dateTo || "9999-12-31"}
                onChange={(event) => {
                  const nextFrom = event.target.value;
                  setDateFrom(nextFrom);

                  if (dateTo && nextFrom && nextFrom > dateTo) {
                    setDateTo(nextFrom);
                  }
                }}
                style={styles.dateInput}
              />
            </label>

            <label style={styles.dateLabel}>
              To
              <input
                className="message-date-input"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
                style={styles.dateInput}
              />
            </label>

            <button
              type="button"
              style={styles.clearBtn}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <colgroup>
              <col style={{ width: "6%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "32%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "13%" }} />
            </colgroup>

            <thead>
              <tr style={styles.tableHeadRow}>
                <Th>No.</Th>
                <Th>Sender</Th>
                <Th>Receiver</Th>
                <Th>Message</Th>
                <Th>Message Date</Th>
                <Th>Time</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={styles.emptyCell}>
                    <div style={styles.loadingContent}>
                      <RefreshCw size={21} />
                      <span>Loading messages...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedMessages.length > 0 ? (
                paginatedMessages.map((message, index) => (
                  <tr
                    key={message.message_id}
                    className="message-clickable-row"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${formatMessageId(
                      message.message_id
                    )}`}
                    style={{ ...styles.tableRow, cursor: "pointer" }}
                    onClick={() => setSelectedMessage(message)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;

                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        setSelectedMessage(message);
                      }
                    }}
                  >
                    <td style={styles.numberCell}>
                      {(currentPage - 1) * ROWS_PER_PAGE + index + 1}
                    </td>

                    <td style={styles.normalCell}>
                      <RoleBadge role={message.sender_role} />
                    </td>

                    <td style={styles.normalCell}>
                      <RoleBadge role={message.receiver_role} />
                    </td>

                    <td style={styles.messageCell}>
                      <strong style={styles.messageText}>
                        {message.message_content ||
                          "No message content."}
                      </strong>

                      <span style={styles.secondaryText}>
                        {formatMessageId(message.message_id)}
                      </span>
                    </td>

                    <td style={styles.normalCell}>
                      {formatDate(getMessageDate(message))}
                    </td>

                    <td style={styles.normalCell}>
                      {formatMessageTime(message)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={styles.emptyCell}>
                    No messages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.pagination}>
          <p style={styles.pageText}>
            Showing {firstVisible} to {lastVisible} of{" "}
            {filteredMessages.length} messages
          </p>

          <div style={styles.pages}>
            <button
              type="button"
              className="message-page-button"
              style={{
                ...styles.pageBtn,
                ...(currentPage === 1 ? styles.disabledBtn : {}),
              }}
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) => Math.max(page - 1, 1))
              }
            >
              <ChevronLeft size={17} />
            </button>

            {getVisiblePages(currentPage, totalPages).map((page) =>
              typeof page === "string" ? (
                <span key={page} style={styles.ellipsis}>
                  …
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  className="message-page-button"
                  onClick={() => setCurrentPage(page)}
                  style={
                    currentPage === page
                      ? {
                          ...styles.pageBtn,
                          ...styles.activePage,
                        }
                      : styles.pageBtn
                  }
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              className="message-page-button"
              style={{
                ...styles.pageBtn,
                ...(currentPage === totalPages
                  ? styles.disabledBtn
                  : {}),
              }}
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(page + 1, totalPages)
                )
              }
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {selectedMessage && (
        <MessageDetailsModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  iconStyle,
  title,
  value,
  desc,
  active = false,
  onClick,
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`message-stat-card${
        active ? " is-active" : ""
      }`}
      style={styles.statCard}
      onClick={onClick}
    >
      <div
        className="message-stat-icon"
        style={{
          ...styles.statIcon,
          ...iconStyle,
        }}
      >
        {icon}
      </div>

      <div>
        <p style={styles.statTitle}>{title}</p>
        <h2 style={styles.statValue}>{value}</h2>
        <p style={styles.statDesc}>{desc}</p>
      </div>
    </button>
  );
}

function Th({ children }) {
  return <th style={styles.th}>{children}</th>;
}

function RoleBadge({ role }) {
  const normalized = normalizeRole(role);

  const roleStyle = isOwnerRole(role)
    ? styles.ownerBadge
    : isSitterRole(role)
    ? styles.sitterBadge
    : styles.otherRoleBadge;

  return (
    <span style={{ ...styles.roleBadge, ...roleStyle }}>
      {normalized}
    </span>
  );
}

function MessageDetailsModal({ message, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-details-title"
        style={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <div>
            <h2 id="message-details-title" style={styles.modalTitle}>
              Message Details
            </h2>

            <p style={styles.modalReference}>
              {formatMessageId(message.message_id)}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close message details"
            className="message-close-button"
            style={styles.modalCloseBtn}
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.directionCard}>
            <div style={styles.rolePerson}>
              <div style={styles.avatar}>
                <UserRound size={22} />
              </div>

              <div>
                <p style={styles.detailLabel}>Sender</p>
                <RoleBadge role={message.sender_role} />
              </div>
            </div>

            <ArrowRight size={24} color={BRAND.pink} />

            <div style={styles.rolePerson}>
              <div style={styles.avatar}>
                <UserRound size={22} />
              </div>

              <div>
                <p style={styles.detailLabel}>Receiver</p>
                <RoleBadge role={message.receiver_role} />
              </div>
            </div>
          </div>

          <div style={styles.messageDetailCard}>
            <div style={styles.detailTitleRow}>
              <MessageSquareText size={18} color={BRAND.pink} />
              <p style={styles.detailLabel}>Message Content</p>
            </div>

            <p style={styles.fullMessage}>
              {message.message_content || "No message content."}
            </p>
          </div>

          <div style={styles.modalInfoGrid}>
            <DetailItem
              label="Message ID"
              value={formatMessageId(message.message_id)}
            />

            <DetailItem
              label="Message Date"
              value={formatDate(getMessageDate(message))}
            />

            <DetailItem
              label="Message Time"
              value={formatMessageTime(message)}
            />

            <DetailItem
              label="Date Created"
              value={formatDateTime(message.created_at)}
            />
          </div>

          <div style={styles.futureNote}>
            <strong>Conversation participant linking is not available yet.</strong>
            <span>
              The current MESSAGES table stores sender_role and receiver_role,
              but it does not yet identify the specific Pet Owner, Pet Sitter,
              booking, or conversation.
            </span>
          </div>
        </div>

        <div style={styles.modalActions}>
          <button
            type="button"
            style={styles.closeModalBtn}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div style={styles.detailItem}>
      <p style={styles.detailLabel}>{label}</p>
      <h4 style={styles.detailValue}>{value}</h4>
    </div>
  );
}

function normalizeRole(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

  if (!text) return "Not set";

  if (
    text === "owner" ||
    text === "pet owner" ||
    text === "petowner"
  ) {
    return "Pet Owner";
  }

  if (
    text === "sitter" ||
    text === "pet sitter" ||
    text === "petsitter"
  ) {
    return "Pet Sitter";
  }

  if (text === "admin" || text === "administrator") {
    return "Administrator";
  }

  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isOwnerRole(value) {
  return normalizeRole(value) === "Pet Owner";
}

function isSitterRole(value) {
  return normalizeRole(value) === "Pet Sitter";
}

function formatMessageId(id) {
  if (id === null || id === undefined || id === "") {
    return "N/A";
  }

  return `MSG-${String(id).padStart(4, "0")}`;
}

function getMessageDate(message) {
  const directDate = String(message?.message_date || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(directDate)) {
    return directDate;
  }

  return getDateOnlyValue(message?.created_at);
}

function formatMessageTime(message) {
  if (message?.message_time) {
    return formatTime(message.message_time);
  }

  if (!message?.created_at) {
    return "Not set";
  }

  const date = new Date(message.created_at);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatTime(value) {
  if (!value) return "Not set";

  const text = String(value).trim().slice(0, 5);
  const match = text.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return text;

  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
}

function getDateOnlyValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : "";
}

function getPhilippineDateOnly() {
  return getDateOnlyValue(new Date());
}

function formatDate(value) {
  if (!value) return "Not set";

  const text = String(value).trim();

  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00`)
    : new Date(text);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

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

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
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
    color: "var(--msg-strong)",
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "var(--msg-muted)",
    fontSize: 15,
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    color: "var(--msg-strong)",
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  chevron: {
    color: "var(--msg-muted)",
    fontSize: 22,
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
    background: "var(--msg-card)",
    borderRadius: 16,
    border: "1px solid var(--msg-border)",
    boxShadow: "var(--msg-shadow)",
    padding: 18,
    display: "flex",
    alignItems: "center",
    gap: 16,
    minWidth: 0,
    boxSizing: "border-box",
    textAlign: "left",
    fontFamily: "inherit",
    cursor: "pointer",
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

  statOrange: {
    background: "#FCEBDD",
    color: "#F16C08",
  },

  statGreen: {
    background: "#DDF3E7",
    color: "#0D9B4A",
  },

  statBlue: {
    background: "#E4ECFF",
    color: "#236EEA",
  },

  statTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    color: "var(--msg-text)",
  },

  statValue: {
    margin: "4px 0 2px",
    fontSize: 28,
    fontWeight: 900,
    color: "var(--msg-strong)",
  },

  statDesc: {
    margin: 0,
    fontSize: 12,
    color: "var(--msg-muted)",
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
  },

  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: 700,
  },

  errorClose: {
    border: "none",
    background: "transparent",
    color: "#B42335",
    cursor: "pointer",
    display: "flex",
    padding: 0,
  },

  tableCard: {
    width: "100%",
    background: "var(--msg-card)",
    borderRadius: 16,
    border: "1px solid var(--msg-border)",
    boxShadow: "var(--msg-shadow)",
    padding: "22px 14px 16px",
    boxSizing: "border-box",
  },

  filters: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: "0 12px 22px",
    flexWrap: "wrap",
  },

  leftFilters: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flex: 1,
    minWidth: 430,
  },

  filterActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    marginLeft: "auto",
  },

  searchBox: {
    flex: 1,
    maxWidth: 500,
    minWidth: 280,
    height: 48,
    border: "1px solid var(--msg-border-strong)",
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    background: "var(--msg-card)",
    boxSizing: "border-box",
  },

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    marginLeft: 12,
    fontSize: 14,
    color: "var(--msg-text)",
    background: "transparent",
    minWidth: 0,
  },

  dateBtn: {
    height: 48,
    border: "1px solid var(--msg-border-strong)",
    borderRadius: 7,
    background: "var(--msg-card)",
    color: "var(--msg-muted)",
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "0 15px",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  refreshBtn: {
    height: 48,
    border: "1px solid var(--msg-border-strong)",
    borderRadius: 7,
    background: "var(--msg-card)",
    color: "var(--msg-strong)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "0 14px",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  datePanel: {
    margin: "0 12px 18px",
    padding: 14,
    border: "1px solid var(--msg-border)",
    borderRadius: 10,
    background: "var(--msg-head)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  dateLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
    color: "var(--msg-strong)",
  },

  dateInput: {
    height: 38,
    border: "1px solid var(--msg-border-strong)",
    borderRadius: 7,
    padding: "0 10px",
    color: "var(--msg-text)",
    background: "var(--msg-input)",
  },

  clearBtn: {
    height: 38,
    border: "1px solid var(--msg-border-strong)",
    borderRadius: 7,
    background: "var(--msg-card)",
    color: "var(--msg-strong)",
    padding: "0 14px",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: 1120,
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },

  tableHeadRow: {
    background: "var(--msg-head)",
    borderTop: "1px solid var(--msg-border)",
    borderBottom: "1px solid var(--msg-border)",
  },

  th: {
    textAlign: "left",
    padding: "13px 11px",
    color: "var(--msg-text)",
    fontSize: 12.5,
    fontWeight: 900,
    lineHeight: 1.3,
  },

  tableRow: {
    borderBottom: "1px solid var(--msg-border)",
  },

  numberCell: {
    padding: "14px 11px",
    color: "var(--msg-muted)",
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
    verticalAlign: "middle",
  },

  normalCell: {
    padding: "14px 11px",
    color: "var(--msg-text)",
    fontSize: 12.5,
    verticalAlign: "middle",
    overflowWrap: "anywhere",
  },

  messageCell: {
    padding: "14px 11px",
    color: "var(--msg-text)",
    fontSize: 12.5,
    verticalAlign: "middle",
    minWidth: 0,
  },

  messageText: {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    color: "var(--msg-text)",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.45,
    overflowWrap: "anywhere",
  },

  secondaryText: {
    display: "block",
    marginTop: 5,
    color: "var(--msg-muted)",
    fontSize: 10.5,
    fontWeight: 700,
  },

  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 27,
    borderRadius: 8,
    padding: "0 9px",
    fontSize: 11.5,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  ownerBadge: {
    background: "#FDEBED",
    color: "#C7355A",
  },

  sitterBadge: {
    background: "#DDF3E7",
    color: "#0D8B48",
  },

  otherRoleBadge: {
    background: "#EEE9E7",
    color: "#655955",
  },

  emptyCell: {
    padding: 30,
    textAlign: "center",
    color: "var(--msg-muted)",
    fontSize: 14,
    fontWeight: 700,
  },

  loadingContent: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
  },

  pagination: {
    padding: "14px 12px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },

  pageText: {
    margin: 0,
    fontSize: 13,
    color: "var(--msg-text)",
  },

  pages: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  pageBtn: {
    width: 34,
    height: 34,
    borderRadius: 7,
    border: "1px solid var(--msg-border-strong)",
    background: "var(--msg-card)",
    color: "var(--msg-text)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  activePage: {
    background: BRAND.pink,
    color: "#FFFFFF",
    borderColor: BRAND.pink,
  },

  disabledBtn: {
    opacity: 0.45,
    cursor: "not-allowed",
  },

  ellipsis: {
    width: 24,
    textAlign: "center",
    color: "var(--msg-muted)",
    fontWeight: 800,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 300,
    padding: 20,
    background: "rgba(35, 20, 16, 0.42)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },

  modal: {
    width: "min(760px, 100%)",
    maxHeight: "90vh",
    background: "var(--msg-card)",
    borderRadius: 18,
    border: "1px solid var(--msg-border)",
    boxShadow: "0 22px 50px rgba(51,26,18,0.24)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    padding: "22px 22px 16px",
    borderBottom: "1px solid var(--msg-border)",
    flexShrink: 0,
  },

  modalTitle: {
    margin: 0,
    color: "var(--msg-strong)",
    fontSize: 24,
    fontWeight: 900,
  },

  modalReference: {
    margin: "5px 0 0",
    color: "var(--msg-muted)",
    fontSize: 12,
    fontWeight: 800,
  },

  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    border: "1px solid var(--msg-border-strong)",
    background: "var(--msg-card)",
    color: "var(--msg-strong)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modalBody: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "18px 22px 22px",
  },

  directionCard: {
    border: "1px solid var(--msg-border)",
    borderRadius: 12,
    padding: 16,
    background: "var(--msg-card-soft)",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },

  rolePerson: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 42,
    height: 42,
    minWidth: 42,
    borderRadius: "50%",
    background: BRAND.softPink,
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  detailTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
  },

  detailLabel: {
    margin: 0,
    color: "var(--msg-muted)",
    fontSize: 12,
    fontWeight: 900,
  },

  messageDetailCard: {
    border: "1px solid var(--msg-border)",
    borderRadius: 12,
    padding: 16,
    background: "var(--msg-card-soft)",
    marginBottom: 12,
  },

  fullMessage: {
    margin: 0,
    color: "var(--msg-text)",
    fontSize: 14,
    lineHeight: 1.65,
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },

  modalInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  detailItem: {
    border: "1px solid var(--msg-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--msg-card-soft)",
  },

  detailValue: {
    margin: "7px 0 0",
    color: "var(--msg-text)",
    fontSize: 14,
    fontWeight: 900,
    overflowWrap: "anywhere",
  },

  futureNote: {
    marginTop: 12,
    border: "1px solid #F0D6A9",
    borderRadius: 12,
    padding: 14,
    background: "#FFF8E9",
    color: "#8A5712",
    display: "flex",
    flexDirection: "column",
    gap: 5,
    fontSize: 12,
    lineHeight: 1.5,
  },

  modalActions: {
    padding: "14px 22px",
    borderTop: "1px solid var(--msg-border)",
    display: "flex",
    justifyContent: "flex-end",
    background: "var(--msg-card)",
  },

  closeModalBtn: {
    height: 40,
    border: "none",
    borderRadius: 9,
    background: BRAND.pink,
    color: "#FFFFFF",
    padding: "0 18px",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
};
