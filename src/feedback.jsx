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

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  softPink: "#FDEBED",
  sidebar: "#FDEEEF",
  border: "#EEE2E0",
  text: "#2E1B16",
  muted: "#6F625F",
};

const ROWS_PER_PAGE = 6;

export default function FeedbackPage() {
  const requestConfirmation = useConfirmation();

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

      const matchesRating =
        ratingFilter === "All Ratings" ||
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
    <>
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
          />

          <StatCard
            icon={<Star size={32} />}
            iconStyle={styles.statGreen}
            title="Average Rating"
            value={stats.average}
            desc="Out of 5"
          />

          <StatCard
            icon={<ThumbsUp size={30} />}
            iconStyle={styles.statOrange}
            title="Positive Feedbacks"
            value={stats.positive}
            desc={`${stats.positivePercent}% of rated feedbacks`}
          />

          <StatCard
            icon={<ThumbsDown size={30} />}
            iconStyle={styles.statBlue}
            title="Negative Feedbacks"
            value={stats.negative}
            desc={`${stats.negativePercent}% of rated feedbacks`}
          />
        </section>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={20} />
            <span style={styles.errorText}>{error}</span>
            <button style={styles.errorClose} onClick={() => setError("")}>
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            <CheckCircle2 size={20} />
            <span style={styles.successText}>{success}</span>
            <button
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
              <div style={styles.searchBox}>
                <Search size={20} color="#5E4B45" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search owner, sitter, comment, rating, or ID..."
                  style={styles.searchInput}
                />
              </div>

              <select
                value={ratingFilter}
                onChange={(event) => setRatingFilter(event.target.value)}
                style={styles.ratingSelect}
              >
                <option>All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>

            </div>

            <div style={styles.filterActions}>
              <button
                style={styles.refreshBtn}
                onClick={fetchFeedbackData}
                disabled={loading}
              >
                <RefreshCw size={18} />
                <span>{loading ? "Loading..." : "Refresh"}</span>
              </button>

              <button
                style={styles.dateBtn}
                onClick={() =>
                  setShowDateFilter((previous) => !previous)
                }
              >
                <Calendar size={18} />
                <span>
                  {showDateFilter ? "Hide date range" : "Select date range"}
                </span>
              </button>
            </div>
          </div>

          {showDateFilter && (
            <div style={styles.filterPanel}>
              <label style={styles.filterLabel}>
                From
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  style={styles.dateInput}
                />
              </label>

              <label style={styles.filterLabel}>
                To
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) => setDateTo(event.target.value)}
                  style={styles.dateInput}
                />
              </label>

              <button style={styles.clearBtn} onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
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
                      style={{ ...styles.tableRow, cursor: "pointer" }}
                      onClick={() => setSelectedFeedback(item)}
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
              <button
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
                  <button
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

              <button
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
    </>
  );
}

function StatCard({ icon, iconStyle, title, value, desc }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, ...iconStyle }}>{icon}</div>

      <div>
        <p style={styles.statTitle}>{title}</p>
        <h2 style={styles.statValue}>{value}</h2>
        <p style={styles.statDesc}>{desc}</p>
      </div>
    </div>
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

          <button
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
          <button
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
            <button
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

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 18,
    marginBottom: 24,
  },

  statCard: {
    height: 118,
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #EEE2DF",
    boxShadow: "0 8px 16px rgba(51,26,18,0.07)",
    padding: 18,
    display: "flex",
    alignItems: "center",
    gap: 16,
    minWidth: 0,
    boxSizing: "border-box",
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
    color: "#236EEA",
  },

  statTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    color: "#1F1714",
  },

  statValue: {
    margin: "4px 0 2px",
    fontSize: 28,
    fontWeight: 900,
    color: BRAND.brown,
  },

  statDesc: {
    margin: 0,
    fontSize: 12,
    color: "#6D5F5B",
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
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #EEE2DF",
    boxShadow: "0 8px 18px rgba(51,26,18,0.07)",
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
    gap: 12,
    flex: 1,
    minWidth: 460,
  },

  filterActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  searchBox: {
    flex: 1,
    maxWidth: 460,
    minWidth: 260,
    height: 48,
    border: "1px solid #E2D5D3",
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    background: "#fff",
    boxSizing: "border-box",
  },

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    marginLeft: 12,
    fontSize: 14,
    color: BRAND.text,
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
    color: BRAND.text,
    outline: "none",
  },

  refreshBtn: {
    height: 48,
    padding: "0 14px",
    border: "1px solid #E2D5D3",
    borderRadius: 7,
    background: "#fff",
    color: BRAND.brown,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },

  dateBtn: {
    height: 48,
    padding: "0 16px",
    border: "1px solid #E2D5D3",
    borderRadius: 7,
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    color: BRAND.text,
    whiteSpace: "nowrap",
    cursor: "pointer",
  },

  filterPanel: {
    margin: "0 12px 16px",
    padding: 14,
    border: "1px solid #EEE2DF",
    borderRadius: 10,
    background: "#FFFBFA",
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
    color: BRAND.brown,
  },

  dateInput: {
    height: 38,
    border: "1px solid #E2D5D3",
    borderRadius: 7,
    padding: "0 10px",
    color: BRAND.text,
    outline: "none",
  },

  clearBtn: {
    height: 38,
    border: "1px solid #E2D5D3",
    borderRadius: 7,
    background: "#fff",
    color: BRAND.brown,
    padding: "0 14px",
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
    minWidth: 1040,
    borderCollapse: "collapse",
  },

  tableHeadRow: {
    background: "#FFFBFA",
    borderTop: "1px solid #EEE2DF",
    borderBottom: "1px solid #E7DAD7",
  },

  th: {
    textAlign: "left",
    padding: "14px 12px",
    color: "#16100E",
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  tableRow: {
    borderBottom: "1px solid #E7DAD7",
  },

  numberCell: {
    width: 54,
    padding: "14px 12px",
    color: BRAND.muted,
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
    textAlign: "center",
  },

  normalCell: {
    padding: "14px 12px",
    fontSize: 13,
    color: "#1F1714",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },

  primaryText: {
    display: "block",
    fontSize: 13,
    color: "#1B1412",
    fontWeight: 800,
  },

  secondaryText: {
    display: "block",
    marginTop: 4,
    fontSize: 11,
    color: "#645854",
  },

  ratingNumber: {
    display: "block",
    fontSize: 13,
    color: "#1B1412",
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
    color: "#1F1714",
    lineHeight: 1.45,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },


  emptyCell: {
    padding: 28,
    textAlign: "center",
    color: BRAND.muted,
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
    color: "#1F1714",
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
    border: "1px solid #E6D9D7",
    background: "#fff",
    color: "#1F1714",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
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
    color: BRAND.muted,
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
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #EEE2DF",
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
    borderBottom: "1px solid #EEE2DF",
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
    color: BRAND.brown,
    fontSize: 24,
    fontWeight: 900,
  },

  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    border: "1px solid #E6D9D7",
    background: "#fff",
    color: BRAND.brown,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 12,
  },

  personBox: {
    border: "1px solid #EEE2DF",
    borderRadius: 12,
    padding: 14,
    background: "#FFFCFB",
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
    color: "#6D5F5B",
    fontSize: 12,
    fontWeight: 900,
  },

  detailName: {
    margin: 0,
    color: BRAND.text,
    fontSize: 15,
    fontWeight: 900,
  },

  detailSub: {
    margin: "5px 0 0",
    color: "#6D5F5B",
    fontSize: 12,
  },

  ratingBox: {
    border: "1px solid #EEE2DF",
    borderRadius: 12,
    padding: 14,
    background: "#FFFCFB",
    marginBottom: 12,
  },

  ratingLine: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  modalRating: {
    fontSize: 24,
    color: BRAND.brown,
    fontWeight: 900,
  },

  commentBox: {
    border: "1px solid #EEE2DF",
    borderRadius: 12,
    padding: 14,
    background: "#FFFCFB",
    marginBottom: 12,
  },

  fullComment: {
    margin: 0,
    color: BRAND.text,
    fontSize: 14,
    lineHeight: 1.55,
    overflowWrap: "anywhere",
  },

  modalInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    gap: 12,
  },

  detailItem: {
    border: "1px solid #EEE2DF",
    borderRadius: 12,
    padding: 14,
    background: "#FFFCFB",
  },

  detailValue: {
    margin: 0,
    color: BRAND.text,
    fontSize: 14,
    fontWeight: 900,
  },

  modalActions: {
    minHeight: 72,
    padding: "14px 22px",
    borderTop: "1px solid #EEE2DF",
    background: "#FFFFFF",
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
  },

  disabledModalAction: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
};