import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Star,
  ThumbsUp,
  ThumbsDown,
  X,
  RefreshCw,
  AlertCircle,
  UserRound,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { useConfirmation } from "./context/ConfirmationProvider";
import { useAdminSettings } from "./context/AdminSettingsContext";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  softPink: "#FDEBED",
  sidebar: "#FDEEEF",
  border: "#EEE2E0",
  text: "#2E1B16",
  muted: "#6F625F",
};

const FEEDBACK_INTERACTION_CSS = `
  .feedback-interactive {
    transition:
      transform 0.14s ease,
      box-shadow 0.18s ease,
      filter 0.18s ease,
      border-color 0.18s ease,
      background-color 0.18s ease,
      color 0.18s ease !important;
    transform-origin: center;
  }

  .feedback-interactive:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 7px 16px rgba(58, 30, 20, 0.12);
  }

  .feedback-interactive:not(:disabled):active {
    transform: translateY(0) scale(0.975);
    box-shadow: 0 3px 8px rgba(58, 30, 20, 0.10);
  }

  .feedback-interactive:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.52);
    outline-offset: 2px;
  }

  .feedback-stat-card:not(:disabled):hover {
    transform: translateY(-4px) !important;
    border-color: rgba(217, 67, 104, 0.55) !important;
    box-shadow:
      0 12px 24px rgba(58, 30, 20, 0.12),
      0 0 0 2px rgba(217, 67, 104, 0.07) !important;
  }

  .feedback-stat-card:not(:disabled):active {
    transform: translateY(-1px) scale(0.985) !important;
  }

  .feedback-search-box {
    transition:
      transform 0.16s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease,
      background-color 0.18s ease;
  }

  .feedback-search-box:hover {
    border-color: rgba(217, 67, 104, 0.38) !important;
    box-shadow: 0 5px 14px rgba(58, 30, 20, 0.08);
  }

  .feedback-search-box:focus-within {
    border-color: rgba(217, 67, 104, 0.72) !important;
    box-shadow:
      0 0 0 3px var(--feedback-focus-ring),
      0 6px 16px rgba(58, 30, 20, 0.08);
    transform: translateY(-1px);
  }

  .feedback-search-box.has-value {
    box-shadow: inset 0 0 0 1px rgba(217, 67, 104, 0.15);
  }

  .feedback-input-interactive {
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      background-color 0.18s ease;
  }

  .feedback-input-interactive:not(:disabled):hover {
    border-color: rgba(217, 67, 104, 0.42) !important;
  }

  .feedback-input-interactive:not(:disabled):focus {
    outline: none;
    border-color: rgba(217, 67, 104, 0.74) !important;
    box-shadow: 0 0 0 3px var(--feedback-focus-ring);
  }

  .feedback-table-row {
    transition:
      background-color 0.16s ease,
      box-shadow 0.16s ease,
      filter 0.16s ease;
  }

  .feedback-table-row:hover {
    background: var(--feedback-hover) !important;
    box-shadow: inset 3px 0 0 #D94368;
  }

  .feedback-table-row:active {
    background: var(--feedback-hover-strong) !important;
  }

  .feedback-table-row:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.48);
    outline-offset: -2px;
    background: var(--feedback-hover) !important;
  }

  .feedback-close-button:not(:disabled):hover {
    color: #D94368 !important;
    border-color: rgba(217, 67, 104, 0.48) !important;
    background: var(--feedback-hover) !important;
  }

  .feedback-delete-button:not(:disabled):hover {
    color: #B42335 !important;
    background: #FFF0F2 !important;
    box-shadow: 0 7px 16px rgba(180, 35, 53, 0.14);
  }

  .feedback-primary-button:not(:disabled):hover {
    filter: brightness(1.04);
    box-shadow:
      0 8px 18px rgba(217, 67, 104, 0.20),
      0 0 0 2px rgba(217, 67, 104, 0.06);
  }

  .feedback-alert {
    animation: feedbackAlertIn 0.20s ease both;
  }

  @keyframes feedbackAlertIn {
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

const ROWS_PER_PAGE = 6;

export default function FeedbackPage() {
  const requestConfirmation = useConfirmation();
  const { settings, fontScale } = useAdminSettings();
  const darkMode = Boolean(settings?.darkMode);

  const pageThemeStyle = useMemo(
    () => ({
      "--feedback-page": darkMode ? "#171311" : "#FFF9F8",
      "--feedback-card": darkMode ? "#241D1A" : "#FFFFFF",
      "--feedback-card-soft": darkMode ? "#2B2320" : "#FFFCFB",
      "--feedback-table-head": darkMode ? "#2B2320" : "#FFFBFA",
      "--feedback-input": darkMode ? "#2B2320" : "#FFFFFF",
      "--feedback-text": darkMode ? "#FFF7F4" : "#1F1714",
      "--feedback-strong": darkMode ? "#FFF7F4" : "#3A1E14",
      "--feedback-muted": darkMode ? "#CFC2BE" : "#6D5F5B",
      "--feedback-border": darkMode ? "#443934" : "#EEE2DF",
      "--feedback-border-strong": darkMode ? "#5A4B45" : "#E2D5D3",
      "--feedback-hover": darkMode ? "#34282C" : "#FFF7F9",
      "--feedback-hover-strong": darkMode ? "#412E35" : "#FDEBED",
      "--feedback-focus-ring": "rgba(217, 67, 104, 0.10)",
      "--feedback-shadow": darkMode
        ? "0 8px 18px rgba(0,0,0,0.24)"
        : "0 8px 18px rgba(51,26,18,0.07)",
      width: "100%",
      minHeight: "100%",
      zoom: Number(fontScale || 1),
      color: "var(--feedback-text)",
      background: "var(--feedback-page)",
      transition: "background 0.2s ease, color 0.2s ease",
    }),
    [darkMode, fontScale]
  );

  const [feedbacks, setFeedbacks] = useState([]);
  const [owners, setOwners] = useState([]);
  const [sitters, setSitters] = useState([]);

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, ratingFilter, dateFrom, dateTo]);


  async function fetchFeedbackData() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const [feedbackResult, ownerResult, sitterResult] = await Promise.all([
        supabase
          .from("FEEDBACK")
          .select(
            "feedback_id, created_at, rating, comments, feedback_date, po_id, petsitter_id"
          )
          .order("created_at", { ascending: true }),

        supabase.from("PET_OWNER").select("*"),

        supabase
          .from("PET SITTER")
          .select(
            "petsitter_id, ps_fname, ps_lname, ps_username, ps_email, ps_contactno, ps_place"
          ),
      ]);

      if (feedbackResult.error) throw feedbackResult.error;

      if (ownerResult.error) {
        console.warn("PET OWNER lookup unavailable:", ownerResult.error);
      }

      if (sitterResult.error) {
        console.warn("PET SITTER lookup unavailable:", sitterResult.error);
      }
      
      setFeedbacks(feedbackResult.data || []);
      setOwners(ownerResult.data || []);
      setSitters(sitterResult.data || []);
    } catch (fetchError) {
      console.error("Unable to load feedback records:", fetchError);
      setError(
        fetchError?.message ||
          "Unable to load feedback records. Please check the database table and RLS policies."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteFeedback(feedback) {
    const confirmed = await requestConfirmation({
      title: "Delete feedback?",
      message: `Delete ${formatFeedbackId(
        feedback.feedback_id
      )} permanently? This action cannot be undone.`,
      confirmText: "Delete Feedback",
      variant: "danger",
    });

    if (!confirmed) return;

    setDeletingId(feedback.feedback_id);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("FEEDBACK")
        .delete()
        .eq("feedback_id", feedback.feedback_id);

      if (deleteError) throw deleteError;

      setFeedbacks((previous) =>
        previous.filter(
          (item) => item.feedback_id !== feedback.feedback_id
        )
      );

      setSelectedFeedback((previous) =>
        previous?.feedback_id === feedback.feedback_id ? null : previous
      );

      setSuccess(
        `${formatFeedbackId(feedback.feedback_id)} was deleted successfully.`
      );
    } catch (deleteError) {
      console.error("Unable to delete feedback:", deleteError);
      setError(
        deleteError?.message ||
          "Unable to delete the feedback. Check your FEEDBACK delete policy."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setRatingFilter("All Ratings");
    setDateFrom("");
    setDateTo("");
    setShowDateFilter(false);
    setCurrentPage(1);
  }

  function applyCardFilter(nextFilter) {
    setRatingFilter(nextFilter);
    setCurrentPage(1);
  }

  const ownerMap = useMemo(() => {
    const map = new Map();

    owners.forEach((owner) => {
      const id = getOwnerId(owner);

      if (id !== null && id !== undefined) {
        map.set(Number(id), owner);
      }
    });

    return map;
  }, [owners]);

  const sitterMap = useMemo(() => {
    return new Map(
      sitters.map((sitter) => [Number(sitter.petsitter_id), sitter])
    );
  }, [sitters]);

  const enrichedFeedbacks = useMemo(() => {
    return feedbacks.map((feedback) => {
      const owner = ownerMap.get(Number(feedback.po_id));
      const sitter = sitterMap.get(Number(feedback.petsitter_id));

      return {
        ...feedback,
        owner,
        sitter,
        ownerName: getOwnerName(owner, feedback.po_id),
        sitterName: getSitterName(sitter, feedback.petsitter_id),
      };
    });
  }, [feedbacks, ownerMap, sitterMap]);

  const filteredFeedbacks = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return enrichedFeedbacks.filter((item) => {
      const searchableValues = [
        item.feedback_id,
        formatFeedbackId(item.feedback_id),
        item.comments,
        item.rating,
        item.feedback_date,
        item.po_id,
        item.petsitter_id,
        item.ownerName,
        item.sitterName,
      ]
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value).toLowerCase());

      const matchesSearch =
        !keyword ||
        searchableValues.some((value) => value.includes(keyword));

      const numericRating = Number(item.rating);

      const matchesRating =
        ratingFilter === "All Ratings" ||
        (ratingFilter === "Positive" && numericRating >= 4) ||
        (ratingFilter === "Negative" && numericRating < 4) ||
        Number(item.rating) === Number(ratingFilter);

      const rawDate =
        item.feedback_date || item.created_at?.slice(0, 10) || "";

      const matchesDateFrom = !dateFrom || rawDate >= dateFrom;
      const matchesDateTo = !dateTo || rawDate <= dateTo;

      return (
        matchesSearch &&
        matchesRating &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    enrichedFeedbacks,
    search,
    ratingFilter,
    dateFrom,
    dateTo,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFeedbacks.length / ROWS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedFeedbacks = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredFeedbacks.slice(start, start + ROWS_PER_PAGE);
  }, [filteredFeedbacks, currentPage]);

  const stats = useMemo(() => {
    const validRatings = feedbacks
      .map((item) => Number(item.rating))
      .filter((rating) => Number.isFinite(rating));

    const total = feedbacks.length;

    const average =
      validRatings.length === 0
        ? "0.0"
        : (
            validRatings.reduce((sum, rating) => sum + rating, 0) /
            validRatings.length
          ).toFixed(1);

    const positive = validRatings.filter((rating) => rating >= 4).length;
    const negative = validRatings.filter((rating) => rating < 4).length;

    return {
      total,
      average,
      positive,
      negative,
      positivePercent:
        validRatings.length > 0
          ? Math.round((positive / validRatings.length) * 100)
          : 0,
      negativePercent:
        validRatings.length > 0
          ? Math.round((negative / validRatings.length) * 100)
          : 0,
    };
  }, [feedbacks]);

  const firstVisible =
    filteredFeedbacks.length === 0
      ? 0
      : (currentPage - 1) * ROWS_PER_PAGE + 1;

  const lastVisible = Math.min(
    currentPage * ROWS_PER_PAGE,
    filteredFeedbacks.length
  );

  return (
    <div style={pageThemeStyle}>
      <style>{FEEDBACK_INTERACTION_CSS}</style>

        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Feedbacks</h1>
            <p style={styles.subtitle}>
              View feedback and ratings submitted by pet owners.
            </p>
          </div>

          <div style={styles.breadcrumb}>
            <span>Dashboard</span>
            <span style={styles.chevron}>›</span>
            <span>Feedbacks</span>
          </div>
        </header>

        <section style={styles.statsGrid}>
          <StatCard
            icon={<MessageSquare size={30} />}
            iconStyle={styles.statPink}
            title="Total Feedbacks"
            value={stats.total}
            desc="All feedback records"
            active={ratingFilter === "All Ratings"}
            onClick={() => applyCardFilter("All Ratings")}
          />

          <StatCard
            icon={<Star size={32} />}
            iconStyle={styles.statGreen}
            title="Average Rating"
            value={stats.average}
            desc="Overall rating out of 5"
          />

          <StatCard
            icon={<ThumbsUp size={30} />}
            iconStyle={styles.statOrange}
            title="Positive Feedbacks"
            value={stats.positive}
            desc={`${stats.positivePercent}% rated 4–5 stars`}
            active={ratingFilter === "Positive"}
            onClick={() => applyCardFilter("Positive")}
          />

          <StatCard
            icon={<ThumbsDown size={30} />}
            iconStyle={styles.statRed}
            title="Negative Feedbacks"
            value={stats.negative}
            desc={`${stats.negativePercent}% rated below 4 stars`}
            active={ratingFilter === "Negative"}
            onClick={() => applyCardFilter("Negative")}
          />
        </section>

        {error && (
          <div className="feedback-alert" style={styles.errorBox}>
            <AlertCircle size={20} />
            <span style={styles.errorText}>{error}</span>
            <button className="feedback-interactive" style={styles.errorClose} onClick={() => setError("")}>
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="feedback-alert" style={styles.successBox}>
            <CheckCircle2 size={20} />
            <span style={styles.successText}>{success}</span>
            <button className="feedback-interactive"
              style={styles.successClose}
              onClick={() => setSuccess("")}
            >
              <X size={18} />
            </button>
          </div>
        )}

        <section style={styles.tableCard}>
          <div style={styles.filters}>
            <div style={styles.leftFilters}>
              <div
                className={`feedback-search-box${search ? " has-value" : ""}`}
                style={styles.searchBox}
              >
                <Search size={22} color="#5E4B45" />
                <input
                  className="feedback-input-interactive"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search feedback ID, owner, sitter, rating, or comment"
                  style={styles.searchInput}
                />
              </div>

              <button
                className="feedback-interactive"
                type="button"
                style={styles.dateBtn}
                onClick={() =>
                  setShowDateFilter((previous) => !previous)
                }
              >
                <Calendar size={20} />
                <span>
                  {showDateFilter ? "Hide date range" : "Select date range"}
                </span>
              </button>
            </div>

            <div style={styles.filterActions}>
              <button
                className="feedback-interactive"
                type="button"
                style={styles.refreshBtn}
                onClick={fetchFeedbackData}
                disabled={loading}
                title="Refresh feedbacks"
              >
                <RefreshCw size={19} />
                <span>{loading ? "Loading..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {showDateFilter && (
            <div style={styles.filterPanel}>
              <label style={styles.filterLabel}>
                From
                <input
                  className="feedback-input-interactive"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  style={styles.dateInput}
                />
              </label>

              <label style={styles.filterLabel}>
                To
                <input
                  className="feedback-input-interactive"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) => setDateTo(event.target.value)}
                  style={styles.dateInput}
                />
              </label>

              <button className="feedback-interactive" type="button" style={styles.clearBtn} onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <colgroup>
                <col style={{ width: "6%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>

              <thead>
                <tr style={styles.tableHeadRow}>
                  <Th>No.</Th>
                  <Th>Pet Owner</Th>
                  <Th>Pet Sitter</Th>
                  <Th>Rating</Th>
                  <Th>Comments</Th>
                  <Th>Feedback Date</Th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={styles.emptyCell}>
                      <div style={styles.loadingContent}>
                        <RefreshCw size={22} />
                        <span>Loading feedback records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedFeedbacks.length > 0 ? (
                  paginatedFeedbacks.map((item, index) => (
                    <tr
                      key={item.feedback_id}
                      className="feedback-table-row"
                      role="button"
                      tabIndex={0}
                      style={{ ...styles.tableRow, cursor: "pointer" }}
                      onClick={() => setSelectedFeedback(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedFeedback(item);
                        }
                      }}
                    >
                      <td style={styles.numberCell}>
                        {(currentPage - 1) * ROWS_PER_PAGE + index + 1}
                      </td>

                      <td style={styles.normalCell}>
                        <strong style={styles.primaryText}>
                          {item.ownerName}
                        </strong>
                        <span style={styles.secondaryText}>
                          Owner ID: {formatReferenceId(item.po_id)}
                        </span>
                      </td>

                      <td style={styles.normalCell}>
                        <strong style={styles.primaryText}>
                          {item.sitterName}
                        </strong>
                        <span style={styles.secondaryText}>
                          Sitter ID: {formatReferenceId(item.petsitter_id)}
                        </span>
                      </td>

                      <td style={styles.normalCell}>
                        <strong style={styles.ratingNumber}>
                          {formatRating(item.rating)}
                        </strong>

                        <StarRating rating={Number(item.rating) || 0} />
                      </td>

                      <td style={styles.commentCell}>
                        {item.comments || "No comment provided."}
                      </td>

                      <td style={styles.normalCell}>
                        <strong style={styles.primaryText}>
                          {formatDate(item.feedback_date)}
                        </strong>

                        <span style={styles.secondaryText}>
                          Added {formatDateTime(item.created_at)}
                        </span>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={styles.emptyCell}>
                      No feedbacks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <p style={styles.pageText}>
              Showing {firstVisible} to {lastVisible} of{" "}
              {filteredFeedbacks.length} feedbacks
            </p>

            <div style={styles.pages}>
              <button className="feedback-interactive"
                style={{
                  ...styles.pageBtn,
                  ...(currentPage === 1 ? styles.disabledBtn : {}),
                }}
                onClick={() =>
                  setCurrentPage((page) => Math.max(page - 1, 1))
                }
                disabled={currentPage === 1}
              >
                <ChevronLeft size={17} />
              </button>

              {getVisiblePages(currentPage, totalPages).map((page) =>
                page === "ellipsis-left" || page === "ellipsis-right" ? (
                  <span key={page} style={styles.ellipsis}>
                    …
                  </span>
                ) : (
                  <button className="feedback-interactive"
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={
                      currentPage === page
                        ? { ...styles.pageBtn, ...styles.activePage }
                        : styles.pageBtn
                    }
                  >
                    {page}
                  </button>
                )
              )}

              <button className="feedback-interactive"
                style={{
                  ...styles.pageBtn,
                  ...(currentPage === totalPages ? styles.disabledBtn : {}),
                }}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(page + 1, totalPages)
                  )
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

      {selectedFeedback && (
        <FeedbackDetailsModal
          feedback={selectedFeedback}
          deleting={deletingId === selectedFeedback.feedback_id}
          onDelete={deleteFeedback}
          onClose={() => setSelectedFeedback(null)}
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
  const content = (
    <>
      <div style={{ ...styles.statIcon, ...iconStyle }}>{icon}</div>

      <div>
        <p style={styles.statTitle}>{title}</p>
        <h2 style={styles.statValue}>{value}</h2>
        <p style={styles.statDesc}>{desc}</p>
      </div>
    </>
  );

  if (!onClick) {
    return <div style={{ ...styles.statCard, cursor: "default" }}>{content}</div>;
  }

  return (
    <button
      className="feedback-interactive feedback-stat-card"
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        ...styles.statCard,
        ...(active ? styles.statCardActive : {}),
        cursor: "pointer",
      }}
    >
      {content}
    </button>
  );
}

function Th({ children }) {
  return <th style={styles.th}>{children}</th>;
}

function StarRating({ rating, size = 14 }) {
  const roundedRating = Math.round(Number(rating) || 0);

  return (
    <div style={styles.stars}>
      {[1, 2, 3, 4, 5].map((number) => (
        <Star
          key={number}
          size={size}
          fill={number <= roundedRating ? "#F59E0B" : "#D9D9D9"}
          color={number <= roundedRating ? "#F59E0B" : "#D9D9D9"}
        />
      ))}
    </div>
  );
}

function FeedbackDetailsModal({
  feedback,
  deleting,
  onDelete,
  onClose,
}) {
  const busy = deleting;

  return (
    <div
      style={styles.modalOverlay}
      onClick={busy ? undefined : onClose}
    >
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Feedback Details</h2>
          </div>

          <button className="feedback-interactive feedback-close-button"
            type="button"
            style={{
              ...styles.modalCloseBtn,
              ...(busy ? styles.disabledModalAction : {}),
            }}
            disabled={busy}
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>

        <div style={styles.modalBody}>
        <div style={styles.modalGrid}>
          <div style={styles.personBox}>
            <div style={styles.bigAvatar}>
              <UserRound size={26} />
            </div>

            <div>
              <p style={styles.detailLabel}>Pet Owner</p>
              <h3 style={styles.detailName}>{feedback.ownerName}</h3>
              <p style={styles.detailSub}>
                Owner ID: {formatReferenceId(feedback.po_id)}
              </p>
            </div>
          </div>

          <div style={styles.personBox}>
            <div style={styles.bigAvatar}>
              <UserRound size={26} />
            </div>

            <div>
              <p style={styles.detailLabel}>Pet Sitter</p>
              <h3 style={styles.detailName}>{feedback.sitterName}</h3>
              <p style={styles.detailSub}>
                Sitter ID: {formatReferenceId(feedback.petsitter_id)}
              </p>
            </div>
          </div>
        </div>

        <div style={styles.ratingBox}>
          <p style={styles.detailLabel}>Rating</p>

          <div style={styles.ratingLine}>
            <strong style={styles.modalRating}>
              {formatRating(feedback.rating)}
            </strong>

            <StarRating
              rating={Number(feedback.rating) || 0}
              size={18}
            />
          </div>
        </div>

        <div style={styles.commentBox}>
          <p style={styles.detailLabel}>Feedback Message</p>

          <p style={styles.fullComment}>
            {feedback.comments || "No comment provided."}
          </p>
        </div>

        <div style={styles.modalInfoGrid}>
          <DetailItem
            label="Feedback ID"
            value={formatFeedbackId(feedback.feedback_id)}
          />

          <DetailItem
            label="Feedback Date"
            value={formatDate(feedback.feedback_date)}
          />

          <DetailItem
            label="Date Created"
            value={formatDateTime(feedback.created_at)}
          />
        </div>
        </div>

        <div style={styles.modalActions}>
          <button className="feedback-interactive feedback-delete-button"
            type="button"
            style={{
              ...styles.deleteModalBtn,
              ...(busy ? styles.disabledModalAction : {}),
            }}
            disabled={busy}
            onClick={() => onDelete(feedback)}
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete Feedback"}
          </button>

          <div style={styles.modalActionsRight}>
            <button className="feedback-interactive feedback-primary-button"
              type="button"
              style={{
                ...styles.closeModalBtn,
                ...(busy ? styles.disabledModalAction : {}),
              }}
              disabled={busy}
              onClick={onClose}
            >
              Close
            </button>
          </div>
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

function getOwnerId(owner) {
  if (!owner) return null;

  return (
    owner.po_id ??
    owner.petowner_id ??
    owner.pet_owner_id ??
    owner.owner_id ??
    owner.user_id ??
    owner.u_id ??
    null
  );
}

function getOwnerName(owner, fallbackId) {
  if (!owner) {
    return fallbackId !== null && fallbackId !== undefined
      ? `Pet Owner ${fallbackId}`
      : "Pet owner not set";
  }

  const firstName =
    owner.po_fname ??
    owner.owner_fname ??
    owner.petowner_fname ??
    owner.first_name ??
    owner.fname ??
    "";

  const lastName =
    owner.po_lname ??
    owner.owner_lname ??
    owner.petowner_lname ??
    owner.last_name ??
    owner.lname ??
    "";

  const fullName = `${firstName} ${lastName}`.trim();

  return (
    fullName ||
    owner.po_username ||
    owner.username ||
    owner.owner_name ||
    owner.full_name ||
    `Pet Owner ${fallbackId ?? ""}`.trim()
  );
}

function getSitterName(sitter, fallbackId) {
  if (!sitter) {
    return fallbackId !== null && fallbackId !== undefined
      ? `Pet Sitter ${fallbackId}`
      : "Pet sitter not set";
  }

  const fullName = `${sitter.ps_fname || ""} ${
    sitter.ps_lname || ""
  }`.trim();

  return (
    fullName ||
    sitter.ps_username ||
    `Pet Sitter ${fallbackId ?? ""}`.trim()
  );
}

function formatFeedbackId(id) {
  if (id === null || id === undefined || id === "") return "N/A";
  return `FB-${String(id).padStart(4, "0")}`;
}

function formatReferenceId(id) {
  if (id === null || id === undefined || id === "") return "Not set";
  return String(id);
}

function formatRating(rating) {
  const numericRating = Number(rating);

  return Number.isFinite(numericRating)
    ? numericRating.toFixed(1)
    : "0.0";
}

function formatDate(dateValue) {
  if (!dateValue) return "Not set";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(dateTimeValue) {
  if (!dateTimeValue) return "Not set";

  const date = new Date(dateTimeValue);

  if (Number.isNaN(date.getTime())) return String(dateTimeValue);

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  }).format(date);
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

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },

  title: {
    margin: 0,
    color: "var(--feedback-strong)",
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "var(--feedback-muted)",
    fontSize: 15,
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    color: "var(--feedback-strong)",
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  chevron: {
    color: "var(--feedback-muted)",
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
    background: "var(--feedback-card)",
    borderRadius: 16,
    border: "1px solid var(--feedback-border)",
    boxShadow: "var(--feedback-shadow)",
    padding: 18,
    display: "flex",
    alignItems: "center",
    gap: 16,
    minWidth: 0,
    boxSizing: "border-box",
    textAlign: "left",
    fontFamily: "inherit",
    color: "inherit",
    transition:
      "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
  },

  statCardActive: {
    borderColor: BRAND.pink,
    boxShadow:
      "0 8px 18px rgba(217,67,104,0.12), 0 0 0 2px rgba(217,67,104,0.08)",
    transform: "translateY(-1px)",
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

  statRed: {
    background: "#FCE2E8",
    color: "#E11D48",
  },

  statTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    color: "var(--feedback-text)",
  },

  statValue: {
    margin: "4px 0 2px",
    fontSize: 28,
    fontWeight: 900,
    color: "var(--feedback-strong)",
  },

  statDesc: {
    margin: 0,
    fontSize: 12,
    color: "var(--feedback-muted)",
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

  successBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    marginBottom: 18,
    borderRadius: 10,
    border: "1px solid #B7E2C9",
    background: "#ECF9F1",
    color: "#08783C",
  },

  successText: {
    flex: 1,
    fontSize: 13,
    fontWeight: 700,
  },

  successClose: {
    border: "none",
    background: "transparent",
    color: "#08783C",
    cursor: "pointer",
    display: "flex",
    padding: 0,
  },

  tableCard: {
    width: "100%",
    background: "var(--feedback-card)",
    borderRadius: 16,
    border: "1px solid var(--feedback-border)",
    boxShadow: "var(--feedback-shadow)",
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
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },

  searchBox: {
    flex: 1,
    maxWidth: 520,
    minWidth: 280,
    height: 48,
    border: "1px solid var(--feedback-border-strong)",
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    background: "var(--feedback-card)",
    boxSizing: "border-box",
    transition:
      "transform 0.16s ease, box-shadow 0.18s ease, border-color 0.18s ease",
  },

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    marginLeft: 12,
    fontSize: 14,
    color: "var(--feedback-text)",
    background: "transparent",
    minWidth: 0,
  },

  ratingSelect: {
    width: 150,
    height: 48,
    border: "1px solid #E2D5D3",
    borderRadius: 7,
    background: "#fff",
    padding: "0 12px",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--feedback-text)",
    outline: "none",
  },

  refreshBtn: {
    height: 48,
    padding: "0 16px",
    border: "1px solid var(--feedback-border-strong)",
    borderRadius: 7,
    background: "var(--feedback-card)",
    color: "var(--feedback-strong)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease",
  },

  dateBtn: {
    width: 210,
    height: 48,
    padding: "0 16px",
    border: "1px solid var(--feedback-border-strong)",
    borderRadius: 7,
    background: "var(--feedback-card)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    color: "var(--feedback-muted)",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease",
  },

  filterPanel: {
    margin: "0 12px 18px",
    padding: 14,
    border: "1px solid var(--feedback-border)",
    borderRadius: 10,
    background: "var(--feedback-table-head)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  filterLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
    color: "var(--feedback-strong)",
  },

  dateInput: {
    height: 38,
    border: "1px solid var(--feedback-border-strong)",
    borderRadius: 7,
    padding: "0 10px",
    color: "var(--feedback-text)",
    background: "var(--feedback-input)",
    outline: "none",
  },

  clearBtn: {
    height: 38,
    border: "1px solid var(--feedback-border-strong)",
    borderRadius: 7,
    background: "var(--feedback-card)",
    color: "var(--feedback-strong)",
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease",
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
    background: "var(--feedback-table-head)",
    borderTop: "1px solid var(--feedback-border)",
    borderBottom: "1px solid var(--feedback-border)",
  },

  th: {
    textAlign: "left",
    padding: "14px 12px",
    color: "var(--feedback-text)",
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  tableRow: {
    borderBottom: "1px solid var(--feedback-border)",
    transition: "background 0.16s ease, box-shadow 0.16s ease",
  },

  numberCell: {
    width: 54,
    padding: "14px 12px",
    color: "var(--feedback-muted)",
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
    textAlign: "center",
  },

  normalCell: {
    padding: "14px 12px",
    fontSize: 13,
    color: "var(--feedback-text)",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    verticalAlign: "middle",
  },

  primaryText: {
    display: "block",
    fontSize: 13,
    color: "var(--feedback-text)",
    fontWeight: 800,
  },

  secondaryText: {
    display: "block",
    marginTop: 4,
    fontSize: 11,
    color: "var(--feedback-muted)",
  },

  ratingNumber: {
    display: "block",
    fontSize: 13,
    color: "var(--feedback-text)",
    fontWeight: 700,
    marginBottom: 3,
  },

  stars: {
    display: "flex",
    gap: 1,
  },

  commentCell: {
    padding: "14px 12px",
    fontSize: 13,
    color: "var(--feedback-text)",
    lineHeight: 1.45,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },


  emptyCell: {
    padding: 28,
    textAlign: "center",
    color: "var(--feedback-muted)",
    fontSize: 14,
    fontWeight: 700,
  },

  loadingContent: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
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
    color: "var(--feedback-text)",
  },

  pages: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },

  pageBtn: {
    width: 34,
    height: 34,
    borderRadius: 7,
    border: "1px solid var(--feedback-border-strong)",
    background: "var(--feedback-card)",
    color: "var(--feedback-text)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease",
  },

  activePage: {
    background: BRAND.pink,
    color: "#fff",
    borderColor: BRAND.pink,
  },

  disabledBtn: {
    opacity: 0.45,
    cursor: "not-allowed",
  },

  ellipsis: {
    width: 24,
    textAlign: "center",
    color: "var(--feedback-muted)",
    fontWeight: 800,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(35, 20, 16, 0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 20,
  },

  modal: {
    width: "min(720px, 100%)",
    maxHeight: "90vh",
    background: "var(--feedback-card)",
    borderRadius: 18,
    border: "1px solid var(--feedback-border)",
    boxShadow: "0 22px 50px rgba(51,26,18,0.22)",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    borderBottom: "1px solid var(--feedback-border)",
    padding: "22px 22px 16px",
    flexShrink: 0,
  },

  modalBody: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "18px 22px 22px",
  },

  modalTitle: {
    margin: 0,
    color: "var(--feedback-strong)",
    fontSize: 24,
    fontWeight: 900,
  },

  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    border: "1px solid var(--feedback-border-strong)",
    background: "var(--feedback-card)",
    color: "var(--feedback-strong)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease",
  },

  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 12,
  },

  personBox: {
    border: "1px solid var(--feedback-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--feedback-card-soft)",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  bigAvatar: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: BRAND.softPink,
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  detailLabel: {
    margin: "0 0 7px",
    color: "var(--feedback-muted)",
    fontSize: 12,
    fontWeight: 900,
  },

  detailName: {
    margin: 0,
    color: "var(--feedback-text)",
    fontSize: 15,
    fontWeight: 900,
  },

  detailSub: {
    margin: "5px 0 0",
    color: "var(--feedback-muted)",
    fontSize: 12,
  },

  ratingBox: {
    border: "1px solid var(--feedback-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--feedback-card-soft)",
    marginBottom: 12,
  },

  ratingLine: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  modalRating: {
    fontSize: 24,
    color: "var(--feedback-strong)",
    fontWeight: 900,
  },

  commentBox: {
    border: "1px solid var(--feedback-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--feedback-card-soft)",
    marginBottom: 12,
  },

  fullComment: {
    margin: 0,
    color: "var(--feedback-text)",
    fontSize: 14,
    lineHeight: 1.55,
    overflowWrap: "anywhere",
  },

  modalInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },

  detailItem: {
    border: "1px solid var(--feedback-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--feedback-card-soft)",
  },

  detailValue: {
    margin: 0,
    color: "var(--feedback-text)",
    fontSize: 14,
    fontWeight: 900,
  },

  modalActions: {
    minHeight: 72,
    padding: "14px 22px",
    borderTop: "1px solid var(--feedback-border)",
    background: "var(--feedback-card)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    flexShrink: 0,
    boxSizing: "border-box",
    boxShadow: "0 -8px 18px rgba(51, 26, 18, 0.06)",
    zIndex: 5,
  },

  modalActionsRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },

  deleteModalBtn: {
    height: 40,
    borderRadius: 9,
    border: "none",
    background: "#F8D8DB",
    color: "#C42435",
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease",
  },

  closeModalBtn: {
    height: 40,
    borderRadius: 9,
    border: "none",
    background: BRAND.pink,
    color: "#fff",
    padding: "0 18px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease",
  },

  disabledModalAction: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
};
