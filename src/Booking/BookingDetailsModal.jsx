import { X } from "lucide-react";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  text: "#2E1B16",
  muted: "#6F625F",
};

export default function BookingDetailsModal({
  booking,
  updating,
  onClose,
  onPending,
  onApprove,
  onReject,
  onComplete,
}) {
  if (!booking) return null;

  const normalizedStatus = normalizeStatus(booking.booking_status);
  const isPending = normalizedStatus === "Pending";
  const isConfirmed = normalizedStatus === "Confirmed";
  const isCompleted = normalizedStatus === "Completed";
  const isRejected = normalizedStatus === "Rejected";
  const hasUnknownStatus =
    !isPending && !isConfirmed && !isCompleted && !isRejected;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-details-title"
        style={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <div>
            <h2 id="booking-details-title" style={styles.modalTitle}>
              Booking Details
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close booking details"
            style={styles.closeBtn}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div style={styles.modalGrid}>
          <DetailItem
            label="Booking ID"
            value={formatBookingId(booking.booking_id)}
          />
          <DetailItem
            label="Status"
            custom={<StatusBadge status={booking.booking_status} />}
          />
          <DetailItem
            label="Booking Date"
            value={formatDate(booking.booking_date)}
          />
          <DetailItem
            label="Booking Time"
            value={formatTime(booking.booking_time)}
          />
          <DetailItem
            label="Service Type"
            value={booking.service_type || "Not specified"}
          />
          <DetailItem
            label="Date Created"
            value={formatDateTime(booking.created_at)}
          />
          <DetailItem
            label="Start Date"
            value={formatDate(booking.start_date)}
          />
          <DetailItem
            label="End Date"
            value={formatDate(booking.end_date)}
          />
        </div>

        {(isCompleted || isRejected) && (
          <div style={styles.readOnlyNotice}>
            {isCompleted
              ? "This booking has been completed and can no longer be changed."
              : "This booking has been rejected and can no longer be changed."}
          </div>
        )}

        {(isPending || isConfirmed || hasUnknownStatus) && (
          <div style={styles.modalActions}>
            {hasUnknownStatus && (
              <button
                type="button"
                style={{
                  ...styles.actionButton,
                  ...styles.pendingButton,
                  ...(updating ? styles.disabledButton : {}),
                }}
                disabled={updating}
                onClick={() => onPending(booking)}
              >
                {updating ? "Updating..." : "Set Pending"}
              </button>
            )}

            {isPending && (
              <>
                <button
                  type="button"
                  style={{
                    ...styles.actionButton,
                    ...styles.rejectButton,
                    ...(updating ? styles.disabledButton : {}),
                  }}
                  disabled={updating}
                  onClick={() => onReject(booking)}
                >
                  Reject
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.actionButton,
                    ...styles.confirmButton,
                    ...(updating ? styles.disabledButton : {}),
                  }}
                  disabled={updating}
                  onClick={() => onApprove(booking)}
                >
                  {updating ? "Updating..." : "Confirm"}
                </button>
              </>
            )}

            {isConfirmed && (
              <button
                type="button"
                style={{
                  ...styles.actionButton,
                  ...styles.completeButton,
                  ...(updating ? styles.disabledButton : {}),
                }}
                disabled={updating}
                onClick={() => onComplete(booking)}
              >
                {updating ? "Updating..." : "Mark as Completed"}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function DetailItem({ label, value, custom }) {
  return (
    <div style={styles.detailItem}>
      <p style={styles.detailLabel}>{label}</p>
      {custom || <h4 style={styles.detailValue}>{value}</h4>}
    </div>
  );
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

  return (
    <span style={{ ...styles.badge, ...badgeStyle }}>
      {normalizedStatus || "Not set"}
    </span>
  );
}

function normalizeStatus(status) {
  if (!status) return "Not Set";

  const cleaned = String(status).trim().toLowerCase();

  if (cleaned === "pending") return "Pending";
  if (cleaned === "confirmed" || cleaned === "approved") return "Confirmed";
  if (cleaned === "completed" || cleaned === "complete") return "Completed";
  if (
    cleaned === "rejected" ||
    cleaned === "cancelled" ||
    cleaned === "canceled"
  ) {
    return "Rejected";
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function formatBookingId(id) {
  if (id === null || id === undefined || id === "") return "N/A";
  return `BK-${String(id).padStart(4, "0")}`;
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

function formatTime(timeValue) {
  if (!timeValue) return "Not set";

  const parts = String(timeValue).split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return String(timeValue);
  }

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

const styles = {
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
    width: "min(760px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #EEE2DF",
    boxShadow: "0 22px 50px rgba(51,26,18,0.22)",
    padding: 22,
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    borderBottom: "1px solid #EEE2DF",
    paddingBottom: 16,
    marginBottom: 18,
  },

  modalTitle: {
    margin: 0,
    color: BRAND.brown,
    fontSize: 24,
    fontWeight: 900,
  },

  closeBtn: {
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
  },

  detailItem: {
    border: "1px solid #EEE2DF",
    borderRadius: 12,
    padding: 14,
    background: "#FFFCFB",
    minHeight: 76,
    boxSizing: "border-box",
  },

  detailLabel: {
    margin: "0 0 7px",
    fontSize: 12,
    fontWeight: 900,
    color: BRAND.muted,
  },

  detailValue: {
    margin: 0,
    fontSize: 14,
    fontWeight: 900,
    color: BRAND.text,
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

  readOnlyNotice: {
    marginTop: 18,
    padding: "12px 14px",
    border: "1px solid #E6D9D7",
    borderRadius: 10,
    background: "#F8F5F4",
    color: BRAND.muted,
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
  },

  modalActions: {
    marginTop: 18,
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },

  actionButton: {
    height: 40,
    borderRadius: 9,
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },

  pendingButton: {
    border: "1px solid #E6D9D7",
    background: "#fff",
    color: BRAND.brown,
  },

  rejectButton: {
    border: "none",
    background: "#F8D8DB",
    color: "#DF101D",
  },

  completeButton: {
    border: "none",
    background: "#E6EDFF",
    color: "#0C4BB3",
  },

  confirmButton: {
    border: "none",
    background: BRAND.pink,
    color: "#fff",
    padding: "0 16px",
  },

  disabledButton: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
};