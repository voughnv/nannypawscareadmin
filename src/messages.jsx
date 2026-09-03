import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  MessagesSquare,
  Search,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  UserRound,
  X,
  AlertCircle,
  MessageCircleMore,
  Image as ImageIcon,
  ZoomIn,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import {
  adminScaledFontSize,
  useAdminSettings,
} from "./context/AdminSettingsContext";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  softPink: "#FDEBED",
  border: "#EEE2E0",
  text: "#2E1B16",
  muted: "#6F625F",
};

const ROWS_PER_PAGE = 6;

const MESSAGE_IMAGE_BUCKET =
  import.meta.env.VITE_MESSAGE_IMAGE_BUCKET ||
  "message-photos";

const MESSAGE_IMAGE_BUCKET_CANDIDATES = [
  MESSAGE_IMAGE_BUCKET,
];

const OWNER_PROFILE_PHOTO_BUCKET =
  import.meta.env.VITE_OWNER_PROFILE_PHOTO_BUCKET ||
  import.meta.env.VITE_PROFILE_PHOTO_BUCKET ||
  "profile-photos";

const SITTER_PROFILE_PHOTO_BUCKET =
  import.meta.env.VITE_SITTER_PROFILE_PHOTO_BUCKET ||
  import.meta.env.VITE_PROFILE_PHOTO_BUCKET ||
  "profile-photos";

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

  .messages-page .conversation-stat-card:not(:disabled):hover {
    transform: translateY(-4px);
    border-color: rgba(217, 67, 104, 0.55) !important;
    box-shadow:
      0 13px 26px rgba(58, 30, 20, 0.11),
      0 0 0 2px rgba(217, 67, 104, 0.06) !important;
  }

  .messages-page .conversation-stat-card.is-active {
    border-color: #D94368 !important;
    box-shadow:
      0 8px 18px rgba(217, 67, 104, 0.13),
      0 0 0 2px rgba(217, 67, 104, 0.08) !important;
  }

  .messages-page .conversation-stat-icon {
    transition: transform 170ms ease;
  }

  .messages-page .conversation-stat-card:not(:disabled):hover .conversation-stat-icon {
    transform: scale(1.06);
  }

  .messages-page .conversation-search-shell {
    transition:
      transform 170ms ease,
      border-color 170ms ease,
      box-shadow 170ms ease,
      background-color 170ms ease;
  }

  .messages-page .conversation-search-shell:hover {
    border-color: rgba(217, 67, 104, 0.42) !important;
  }

  .messages-page .conversation-search-shell:focus-within {
    transform: translateY(-1px);
    border-color: #D94368 !important;
    box-shadow:
      0 0 0 3px rgba(217, 67, 104, 0.10),
      0 7px 16px rgba(58, 30, 20, 0.06);
  }

  .messages-page .conversation-search-shell.has-value {
    border-color: rgba(217, 67, 104, 0.54) !important;
    box-shadow: inset 0 0 0 1px rgba(217, 67, 104, 0.09);
  }

  .messages-page .conversation-date-input {
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease;
  }

  .messages-page .conversation-date-input:hover {
    border-color: rgba(217, 67, 104, 0.42) !important;
  }

  .messages-page .conversation-date-input:focus {
    outline: none;
    transform: translateY(-1px);
    border-color: #D94368 !important;
    box-shadow: 0 0 0 3px rgba(217, 67, 104, 0.10);
  }

  .messages-page .conversation-row td {
    transition:
      background-color 150ms ease,
      box-shadow 150ms ease,
      color 150ms ease;
  }

  .messages-page .conversation-row:hover td {
    background: var(--msg-hover);
  }

  .messages-page .conversation-row:hover td:first-child {
    box-shadow: inset 3px 0 0 #D94368;
  }

  .messages-page .conversation-row:active td {
    background: var(--msg-hover-strong);
  }

  .messages-page .conversation-row:focus-visible {
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

  .messages-page .chat-bubble {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease;
  }

  .messages-page .chat-bubble:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 12px rgba(58, 30, 20, 0.07);
  }

  .messages-page .message-image-button:not(:disabled):hover {
    transform: none;
    filter: none;
    border-color: rgba(217, 67, 104, 0.58) !important;
    box-shadow: 0 7px 16px rgba(58, 30, 20, 0.10);
  }

  .messages-page .message-image-button:not(:disabled):hover img {
    transform: scale(1.015);
  }

  .message-image-preview-close:not(:disabled) {
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      color 160ms ease,
      box-shadow 160ms ease,
      background-color 160ms ease;
  }

  .message-image-preview-close:not(:disabled):hover {
    color: #D94368 !important;
    border-color: rgba(217, 67, 104, 0.55) !important;
    background: #FFF7F9 !important;
    box-shadow: 0 5px 12px rgba(58, 30, 20, 0.08);
    transform: translateY(-1px);
  }

  .message-image-preview-close:not(:disabled):active {
    transform: scale(0.96);
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
  const { settings } = useAdminSettings();
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
      background: "var(--msg-page)",
      color: "var(--msg-text)",
      transition: "background 0.2s ease, color 0.2s ease",
    }),
    [darkMode]
  );

  const [messages, setMessages] = useState([]);
  const [owners, setOwners] = useState([]);
  const [sitters, setSitters] = useState([]);

  const [search, setSearch] = useState("");
  const [cardFilter, setCardFilter] = useState("all");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMessageData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-message-conversation-monitor")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "MESSAGES",
        },
        () => {
          fetchMessageData(false);
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

  async function fetchMessageData(showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }

    setError("");

    try {
      const [messageResult, ownerResult, sitterResult] = await Promise.all([
        supabase
          .from("MESSAGES")
          .select("*")
          .order("created_at", { ascending: true }),

        supabase
          .from("PET_OWNER")
          .select("*"),

        supabase
          .from("PET SITTER")
          .select("*"),
      ]);

      if (messageResult.error) throw messageResult.error;

      if (ownerResult.error) {
        console.warn("Unable to load PET_OWNER records:", ownerResult.error);
      }

      if (sitterResult.error) {
        console.warn("Unable to load PET SITTER records:", sitterResult.error);
      }

      setMessages(messageResult.data || []);
      setOwners(ownerResult.data || []);
      setSitters(sitterResult.data || []);
    } catch (fetchError) {
      console.error("Unable to load messages:", fetchError);

      setError(
        fetchError?.message ||
          "Messages could not be loaded. Please refresh the page and try again."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  const ownerMap = useMemo(
    () =>
      new Map(
        owners.map((owner) => [
          normalizeReferenceKey(owner.po_id),
          owner,
        ])
      ),
    [owners]
  );

  const sitterMap = useMemo(
    () =>
      new Map(
        sitters.map((sitter) => [
          normalizeReferenceKey(sitter.petsitter_id),
          sitter,
        ])
      ),
    [sitters]
  );

  const { conversations, unlinkedCount } = useMemo(() => {
    const grouped = new Map();
    let unlinked = 0;

    messages.forEach((message) => {
      const ownerId = getMessageOwnerId(message);
      const sitterId = getMessageSitterId(message);

      if (!ownerId || !sitterId) {
        unlinked += 1;
        return;
      }

      const key = `${ownerId}::${sitterId}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          po_id: ownerId,
          petsitter_id: sitterId,
          owner: ownerMap.get(ownerId) || null,
          sitter: sitterMap.get(sitterId) || null,
          messages: [],
        });
      }

      grouped.get(key).messages.push(message);
    });

    const groupedConversations = Array.from(grouped.values())
      .map((conversation) => {
        const sortedMessages = [...conversation.messages].sort(
          compareMessagesAscending
        );

        const lastMessage =
          sortedMessages[sortedMessages.length - 1] || null;

        return {
          ...conversation,
          messages: sortedMessages,
          lastMessage,
          ownerName: getOwnerName(
            conversation.owner,
            conversation.po_id
          ),
          sitterName: getSitterName(
            conversation.sitter,
            conversation.petsitter_id
          ),
          lastSender: normalizeRole(lastMessage?.sender_role),
          lastMessageDate: getMessageDate(lastMessage),
          lastActivityAt:
            lastMessage?.created_at ||
            buildMessageDateTime(lastMessage),
        };
      })
      .sort(
        (a, b) =>
          getComparableTimestamp(b.lastMessage) -
          getComparableTimestamp(a.lastMessage)
      );

    return {
      conversations: groupedConversations,
      unlinkedCount: unlinked,
    };
  }, [messages, ownerMap, sitterMap]);

  const today = getPhilippineDateOnly();

  const stats = useMemo(() => {
    const activeToday = conversations.filter(
      (conversation) =>
        conversation.lastMessageDate === today
    ).length;

    return {
      total: conversations.length,
      activeToday,
    };
  }, [conversations, today]);

  const filteredConversations = useMemo(() => {
    const keyword = search
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    return conversations.filter((conversation) => {
      const searchableValues = [
        conversation.po_id,
        conversation.petsitter_id,
        conversation.ownerName,
        conversation.sitterName,
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
        (cardFilter === "today" &&
          conversation.lastMessageDate === today);

      const matchesDateFrom =
        !dateFrom ||
        (conversation.lastMessageDate &&
          conversation.lastMessageDate >= dateFrom);

      const matchesDateTo =
        !dateTo ||
        (conversation.lastMessageDate &&
          conversation.lastMessageDate <= dateTo);

      return (
        matchesSearch &&
        matchesCard &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    conversations,
    search,
    cardFilter,
    dateFrom,
    dateTo,
    today,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredConversations.length / ROWS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedConversations = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;

    return filteredConversations.slice(
      start,
      start + ROWS_PER_PAGE
    );
  }, [filteredConversations, currentPage]);

  useEffect(() => {
    if (!selectedConversation) return;

    const refreshedConversation = conversations.find(
      (conversation) =>
        conversation.key === selectedConversation.key
    );

    if (refreshedConversation) {
      setSelectedConversation(refreshedConversation);
    } else {
      setSelectedConversation(null);
    }
  }, [conversations]);

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

  const firstVisible =
    filteredConversations.length > 0
      ? (currentPage - 1) * ROWS_PER_PAGE + 1
      : 0;

  const lastVisible = Math.min(
    currentPage * ROWS_PER_PAGE,
    filteredConversations.length
  );

  return (
    <div className="messages-page" style={pageThemeStyle}>
      <style>{MESSAGE_INTERACTION_CSS}</style>

      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Messages</h1>

          <p style={styles.subtitle}>
            View messages exchanged between pet owners and pet sitters.
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
          title="All Conversations"
          value={stats.total}
          desc="All owner and sitter conversations"
          active={cardFilter === "all"}
          onClick={() => applyCardFilter("all")}
        />

        <StatCard
          icon={<Clock3 size={30} />}
          iconStyle={styles.statBlue}
          title="Active Today"
          value={stats.activeToday}
          desc="Conversations updated today"
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

      {unlinkedCount > 0 && (
        <div style={styles.noticeBox}>
          <AlertCircle size={18} />

          <div>
            <strong>
              {unlinkedCount} message
              {unlinkedCount === 1 ? "" : "s"} cannot be shown in a conversation.
            </strong>

            <span>
              Some messages are missing Pet Owner or Pet Sitter information.
            </span>
          </div>
        </div>
      )}

      <section style={styles.tableCard}>
        <div style={styles.filters}>
          <div style={styles.leftFilters}>
            <div
              className={`conversation-search-shell${
                search.trim() ? " has-value" : ""
              }`}
              style={styles.searchBox}
            >
              <Search
                size={21}
                color={darkMode ? "#CFC2BE" : "#5E4B45"}
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search pet owner, pet sitter, or ID"
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
              <Calendar size={20} />

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
              onClick={() => fetchMessageData()}
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
                className="conversation-date-input"
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
                className="conversation-date-input"
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
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "9%" }} />
            </colgroup>

            <thead>
              <tr style={styles.tableHeadRow}>
                <Th>No.</Th>
                <Th>Pet Owner</Th>
                <Th>Pet Sitter</Th>
                <Th>Last Message</Th>
                <Th>Last Updated</Th>
                <Th>Total Messages</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={styles.emptyCell}>
                    <div style={styles.loadingContent}>
                      <RefreshCw size={21} />
                      <span>Loading conversations...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedConversations.length > 0 ? (
                paginatedConversations.map(
                  (conversation, index) => (
                    <tr
                      key={conversation.key}
                      className="conversation-row"
                      role="button"
                      tabIndex={0}
                      aria-label={`Open conversation between ${conversation.ownerName} and ${conversation.sitterName}`}
                      style={{
                        ...styles.tableRow,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setSelectedConversation(conversation)
                      }
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;

                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          setSelectedConversation(conversation);
                        }
                      }}
                    >
                      <td style={styles.numberCell}>
                        {(currentPage - 1) * ROWS_PER_PAGE +
                          index +
                          1}
                      </td>

                      <td style={styles.normalCell}>
                        <strong style={styles.primaryText}>
                          {conversation.ownerName}
                        </strong>

                        <span style={styles.secondaryText}>
                          Owner ID: {conversation.po_id}
                        </span>
                      </td>

                      <td style={styles.normalCell}>
                        <strong style={styles.primaryText}>
                          {conversation.sitterName}
                        </strong>

                        <span style={styles.secondaryText}>
                          Sitter ID: {conversation.petsitter_id}
                        </span>
                      </td>

                      <td style={styles.messageCell}>
                        <strong style={styles.messagePreview}>
                          {getMessagePreview(
                            conversation.lastMessage
                          )}
                        </strong>

                        <span style={styles.secondaryText}>
                          Latest from: {conversation.lastSender}
                        </span>
                      </td>

                      <td style={styles.normalCell}>
                        <strong style={styles.primaryText}>
                          {formatDate(
                            conversation.lastMessageDate
                          )}
                        </strong>

                        <span style={styles.secondaryText}>
                          {formatMessageTime(
                            conversation.lastMessage
                          )}
                        </span>
                      </td>

                      <td style={styles.normalCell}>
                        <span style={styles.countBadge}>
                          {conversation.messages.length}
                        </span>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td colSpan="6" style={styles.emptyCell}>
                    No linked conversations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.pagination}>
          <p style={styles.pageText}>
            Showing {firstVisible} to {lastVisible} of{" "}
            {filteredConversations.length} conversations
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

      {selectedConversation && (
        <ConversationModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
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
      className={`conversation-stat-card${
        active ? " is-active" : ""
      }`}
      style={styles.statCard}
      onClick={onClick}
    >
      <div
        className="conversation-stat-icon"
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

function ConversationModal({ conversation, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="conversation-title"
        style={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <div>
            <p style={styles.modalEyebrow}>MESSAGE HISTORY</p>

            <h2 id="conversation-title" style={styles.modalTitle}>
              {conversation.ownerName}
              <span style={styles.modalTitleDivider}> & </span>
              {conversation.sitterName}
            </h2>

            <p style={styles.modalReference}>
              {conversation.messages.length} message
              {conversation.messages.length === 1 ? "" : "s"} in this conversation
            </p>
          </div>

          <button
            type="button"
            aria-label="Close conversation"
            className="message-close-button"
            style={styles.modalCloseBtn}
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>

        <div style={styles.participantStrip}>
          <p style={styles.participantStripTitle}>
            Participants
          </p>

          <div style={styles.participantGrid}>
            <Participant
              label="Pet Owner"
              name={conversation.ownerName}
              idLabel={`Owner ID: ${conversation.po_id}`}
              record={conversation.owner}
              role="owner"
            />

            <Participant
              label="Pet Sitter"
              name={conversation.sitterName}
              idLabel={`Sitter ID: ${conversation.petsitter_id}`}
              record={conversation.sitter}
              role="sitter"
            />
          </div>
        </div>

        <div style={styles.chatBody}>
          {conversation.messages.map((message) => {
            const fromOwner = isOwnerRole(message.sender_role);

            return (
              <div
                key={message.message_id}
                style={{
                  ...styles.chatRow,
                  justifyContent: fromOwner ? "flex-start" : "flex-end",
                }}
              >
                <div
                  className="chat-bubble"
                  style={{
                    ...styles.chatBubble,
                    ...(fromOwner
                      ? styles.ownerChatBubble
                      : styles.sitterChatBubble),
                  }}
                >
                  <div style={styles.chatBubbleHeader}>
                    <span style={styles.chatSender}>
                      {fromOwner
                        ? conversation.ownerName
                        : conversation.sitterName}
                    </span>

                    <span style={styles.chatRole}>
                      {normalizeRole(message.sender_role)}
                    </span>
                  </div>

                  {String(
                    message.message_content || ""
                  ).trim() && (
                    <p style={styles.chatMessage}>
                      {message.message_content}
                    </p>
                  )}

                  {getMessageImageValue(
                    message
                  ) && (
                    <MessageImage
                      message={message}
                      senderName={
                        fromOwner
                          ? conversation.ownerName
                          : conversation.sitterName
                      }
                    />
                  )}

                  {!String(
                    message.message_content || ""
                  ).trim() &&
                    !getMessageImageValue(
                      message
                    ) && (
                      <p style={styles.chatEmptyMessage}>
                        No text message.
                      </p>
                    )}

                  <div style={styles.chatMeta}>
                    <span>
                      {formatDate(getMessageDate(message))}
                    </span>

                    <span>•</span>

                    <span>{formatMessageTime(message)}</span>

                    <span>•</span>

                    <span>
                      {formatMessageId(message.message_id)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.modalActions}>
          <div style={styles.messageCountText}>
            <MessageCircleMore size={16} />
            {conversation.messages.length} total message
            {conversation.messages.length === 1 ? "" : "s"}
          </div>

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

function MessageImage({ message, senderName }) {
  const imageValue =
    getMessageImageValue(message);

  const [imageUrl, setImageUrl] =
    useState("");

  const [loadingImage, setLoadingImage] =
    useState(Boolean(imageValue));

  const [imageError, setImageError] =
    useState("");

  const [previewOpen, setPreviewOpen] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveImage() {
      const storedValue =
        String(imageValue || "").trim();

      setImageUrl("");
      setImageError("");

      if (!storedValue) {
        setLoadingImage(false);
        return;
      }

      if (isDirectImageUrl(storedValue)) {
        setImageUrl(storedValue);
        setLoadingImage(false);
        return;
      }

      setLoadingImage(true);

      const bucketName =
        MESSAGE_IMAGE_BUCKET_CANDIDATES[0];

      const storagePath =
        getMessageImageStoragePath(
          storedValue,
          bucketName
        );

      if (!storagePath) {
        if (!cancelled) {
          setImageError(
            "No photo is available for this message."
          );
          setLoadingImage(false);
        }

        return;
      }

      const {
        data,
        error,
      } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(
          storagePath,
          60 * 60
        );

      if (
        !error &&
        data?.signedUrl
      ) {
        if (!cancelled) {
          setImageUrl(
            data.signedUrl
          );
          setImageError("");
          setLoadingImage(false);
        }

        return;
      }

      if (!cancelled) {
        setImageError(
          'The Admin website does not currently have permission to read this private message photo.'
        );

        setLoadingImage(false);
      }
    }

    resolveImage();

    return () => {
      cancelled = true;
    };
  }, [imageValue]);

  if (!imageValue) {
    return null;
  }

  if (loadingImage) {
    return (
      <div style={styles.messageImageState}>
        <ImageIcon size={17} />
        <span>Loading photo...</span>
      </div>
    );
  }

  if (
    imageError ||
    !imageUrl
  ) {
    return (
      <div
        style={{
          ...styles.messageImageState,
          ...styles.messageImageError,
        }}
      >
        <AlertCircle size={17} />

        <div>
          <strong>
            Photo could not be displayed.
          </strong>

          <span
            style={
              styles.messageImageErrorText
            }
          >
            {imageError}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="message-image-button"
        aria-label={`View photo sent in ${formatMessageId(
          message?.message_id
        )}`}
        title="Click to view full photo"
        style={styles.messageImageButton}
        onClick={(event) => {
          event.stopPropagation();
          setPreviewOpen(true);
        }}
      >
        <img
          src={imageUrl}
          alt={`Image sent in ${formatMessageId(
            message?.message_id
          )}`}
          style={styles.messageImage}
          onError={() =>
            setImageError(
              "The image link was resolved, but the image could not be loaded."
            )
          }
        />

        <span
          style={
            styles.messageImageHint
          }
        >
          <ZoomIn size={14} />
          View photo
        </span>
      </button>

      {previewOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={
              styles.messageImagePreviewOverlay
            }
            onClick={() =>
              setPreviewOpen(false)
            }
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Shared photo preview"
              style={
                styles.messageImagePreviewModal
              }
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div
                style={
                  styles.messageImagePreviewHeader
                }
              >
                <div
                  style={
                    styles.messageImagePreviewHeading
                  }
                >
                  <p
                    style={
                      styles.messageImagePreviewEyebrow
                    }
                  >
                    SHARED PHOTO
                  </p>

                  <h2
                    style={
                      styles.messageImagePreviewTitle
                    }
                  >
                    {senderName ||
                      normalizeRole(
                        message?.sender_role
                      )}{" "}
                    - Message Photo
                  </h2>

                  <p
                    style={
                      styles.messageImagePreviewMeta
                    }
                  >
                    {formatMessageId(
                      message?.message_id
                    )}{" "}
                    •{" "}
                    {formatDate(
                      getMessageDate(
                        message
                      )
                    )}{" "}
                    •{" "}
                    {formatMessageTime(
                      message
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close photo preview"
                  className="message-image-preview-close"
                  style={
                    styles.messageImagePreviewClose
                  }
                  onClick={() =>
                    setPreviewOpen(false)
                  }
                >
                  <X size={23} />
                </button>
              </div>

              <div
                style={
                  styles.messageImagePreviewBody
                }
              >
                <div
                  style={
                    styles.messageImageStage
                  }
                >
                  <img
                    src={imageUrl}
                    alt={`Full image sent in ${formatMessageId(
                      message?.message_id
                    )}`}
                    style={
                      styles.messageImagePreview
                    }
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function Participant({
  label,
  name,
  idLabel,
  record,
  role,
}) {
  return (
    <div style={styles.participant}>
      <ParticipantProfilePhoto
        record={record}
        role={role}
        name={name}
      />

      <div style={styles.participantText}>
        <p style={styles.participantLabel}>{label}</p>
        <h4 style={styles.participantName}>{name}</h4>
        <p style={styles.participantId}>{idLabel}</p>
      </div>
    </div>
  );
}

function ParticipantProfilePhoto({
  record,
  role,
  name,
}) {
  const photoValue =
    getParticipantProfilePhotoValue(
      record,
      role
    );

  const [photoUrl, setPhotoUrl] =
    useState("");
  const [photoFailed, setPhotoFailed] =
    useState(false);

  const bucketName =
    role === "sitter"
      ? SITTER_PROFILE_PHOTO_BUCKET
      : OWNER_PROFILE_PHOTO_BUCKET;

  useEffect(() => {
    let active = true;

    async function loadProfilePhoto() {
      setPhotoUrl("");
      setPhotoFailed(false);

      const storedValue =
        String(photoValue || "").trim();

      if (!storedValue) {
        return;
      }

      /*
        Some mobile implementations store the complete URL.
        In that case, no Storage conversion is necessary.
      */
      if (isDirectImageUrl(storedValue)) {
        if (active) {
          setPhotoUrl(storedValue);
        }

        return;
      }

      const storagePath =
        getProfilePhotoStoragePath(
          storedValue,
          bucketName
        );

      if (!storagePath) {
        if (active) {
          setPhotoFailed(true);
        }

        return;
      }

      /*
        Use the same profile-photos bucket used by the mobile profiles.
        A signed URL supports private Storage buckets when the current
        client has permission to read the object.
      */
      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(
          storagePath,
          60 * 60
        );

      if (
        !signedError &&
        signedData?.signedUrl
      ) {
        if (active) {
          setPhotoUrl(
            signedData.signedUrl
          );
        }

        return;
      }

      /*
        Fall back to a public URL for public profile-photo buckets.
      */
      const {
        data: publicData,
      } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storagePath);

      if (
        active &&
        publicData?.publicUrl
      ) {
        setPhotoUrl(
          publicData.publicUrl
        );
      } else if (active) {
        setPhotoFailed(true);
      }
    }

    loadProfilePhoto();

    return () => {
      active = false;
    };
  }, [photoValue]);

  const showPhoto =
    Boolean(photoUrl) &&
    !photoFailed;

  return (
    <div
      style={styles.avatar}
      title={
        showPhoto
          ? `${name} profile photo`
          : `${name} has no profile photo`
      }
    >
      {showPhoto ? (
        <img
          src={photoUrl}
          alt={`${name} profile`}
          style={styles.avatarImage}
          onError={() =>
            setPhotoFailed(true)
          }
        />
      ) : (
        <UserRound size={21} />
      )}
    </div>
  );
}

function getParticipantProfilePhotoValue(
  record,
  role
) {
  if (!record) {
    return "";
  }

  /*
    Use role-specific columns first, then common aliases.
    This keeps the Admin page compatible with the mobile profile
    implementation without confusing Pet Place photos with profiles.
  */
  const candidates =
    role === "sitter"
      ? [
          record.ps_photo_url,
          record.ps_profile_photo_url,
          record.profile_photo_url,
          record.photo_url,
          record.avatar_url,
        ]
      : [
          record.po_photo_url,
          record.po_profile_photo_url,
          record.profile_photo_url,
          record.photo_url,
          record.avatar_url,
        ];

  for (const candidate of candidates) {
    const value =
      String(candidate ?? "").trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function getProfilePhotoStoragePath(
  value,
  bucketName
) {
  const text =
    String(value || "")
      .trim()
      .replace(/^\/+/, "");

  if (!text) {
    return "";
  }

  const bucketPrefix =
    `${bucketName}/`;

  if (
    text
      .toLowerCase()
      .startsWith(
        bucketPrefix.toLowerCase()
      )
  ) {
    return text.slice(
      bucketPrefix.length
    );
  }

  return text;
}

function getMessageImageValue(message) {
  if (!message) {
    return "";
  }

  return String(
    message.image_path || ""
  ).trim();
}

function getMessagePreview(message) {
  if (!message) {
    return "No text message.";
  }

  const content =
    String(
      message.message_content || ""
    ).trim();

  const imageValue =
    getMessageImageValue(message);

  if (
    content &&
    !(
      imageValue === content &&
      isLikelyImageUrl(content)
    )
  ) {
    return content;
  }

  if (imageValue) {
    return "📷 Image";
  }

  return "No text message.";
}

function isDirectImageUrl(value) {
  const text =
    String(value || "").trim();

  return (
    text.startsWith("http://") ||
    text.startsWith("https://") ||
    text.startsWith("data:image/") ||
    text.startsWith("blob:")
  );
}

function isLikelyImageUrl(value) {
  const text =
    String(value || "")
      .trim()
      .toLowerCase();

  if (!text) {
    return false;
  }

  if (
    text.startsWith("data:image/")
  ) {
    return true;
  }

  const withoutQuery =
    text.split("?")[0];

  return (
    (text.startsWith("http://") ||
      text.startsWith("https://")) &&
    /\.(png|jpe?g|webp|gif|heic|heif)$/i.test(
      withoutQuery
    )
  );
}

function getMessageImageStoragePath(
  value,
  bucketName
) {
  const text = String(value || "")
    .trim()
    .replace(/^\/+/, "");

  if (!text) {
    return "";
  }

  const bucketPrefix =
    `${bucketName}/`;

  if (
    text
      .toLowerCase()
      .startsWith(
        bucketPrefix.toLowerCase()
      )
  ) {
    return text.slice(
      bucketPrefix.length
    );
  }

  return text;
}

function getMessageOwnerId(message) {
  return normalizeReferenceKey(
    message?.po_id ??
      message?.petowner_id ??
      message?.pet_owner_id ??
      message?.owner_id
  );
}

function getMessageSitterId(message) {
  return normalizeReferenceKey(
    message?.petsitter_id ??
      message?.ps_id ??
      message?.pet_sitter_id ??
      message?.sitter_id
  );
}

function normalizeReferenceKey(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value).trim();
}

function getOwnerName(owner, fallbackId) {
  if (!owner) {
    return fallbackId ? `Pet Owner ${fallbackId}` : "Pet Owner";
  }

  const fullName = `${owner.po_fname || ""} ${
    owner.po_lname || ""
  }`.trim();

  return (
    fullName ||
    owner.po_username ||
    (fallbackId ? `Pet Owner ${fallbackId}` : "Pet Owner")
  );
}

function getSitterName(sitter, fallbackId) {
  if (!sitter) {
    return fallbackId ? `Pet Sitter ${fallbackId}` : "Pet Sitter";
  }

  const fullName = `${sitter.ps_fname || ""} ${
    sitter.ps_lname || ""
  }`.trim();

  return (
    fullName ||
    sitter.ps_username ||
    (fallbackId ? `Pet Sitter ${fallbackId}` : "Pet Sitter")
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

  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isOwnerRole(value) {
  return normalizeRole(value) === "Pet Owner";
}

function isSitterRole(value) {
  return normalizeRole(value) === "Pet Sitter";
}

function compareMessagesAscending(a, b) {
  return getComparableTimestamp(a) - getComparableTimestamp(b);
}

function getComparableTimestamp(message) {
  if (!message) return 0;

  if (message.created_at) {
    const created = new Date(message.created_at).getTime();

    if (!Number.isNaN(created)) {
      return created;
    }
  }

  const fallback = buildMessageDateTime(message);
  const parsed = fallback ? new Date(fallback).getTime() : 0;

  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildMessageDateTime(message) {
  const date = String(message?.message_date || "").trim();
  const time = String(message?.message_time || "").trim();

  if (!date) return "";

  return `${date}T${time || "00:00:00"}`;
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
    fontSize: adminScaledFontSize(34),
    fontWeight: 900,
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(15),
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    color: "var(--msg-strong)",
    fontSize: adminScaledFontSize(14),
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  chevron: {
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(22),
  },

  statsGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
    fontSize: adminScaledFontSize(14),
    fontWeight: 800,
    color: "var(--msg-text)",
  },

  statValue: {
    margin: "4px 0 2px",
    fontSize: adminScaledFontSize(28),
    fontWeight: 900,
    color: "var(--msg-strong)",
  },

  statDesc: {
    margin: 0,
    fontSize: adminScaledFontSize(12),
    color: "var(--msg-muted)",
    lineHeight: 1.35,
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
    fontSize: adminScaledFontSize(13),
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

  noticeBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "12px 14px",
    marginBottom: 18,
    borderRadius: 10,
    border: "1px solid #F0D6A9",
    background: "#FFF8E9",
    color: "#8A5712",
    fontSize: adminScaledFontSize(12.5),
    lineHeight: 1.5,
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
    maxWidth: 520,
    minWidth: 300,
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
    fontSize: adminScaledFontSize(14),
    color: "var(--msg-text)",
    background: "transparent",
    minWidth: 0,
  },

  dateBtn: {
    width: 210,
    height: 48,
    border: "1px solid var(--msg-border-strong)",
    borderRadius: 7,
    background: "var(--msg-card)",
    color: "var(--msg-muted)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 16px",
    fontFamily: "inherit",
    fontSize: adminScaledFontSize(14),
    fontWeight: 400,
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
    fontSize: adminScaledFontSize(13),
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
    fontSize: adminScaledFontSize(13),
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
    minWidth: 1150,
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
    fontSize: adminScaledFontSize(12.5),
    fontWeight: 900,
    lineHeight: 1.3,
  },

  tableRow: {
    borderBottom: "1px solid var(--msg-border)",
  },

  numberCell: {
    padding: "14px 11px",
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(13),
    fontWeight: 800,
    textAlign: "center",
    verticalAlign: "middle",
  },

  normalCell: {
    padding: "14px 11px",
    color: "var(--msg-text)",
    fontSize: adminScaledFontSize(12.5),
    verticalAlign: "middle",
    overflowWrap: "anywhere",
  },

  messageCell: {
    padding: "14px 11px",
    color: "var(--msg-text)",
    fontSize: adminScaledFontSize(12.5),
    verticalAlign: "middle",
    minWidth: 0,
  },

  primaryText: {
    display: "block",
    color: "var(--msg-text)",
    fontSize: adminScaledFontSize(13),
    fontWeight: 900,
    lineHeight: 1.4,
  },

  secondaryText: {
    display: "block",
    marginTop: 5,
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(10.5),
    fontWeight: 700,
  },

  messagePreview: {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    color: "var(--msg-text)",
    fontSize: adminScaledFontSize(13),
    fontWeight: 800,
    lineHeight: 1.45,
    overflowWrap: "anywhere",
  },

  countBadge: {
    minWidth: 34,
    height: 28,
    padding: "0 9px",
    borderRadius: 999,
    background: BRAND.softPink,
    color: BRAND.pink,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: adminScaledFontSize(12),
    fontWeight: 900,
  },

  emptyCell: {
    padding: 30,
    textAlign: "center",
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(14),
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
    fontSize: adminScaledFontSize(13),
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
    fontSize: adminScaledFontSize(13),
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
    width: "min(900px, 100%)",
    height: "min(88vh, 820px)",
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
    padding: "20px 22px 15px",
    borderBottom: "1px solid var(--msg-border)",
    flexShrink: 0,
  },

  modalEyebrow: {
    margin: 0,
    color: BRAND.pink,
    fontSize: adminScaledFontSize(10),
    fontWeight: 900,
    letterSpacing: "0.8px",
  },

  modalTitle: {
    margin: "4px 0 0",
    color: "var(--msg-strong)",
    fontSize: adminScaledFontSize(22),
    fontWeight: 900,
    lineHeight: 1.3,
  },

  modalTitleDivider: {
    color: BRAND.pink,
    fontWeight: 900,
  },

  modalReference: {
    margin: "5px 0 0",
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 700,
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

  participantStrip: {
    padding: "12px 22px 15px",
    borderBottom: "1px solid var(--msg-border)",
    background: "var(--msg-head)",
    flexShrink: 0,
  },

  participantStripTitle: {
    margin: "0 0 9px",
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(10),
    fontWeight: 900,
    letterSpacing: "0.45px",
    textTransform: "uppercase",
  },

  participantGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    alignItems: "stretch",
    gap: 14,
  },

  participant: {
    minHeight: 68,
    padding: "10px 12px",
    borderRadius: 11,
    border: "1px solid var(--msg-border)",
    background: "var(--msg-card)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
    boxSizing: "border-box",
  },

  avatar: {
    width: 46,
    height: 46,
    minWidth: 46,
    borderRadius: "50%",
    background: BRAND.softPink,
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: "1px solid var(--msg-border)",
    flexShrink: 0,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
    objectPosition: "center",
  },

  participantText: {
    minWidth: 0,
    flex: 1,
  },

  participantLabel: {
    margin: 0,
    color: BRAND.pink,
    fontSize: adminScaledFontSize(10),
    fontWeight: 900,
    letterSpacing: "0.2px",
  },

  participantName: {
    margin: "2px 0 0",
    color: "var(--msg-text)",
    fontSize: adminScaledFontSize(13.5),
    fontWeight: 900,
    overflowWrap: "anywhere",
  },

  participantId: {
    margin: "2px 0 0",
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(10),
    fontWeight: 700,
  },

  chatBody: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "20px 22px",
    background: "var(--msg-card-soft)",
  },

  chatRow: {
    display: "flex",
    width: "100%",
    marginBottom: 12,
  },

  chatBubble: {
    width: "fit-content",
    maxWidth: "72%",
    borderRadius: 14,
    padding: "11px 13px",
    border: "1px solid var(--msg-border)",
    boxSizing: "border-box",
  },

  ownerChatBubble: {
    background: "var(--msg-card)",
    borderTopLeftRadius: 5,
  },

  sitterChatBubble: {
    background: BRAND.softPink,
    borderColor: "#F1C9D4",
    borderTopRightRadius: 5,
  },

  chatBubbleHeader: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
    marginBottom: 6,
  },

  chatSender: {
    color: "var(--msg-strong)",
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 900,
  },

  chatRole: {
    padding: "2px 6px",
    borderRadius: 999,
    background: "rgba(217, 67, 104, 0.10)",
    color: BRAND.pink,
    fontSize: adminScaledFontSize(9.5),
    fontWeight: 900,
  },

  chatMessage: {
    margin: 0,
    color: "var(--msg-text)",
    fontSize: adminScaledFontSize(13.5),
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },

  chatEmptyMessage: {
    margin: 0,
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(12.5),
    fontStyle: "italic",
    lineHeight: 1.5,
  },

  messageImageButton: {
    width: "min(320px, 100%)",
    marginTop: 8,
    padding: 0,
    borderRadius: 11,
    border: "1px solid var(--msg-border-strong)",
    background: "var(--msg-card)",
    overflow: "hidden",
    cursor: "pointer",
    display: "block",
    textAlign: "left",
    fontFamily: "inherit",
  },

  messageImage: {
    width: "100%",
    maxHeight: 280,
    display: "block",
    objectFit: "cover",
    background: "var(--msg-head)",
    transition: "transform 180ms ease",
  },

  messageImageHint: {
    minHeight: 34,
    padding: "0 10px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(10.5),
    fontWeight: 800,
    boxSizing: "border-box",
  },

  messageImageState: {
    marginTop: 8,
    width: "min(320px, 100%)",
    minHeight: 54,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--msg-border)",
    background: "var(--msg-head)",
    color: "var(--msg-muted)",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 800,
    boxSizing: "border-box",
  },

  messageImageError: {
    borderColor: "#F0C7CD",
    background: "#FFF4F5",
    color: "#A53A49",
    alignItems: "flex-start",
  },

  messageImageErrorText: {
    display: "block",
    marginTop: 3,
    fontSize: adminScaledFontSize(10),
    fontWeight: 700,
    lineHeight: 1.4,
  },

  messageImagePreviewOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    padding: 24,
    background: "rgba(47, 31, 27, 0.58)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },

  messageImagePreviewModal: {
    width: "min(1200px, 94vw)",
    height: "min(86vh, 760px)",
    background: "#FFFFFF",
    borderRadius: 18,
    border: "1px solid #EADDD9",
    boxShadow: "0 24px 64px rgba(51, 26, 18, 0.24)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  messageImagePreviewHeader: {
    minHeight: 92,
    padding: "16px 20px 15px",
    borderBottom: "1px solid #EEE2E0",
    background: "#FFFFFF",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
    flexShrink: 0,
    boxSizing: "border-box",
  },

  messageImagePreviewHeading: {
    minWidth: 0,
  },

  messageImagePreviewEyebrow: {
    margin: 0,
    color: BRAND.pink,
    fontSize: adminScaledFontSize(10.5),
    fontWeight: 900,
    letterSpacing: "0.7px",
  },

  messageImagePreviewTitle: {
    margin: "4px 0 0",
    color: BRAND.brown,
    fontSize: adminScaledFontSize(21),
    fontWeight: 900,
    lineHeight: 1.25,
    overflowWrap: "anywhere",
  },

  messageImagePreviewMeta: {
    margin: "5px 0 0",
    color: BRAND.muted,
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 750,
  },

  messageImagePreviewClose: {
    width: 42,
    height: 42,
    minWidth: 42,
    borderRadius: 11,
    border: "1px solid #E7DAD7",
    background: "#FFFFFF",
    color: BRAND.brown,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },

  messageImagePreviewBody: {
    flex: 1,
    minHeight: 0,
    padding: "28px 32px 32px",
    overflow: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FFF9F8",
    boxSizing: "border-box",
  },

  messageImageStage: {
    width: "100%",
    height: "100%",
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  messageImagePreview: {
    display: "block",
    width: "auto",
    height: "auto",
    maxWidth: "88%",
    maxHeight: "100%",
    objectFit: "contain",
    borderRadius: 12,
    boxShadow: "0 10px 26px rgba(58, 30, 20, 0.12)",
  },

  chatMeta: {
    marginTop: 7,
    display: "flex",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(9.5),
    fontWeight: 700,
  },

  modalActions: {
    minHeight: 64,
    padding: "12px 22px",
    borderTop: "1px solid var(--msg-border)",
    background: "var(--msg-card)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },

  messageCountText: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "var(--msg-muted)",
    fontSize: adminScaledFontSize(12),
    fontWeight: 800,
  },

  closeModalBtn: {
    height: 40,
    border: "none",
    borderRadius: 9,
    background: BRAND.pink,
    color: "#FFFFFF",
    padding: "0 18px",
    fontFamily: "inherit",
    fontSize: adminScaledFontSize(13),
    fontWeight: 900,
    cursor: "pointer",
  },
};
