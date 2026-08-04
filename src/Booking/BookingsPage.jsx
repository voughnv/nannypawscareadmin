import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  ClipboardCheck,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import BookingDetailsModal from "./BookingDetailsModal";
import { useConfirmation } from "../context/ConfirmationProvider";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  text: "#2E1B16",
  muted: "#6F625F",
};

const ROWS_PER_PAGE = 6;

const ALLOWED_STATUS_TRANSITIONS = {
  Pending: ["Confirmed", "Rejected"],
  Confirmed: ["Completed"],
  Completed: [],
  Rejected: [],
  "Not Set": ["Pending"],
};

const BOOKING_FIELDS = "*";

export default function BookingsPage() {
  const requestConfirmation = useConfirmation();

  const [bookings, setBookings] = useState([]);
  const [petSitters, setPetSitters] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, dateFrom, dateTo]);

  async function fetchBookings() {
    setLoading(true);
    setError("");

    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from("BOOKING")
        .select(BOOKING_FIELDS)
        .order("booking_id", { ascending: false });

      if (bookingError) throw bookingError;

      const bookingRows = bookingData || [];

      const petIds = getUniqueIds(bookingRows, "pet_id");
      const ownerIds = getUniqueIds(bookingRows, "po_id");

      const [petResult, ownerResult, sitterResult] = await Promise.all([
        petIds.length > 0
          ? supabase
              .from("PET")
              .select("pet_id, pet_name, pet_breed, pet_dob, pet_notes")
              .in("pet_id", petIds)
          : Promise.resolve({ data: [], error: null }),

        ownerIds.length > 0
          ? supabase
              .from("PET_OWNER")
              .select("po_id, po_fname, po_lname")
              .in("po_id", ownerIds)
          : Promise.resolve({ data: [], error: null }),

        supabase
          .from("PET SITTER")
          .select(
            "petsitter_id, ps_fname, ps_lname, ps_username, ps_email"
          )
          .order("ps_fname", { ascending: true })
          .order("ps_lname", { ascending: true }),
      ]);

      if (petResult.error) {
        console.error("Unable to load PET records:", petResult.error);
      }

      if (ownerResult.error) {
        console.error("Unable to load PET_OWNER records:", ownerResult.error);
      }

      if (sitterResult.error) {
        console.error("Unable to load PET SITTER records:", sitterResult.error);
      }

      const petMap = createRecordMap(
        petResult.data || [],
        ["pet_id", "p_id", "id"]
      );

      const ownerMap = createRecordMap(
        ownerResult.data || [],
        ["po_id", "petowner_id", "pet_owner_id", "owner_id", "id"]
      );

      const allPetSitters = sitterResult.data || [];

      setPetSitters(allPetSitters);

      const sitterMap = createRecordMap(
        allPetSitters,
        ["petsitter_id", "ps_id", "pet_sitter_id", "id"]
      );

      const enrichedBookings = bookingRows.map((booking) =>
        enrichBooking(booking, petMap, ownerMap, sitterMap)
      );

      setBookings(enrichedBookings);
    } catch (fetchError) {
      console.error("Unable to load bookings:", fetchError);
      setError(
        fetchError?.message ||
          "Unable to load bookings. Please check your Supabase connection and table policies."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingSitter(booking, nextSitterId) {
    const currentStatus = normalizeStatus(booking.booking_status);

    if (currentStatus !== "Pending") {
      setError(
        "The assigned pet sitter can only be changed while the booking is pending."
      );
      return false;
    }

    const currentSitterKey = normalizeReferenceKey(booking.ps_id);
    const nextSitterKey = normalizeReferenceKey(nextSitterId);

    if (currentSitterKey === nextSitterKey) {
      return true;
    }

    let databaseSitterId = null;
    let nextSitter = null;

    if (nextSitterKey) {
      const parsedSitterId = Number(nextSitterId);

      if (Number.isNaN(parsedSitterId)) {
        setError("The selected pet sitter ID is invalid.");
        return false;
      }

      databaseSitterId = parsedSitterId;

      nextSitter =
        petSitters.find(
          (sitter) =>
            normalizeReferenceKey(sitter.petsitter_id) === nextSitterKey
        ) || null;

      if (!nextSitter) {
        setError(
          "The selected pet sitter could not be found. Refresh the booking page and try again."
        );
        return false;
      }
    }

    const currentSitterName = booking.ps_id
      ? getSitterName(booking.sitterRecord, booking.ps_id)
      : "No assigned sitter";

    const nextSitterName = nextSitter
      ? getSitterName(nextSitter, databaseSitterId)
      : "No assigned sitter";

    const confirmed = await requestConfirmation({
      title: nextSitter
        ? "Change assigned pet sitter?"
        : "Remove assigned pet sitter?",
      message: nextSitter
        ? `Reassign booking ${formatBookingId(
            booking.booking_id
          )} from ${currentSitterName} to ${nextSitterName}?`
        : `Remove ${currentSitterName} from booking ${formatBookingId(
            booking.booking_id
          )}?`,
      confirmText: nextSitter
        ? "Update Assignment"
        : "Remove Assignment",
      variant: "primary",
    });

    if (!confirmed) return false;

    setUpdatingId(booking.booking_id);
    setError("");

    try {
      const { data, error: updateError } = await supabase
        .from("BOOKING")
        .update({ ps_id: databaseSitterId })
        .eq("booking_id", booking.booking_id)
        .select(BOOKING_FIELDS)
        .single();

      if (updateError) throw updateError;

      const updatedBooking = {
        ...booking,
        ...data,
        ps_id: databaseSitterId,
        sitterRecord: nextSitter,
        sitterName: nextSitter
          ? getSitterName(nextSitter, databaseSitterId)
          : "Not assigned",
      };

      setBookings((previous) =>
        previous.map((item) =>
          item.booking_id === booking.booking_id
            ? updatedBooking
            : item
        )
      );

      setSelectedBooking((previous) =>
        previous?.booking_id === booking.booking_id
          ? updatedBooking
          : previous
      );

      return true;
    } catch (updateError) {
      console.error(
        "Unable to update the assigned pet sitter:",
        updateError
      );

      setError(
        updateError?.message ||
          "Unable to update the assigned pet sitter. Please try again."
      );

      return false;
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateBookingStatus(booking, newStatus) {
    const currentStatus = normalizeStatus(booking.booking_status);
    const allowedStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [
      "Pending",
    ];

    if (!allowedStatuses.includes(newStatus)) {
      setError(
        `A ${currentStatus.toLowerCase()} booking cannot be changed to ${newStatus.toLowerCase()}.`
      );
      return;
    }

    setUpdatingId(booking.booking_id);
    setError("");

    try {
      const { data, error: updateError } = await supabase
        .from("BOOKING")
        .update({ booking_status: newStatus })
        .eq("booking_id", booking.booking_id)
        .select(BOOKING_FIELDS)
        .single();

      if (updateError) throw updateError;

      const updatedSitter =
        petSitters.find(
          (sitter) =>
            normalizeReferenceKey(sitter.petsitter_id) ===
            normalizeReferenceKey(data.ps_id)
        ) ||
        booking.sitterRecord ||
        null;

      const updatedBooking = {
        ...booking,
        ...data,
        sitterRecord: updatedSitter,
        sitterName: getSitterName(updatedSitter, data.ps_id),
      };

      setBookings((previous) =>
        previous.map((item) =>
          item.booking_id === booking.booking_id ? updatedBooking : item
        )
      );

      setSelectedBooking((previous) =>
        previous?.booking_id === booking.booking_id
          ? updatedBooking
          : previous
      );

    } catch (updateError) {
      console.error("Unable to update booking:", updateError);
      setError(
        updateError?.message ||
          "Unable to update the booking status. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function approveBooking(booking) {
    await updateBookingStatus(booking, "Confirmed");
  }

  async function rejectBooking(booking) {
    const confirmed = await requestConfirmation({
      title: "Reject booking?",
      message: `Are you sure you want to reject booking ${formatBookingId(
        booking.booking_id
      )}? This status cannot be changed afterward.`,
      confirmText: "Reject Booking",
      variant: "danger",
    });

    if (!confirmed) return;
    await updateBookingStatus(booking, "Rejected");
  }

  async function completeBooking(booking) {
    const confirmed = await requestConfirmation({
      title: "Complete booking?",
      message: `Mark booking ${formatBookingId(
        booking.booking_id
      )} as completed? This status cannot be changed afterward.`,
      confirmText: "Mark as Completed",
      variant: "info",
    });

    if (!confirmed) return;
    await updateBookingStatus(booking, "Completed");
  }

  async function setPendingBooking(booking) {
    await updateBookingStatus(booking, "Pending");
  }

  function clearFilters() {
    setSearch("");
    setStatus("All Status");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  }

  const normalizedBookings = useMemo(() => {
    return bookings.map((booking) => ({
      ...booking,
      normalizedStatus: normalizeStatus(booking.booking_status),
    }));
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return normalizedBookings.filter((booking) => {
      const searchableValues = [
        booking.booking_id,
        formatBookingId(booking.booking_id),
        booking.service_type,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const matchesSearch =
        keyword.length === 0 ||
        searchableValues.some((value) => value.includes(keyword));

      const matchesStatus =
        status === "All Status" || booking.normalizedStatus === status;

      const bookingStartDate = getDateOnlyValue(
        booking.booking_date
      );

      const bookingEndDate =
        getDateOnlyValue(booking.end_date) ||
        bookingStartDate;

      const matchesDateFrom =
        !dateFrom ||
        (bookingStartDate &&
          bookingStartDate >= dateFrom);

      const matchesDateTo =
        !dateTo ||
        (bookingEndDate &&
          bookingEndDate <= dateTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [normalizedBookings, search, status, dateFrom, dateTo]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / ROWS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredBookings.slice(start, start + ROWS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: normalizedBookings.filter(
        (booking) => booking.normalizedStatus === "Pending"
      ).length,
      confirmed: normalizedBookings.filter(
        (booking) => booking.normalizedStatus === "Confirmed"
      ).length,
      completed: normalizedBookings.filter(
        (booking) => booking.normalizedStatus === "Completed"
      ).length,
      rejected: normalizedBookings.filter(
        (booking) => booking.normalizedStatus === "Rejected"
      ).length,
    };
  }, [bookings, normalizedBookings]);

  const firstVisible =
    filteredBookings.length === 0
      ? 0
      : (currentPage - 1) * ROWS_PER_PAGE + 1;

  const lastVisible = Math.min(
    currentPage * ROWS_PER_PAGE,
    filteredBookings.length
  );

  return (
    <>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Bookings</h1>
            <p style={styles.subtitle}>
              Manage and monitor all pet sitting bookings.
            </p>
          </div>

          <div style={styles.breadcrumb}>
            <span>Dashboard</span>
            <span style={styles.chevron}>›</span>
            <span>Bookings</span>
          </div>
        </header>

        <section style={styles.statsGrid}>
          <StatCard
            icon={<CalendarDays size={30} />}
            iconStyle={styles.statPink}
            title="Total Bookings"
            value={stats.total}
            desc="All booking records"
          />
          <StatCard
            icon={<Clock3 size={30} />}
            iconStyle={styles.statOrange}
            title="Pending"
            value={stats.pending}
            desc="Awaiting confirmation"
          />
          <StatCard
            icon={<CheckCircle2 size={32} />}
            iconStyle={styles.statGreen}
            title="Approved"
            value={stats.confirmed}
            desc="Approved bookings"
          />
          <StatCard
            icon={<ClipboardCheck size={30} />}
            iconStyle={styles.statBlue}
            title="Completed"
            value={stats.completed}
            desc="Completed bookings"
          />
          <StatCard
            icon={<XCircle size={30} />}
            iconStyle={styles.statRed}
            title="Rejected"
            value={stats.rejected}
            desc="Rejected bookings"
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

        <section style={styles.tableCard}>
          <div style={styles.filters}>
            <div style={styles.leftFilters}>
              <div style={styles.searchBox}>
                <Search size={22} color="#5E4B45" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search booking ID or service"
                  style={styles.searchInput}
                />
              </div>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                style={styles.select}
              >
                <option>All Status</option>
                <option>Pending</option>
                <option value="Confirmed">Approved</option>
                <option>Completed</option>
                <option>Rejected</option>
              </select>
            </div>

            <div style={styles.filterActions}>
              <button
                style={styles.refreshBtn}
                onClick={fetchBookings}
                disabled={loading}
                title="Refresh bookings"
              >
                <RefreshCw size={19} />
                <span>{loading ? "Loading..." : "Refresh"}</span>
              </button>

              <button
                style={styles.dateBtn}
                onClick={() => setShowDateFilter((previous) => !previous)}
              >
                <Calendar size={20} />
                <span>
                  {showDateFilter ? "Hide date range" : "Select date range"}
                </span>
              </button>
            </div>
          </div>

          {showDateFilter && (
            <div style={styles.datePanel}>
              <label style={styles.dateLabel}>
                From
                <input
                  type="date"
                  value={dateFrom}
                  min="0001-01-01"
                  max={dateTo || "9999-12-31"}
                  onInput={(event) => {
                    const sanitizedValue = sanitizeDateInput(
                      event.currentTarget.value
                    );

                    if (
                      event.currentTarget.value !== sanitizedValue
                    ) {
                      event.currentTarget.value = sanitizedValue;
                    }
                  }}
                  onChange={(event) => {
                    const nextFrom = sanitizeDateInput(
                      event.target.value
                    );

                    setDateFrom(nextFrom);

                    if (
                      dateTo &&
                      nextFrom &&
                      nextFrom > dateTo
                    ) {
                      setDateTo(nextFrom);
                    }
                  }}
                  style={styles.dateInput}
                />
              </label>

              <label style={styles.dateLabel}>
                To
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || "0001-01-01"}
                  max="9999-12-31"
                  onInput={(event) => {
                    const sanitizedValue = sanitizeDateInput(
                      event.currentTarget.value
                    );

                    if (
                      event.currentTarget.value !== sanitizedValue
                    ) {
                      event.currentTarget.value = sanitizedValue;
                    }
                  }}
                  onChange={(event) => {
                    const nextTo = sanitizeDateInput(
                      event.target.value
                    );

                    setDateTo(nextTo);
                  }}
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
                  <Th>Booking Date</Th>
                  <Th>End Date</Th>
                  <Th>Start Time</Th>
                  <Th>End Time</Th>
                  <Th>Service Type</Th>
                  <Th>Status</Th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={styles.emptyCell}>
                      <div style={styles.loadingContent}>
                        <RefreshCw size={22} />
                        <span>Loading booking records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedBookings.length > 0 ? (
                  paginatedBookings.map((booking, index) => (
                    <tr
                      key={booking.booking_id}
                      style={{ ...styles.tableRow, cursor: "pointer" }}
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <td style={styles.numberCell}>
                        {(currentPage - 1) * ROWS_PER_PAGE + index + 1}
                      </td>

                      <td style={styles.normalCell}>
                        {formatDate(booking.booking_date)}
                      </td>

                      <td style={styles.normalCell}>
                        {formatDate(booking.end_date)}
                      </td>

                      <td style={styles.normalCell}>
                        {formatTime(
                          booking.start_time || booking.booking_time
                        )}
                      </td>

                      <td style={styles.normalCell}>
                        {formatTime(booking.end_time)}
                      </td>

                      <td style={styles.normalCell}>
                        <strong style={styles.primaryText}>
                          {booking.service_type || "Not specified"}
                        </strong>
                      </td>

                      <td style={styles.normalCell}>
                        <StatusBadge status={booking.booking_status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={styles.emptyCell}>
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <p style={styles.pageText}>
              Showing {firstVisible} to {lastVisible} of{" "}
              {filteredBookings.length} bookings
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
                <ChevronLeft size={18} />
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
                  setCurrentPage((page) => Math.min(page + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

      {selectedBooking && (
        <BookingDetailsModal
          key={`${selectedBooking.booking_id}-${normalizeStatus(
            selectedBooking.booking_status
          )}`}
          booking={selectedBooking}
          petSitters={
            normalizeStatus(selectedBooking.booking_status) === "Pending"
              ? petSitters
              : []
          }
          allowSitterReassignment={
            normalizeStatus(selectedBooking.booking_status) === "Pending"
          }
          updating={updatingId === selectedBooking.booking_id}
          onClose={() => setSelectedBooking(null)}
          onChangeSitter={
            normalizeStatus(selectedBooking.booking_status) === "Pending"
              ? updateBookingSitter
              : undefined
          }
          onPending={setPendingBooking}
          onApprove={approveBooking}
          onReject={rejectBooking}
          onComplete={completeBooking}
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

function StatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(status);

  const badgeStyle =
    normalizedStatus === "Pending"
      ? styles.statusPending
      : normalizedStatus === "Confirmed"
      ? styles.statusConfirmed
      : normalizedStatus === "Completed"
      ? styles.statusCompleted
      : normalizedStatus === "Rejected"
      ? styles.statusRejected
      : styles.statusDefault;

  const displayStatus =
    normalizedStatus === "Confirmed" ? "Approved" : normalizedStatus;

  return (
    <span style={{ ...styles.badge, ...badgeStyle }}>
      {displayStatus || "Not set"}
    </span>
  );
}

function normalizeStatus(status) {
  if (!status) return "Not Set";

  const cleaned = String(status).trim().toLowerCase();

  if (cleaned === "pending") return "Pending";
  if (cleaned === "confirmed" || cleaned === "approved") return "Confirmed";
  if (cleaned === "completed" || cleaned === "complete") return "Completed";
  if (cleaned === "rejected" || cleaned === "cancelled" || cleaned === "canceled")
    return "Rejected";

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getUniqueIds(records, field) {
  return [
    ...new Set(
      records
        .map((record) => record?.[field])
        .filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        )
    ),
  ];
}

function normalizeReferenceKey(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "";
  }

  const text = String(value).trim();
  const numericValue = Number(text);

  return Number.isNaN(numericValue) ? text : String(numericValue);
}

function createRecordMap(records, possibleIdFields) {
  const map = new Map();

  records.forEach((record) => {
    const id = possibleIdFields
      .map((field) => record?.[field])
      .find(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
      );

    const key = normalizeReferenceKey(id);

    if (key) {
      map.set(key, record);
    }
  });

  return map;
}

function enrichBooking(booking, petMap, ownerMap, sitterMap) {
  const pet =
    petMap.get(normalizeReferenceKey(booking.pet_id)) || null;

  const owner =
    ownerMap.get(normalizeReferenceKey(booking.po_id)) || null;

  const sitter =
    sitterMap.get(normalizeReferenceKey(booking.ps_id)) || null;

  return {
    ...booking,
    petRecord: pet,
    ownerRecord: owner,
    sitterRecord: sitter,
    petName: getPetName(pet, booking.pet_id),
    ownerName: getOwnerName(owner, booking.po_id),
    sitterName: getSitterName(sitter, booking.ps_id),
  };
}

function getPetName(pet, fallbackId) {
  if (!pet) {
    return fallbackId ? `Pet ${fallbackId}` : "Not assigned";
  }

  return (
    pet.pet_name ||
    pet.p_name ||
    pet.name ||
    pet.petName ||
    (fallbackId ? `Pet ${fallbackId}` : "Name not set")
  );
}

function getOwnerName(owner, fallbackId) {
  if (!owner) {
    return fallbackId ? `Pet Owner ${fallbackId}` : "Not assigned";
  }

  const fullName = `${owner.po_fname || owner.first_name || ""} ${
    owner.po_lname || owner.last_name || ""
  }`.trim();

  return (
    fullName ||
    owner.po_username ||
    owner.username ||
    owner.full_name ||
    (fallbackId ? `Pet Owner ${fallbackId}` : "Name not set")
  );
}

function getSitterName(sitter, fallbackId) {
  if (!sitter) {
    return fallbackId ? `Pet Sitter ${fallbackId}` : "Not assigned";
  }

  const fullName = `${sitter.ps_fname || sitter.first_name || ""} ${
    sitter.ps_lname || sitter.last_name || ""
  }`.trim();

  return (
    fullName ||
    sitter.ps_username ||
    sitter.username ||
    sitter.full_name ||
    (fallbackId ? `Pet Sitter ${fallbackId}` : "Name not set")
  );
}

function formatBookingId(id) {
  if (id === null || id === undefined || id === "") return "N/A";
  return `BK-${String(id).padStart(4, "0")}`;
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

  return normalized > "9999-12-31"
    ? "9999-12-31"
    : normalized;
}

function getDateOnlyValue(dateValue) {
  if (!dateValue) return "";

  const text = String(dateValue).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) return text.slice(0, 10);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDate(dateValue) {
  const dateOnly = getDateOnlyValue(dateValue);

  if (!dateOnly) return "Not set";

  const date = new Date(`${dateOnly}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateOnly;

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatTime(timeValue) {
  if (!timeValue) return "Not set";

  const parts = String(timeValue).split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return String(timeValue);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
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
    color: "#4D80DC",
  },

  statRed: {
    background: "#F8D8DB",
    color: "#DF101D",
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
    padding: "0 12px 22px",
    gap: 16,
    flexWrap: "wrap",
  },

  leftFilters: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flex: 1,
    minWidth: 430,
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

  select: {
    width: 180,
    height: 48,
    border: "1px solid #E2D5D3",
    borderRadius: 7,
    background: "#fff",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 700,
    color: BRAND.text,
    outline: "none",
  },

  filterActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  refreshBtn: {
    height: 48,
    border: "1px solid #E2D5D3",
    borderRadius: 7,
    background: "#fff",
    color: BRAND.brown,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  dateBtn: {
    width: 210,
    height: 48,
    border: "1px solid #E2D5D3",
    borderRadius: 7,
    background: "#fff",
    color: "#6C5B56",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 16px",
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  datePanel: {
    margin: "0 12px 18px",
    padding: 14,
    border: "1px solid #EEE2DF",
    borderRadius: 10,
    background: "#FFFBFA",
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
    minWidth: 1020,
    borderCollapse: "collapse",
  },

  tableHeadRow: {
    background: "#FFFBFA",
    borderTop: "1px solid #EEE2DF",
    borderBottom: "1px solid #E7DAD7",
  },

  th: {
    textAlign: "left",
    padding: "14px",
    color: "#16100E",
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  tableRow: {
    borderBottom: "1px solid #E7DAD7",
  },

  numberCell: {
    padding: 14,
    color: BRAND.muted,
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
    textAlign: "center",
  },

  normalCell: {
    padding: 14,
    fontSize: 13,
    color: "#1F1714",
    whiteSpace: "nowrap",
  },

  primaryText: {
    display: "block",
    fontSize: 13,
    color: "#1B1412",
    fontWeight: 800,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 78,
    height: 26,
    padding: "0 9px",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 800,
    boxSizing: "border-box",
  },

  statusPending: {
    background: "#FDEADB",
    color: "#F2650C",
  },

  statusConfirmed: {
    background: "#DDF4E7",
    color: "#0B8F45",
  },

  statusCompleted: {
    background: "#E6EDFF",
    color: "#0C4BB3",
  },

  statusRejected: {
    background: "#F8D8DB",
    color: "#DF101D",
  },

  statusDefault: {
    background: "#EEE9E7",
    color: "#645854",
  },

  emptyCell: {
    padding: 32,
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

};