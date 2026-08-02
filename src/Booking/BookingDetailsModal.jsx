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

  const startTime = booking.start_time || booking.booking_time;
  const paymentProof = String(booking.payment_proof || "").trim();

  return (
    <div
      style={styles.modalOverlay}
      onClick={updating ? undefined : onClose}
    >
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
            <p style={styles.modalReference}>
              {formatBookingId(booking.booking_id)}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close booking details"
            style={{
              ...styles.closeBtn,
              ...(updating ? styles.disabledButton : {}),
            }}
            disabled={updating}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <h3 style={styles.sectionTitle}>Booking Information</h3>

        <div style={styles.modalGrid}>
          <DetailItem
            label="Status"
            custom={<StatusBadge status={booking.booking_status} />}
          />

          <DetailItem
            label="Service Type"
            value={booking.service_type || "Not specified"}
          />

          <DetailItem
            label="Start Date"
            value={formatDate(booking.start_date)}
          />

          <DetailItem
            label="End Date"
            value={formatDate(booking.end_date)}
          />

          <DetailItem
            label="Start Time"
            value={formatTime(startTime)}
          />

          <DetailItem
            label="End Time"
            value={formatTime(booking.end_time)}
          />
        </div>

        <h3 style={styles.sectionTitle}>Pet and Assigned Users</h3>

        <div style={styles.modalGrid}>
          <DetailItem
            label="Pet Owner"
            value={getOwnerName(booking)}
            secondary={formatReference("Owner ID", booking.po_id)}
          />

          <DetailItem
            label="Pet Sitter"
            value={getSitterName(booking)}
            secondary={
              booking.ps_id
                ? formatReference("Sitter ID", booking.ps_id)
                : "No sitter assigned"
            }
          />

          <DetailItem
            label="Pet"
            value={getPetName(booking)}
            secondary={getPetSecondaryDetails(booking)}
            fullWidth
          />
        </div>

        <h3 style={styles.sectionTitle}>Payment Information</h3>

        <div style={styles.modalGrid}>
          <DetailItem
            label="Payment Method"
            value={booking.payment_method || "Not specified"}
          />

          <DetailItem
            label="Amount"
            value={formatAmount(booking.amount)}
          />

          <DetailItem
            label="Proof of Payment"
            custom={
              <PaymentProof
                value={paymentProof}
                bookingId={booking.booking_id}
              />
            }
            fullWidth
          />
        </div>

        <h3 style={styles.sectionTitle}>Additional Information</h3>

        <div style={styles.modalGrid}>
          <DetailItem
            label="Instructions"
            value={
              booking.instructions ||
              "No additional instructions provided."
            }
            fullWidth
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

function DetailItem({
  label,
  value,
  custom,
  secondary = "",
  fullWidth = false,
}) {
  return (
    <div
      style={{
        ...styles.detailItem,
        ...(fullWidth ? styles.fullWidthItem : {}),
      }}
    >
      <p style={styles.detailLabel}>{label}</p>

      {custom || (
        <>
          <h4 style={styles.detailValue}>{value}</h4>
          {secondary && (
            <p style={styles.detailSecondary}>{secondary}</p>
          )}
        </>
      )}
    </div>
  );
}

function PaymentProof({ value, bookingId }) {
  if (!value) {
    return <h4 style={styles.detailValue}>Not uploaded</h4>;
  }

  const isUrl =
    value.startsWith("http://") ||
    value.startsWith("https://");

  if (!isUrl) {
    return (
      <div style={styles.proofTextBox}>
        <span style={styles.proofText}>{value}</span>
      </div>
    );
  }

  return (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      style={styles.proofLink}
    >
      <img
        src={value}
        alt={`Payment proof for ${formatBookingId(bookingId)}`}
        style={styles.proofImage}
      />
      <span>Open proof of payment</span>
    </a>
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
  if (cleaned === "confirmed" || cleaned === "approved") {
    return "Confirmed";
  }
  if (cleaned === "completed" || cleaned === "complete") {
    return "Completed";
  }
  if (
    cleaned === "rejected" ||
    cleaned === "cancelled" ||
    cleaned === "canceled"
  ) {
    return "Rejected";
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getPetName(booking) {
  const pet = booking.petRecord || {};

  return (
    pet.pet_name ||
    pet.p_name ||
    pet.name ||
    booking.petName ||
    (booking.pet_id ? `Pet ${booking.pet_id}` : "Not assigned")
  );
}

function getPetSecondaryDetails(booking) {
  const pet = booking.petRecord || {};
  const details = [];

  if (
    booking.pet_id !== null &&
    booking.pet_id !== undefined &&
    booking.pet_id !== ""
  ) {
    details.push(`Pet ID: ${booking.pet_id}`);
  }

  if (pet.pet_breed) {
    details.push(`Breed: ${pet.pet_breed}`);
  }

  return details.length > 0 ? details.join(" • ") : "Pet details not available";
}

function getOwnerName(booking) {
  const owner = booking.ownerRecord || {};

  const fullName = `${owner.po_fname || owner.first_name || ""} ${
    owner.po_lname || owner.last_name || ""
  }`.trim();

  return (
    booking.ownerName ||
    fullName ||
    owner.po_username ||
    owner.username ||
    (booking.po_id
      ? `Pet Owner ${booking.po_id}`
      : "Not assigned")
  );
}

function getSitterName(booking) {
  const sitter = booking.sitterRecord || {};

  const fullName = `${sitter.ps_fname || sitter.first_name || ""} ${
    sitter.ps_lname || sitter.last_name || ""
  }`.trim();

  return (
    booking.sitterName ||
    fullName ||
    sitter.ps_username ||
    sitter.username ||
    (booking.ps_id
      ? `Pet Sitter ${booking.ps_id}`
      : "Not assigned")
  );
}

function formatReference(label, value) {
  if (value === null || value === undefined || value === "") {
    return `${label}: Not set`;
  }

  return `${label}: ${value}`;
}

function formatBookingId(id) {
  if (id === null || id === undefined || id === "") return "N/A";
  return `BK-${String(id).padStart(4, "0")}`;
}

function formatDate(dateValue) {
  if (!dateValue) return "Not set";

  const text = String(dateValue);
  const date = text.includes("T")
    ? new Date(text)
    : new Date(`${text}T00:00:00`);

  if (Number.isNaN(date.getTime())) return text;

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


function formatAmount(amount) {
  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "Not specified";
  }

  const number = Number(amount);

  if (Number.isNaN(number)) {
    return String(amount);
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(number);
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
    width: "min(820px, 100%)",
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

  modalReference: {
    margin: "5px 0 0",
    color: BRAND.muted,
    fontSize: 13,
    fontWeight: 800,
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

  sectionTitle: {
    margin: "19px 0 10px",
    color: BRAND.brown,
    fontSize: 14,
    fontWeight: 900,
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

  fullWidthItem: {
    gridColumn: "1 / -1",
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
    overflowWrap: "anywhere",
  },

  detailSecondary: {
    margin: "6px 0 0",
    color: BRAND.muted,
    fontSize: 11,
    fontWeight: 700,
  },

  proofLink: {
    display: "block",
    color: BRAND.pink,
    fontSize: 12,
    fontWeight: 900,
    textDecoration: "none",
  },

  proofImage: {
    display: "block",
    width: "100%",
    maxHeight: 300,
    marginBottom: 9,
    borderRadius: 10,
    border: "1px solid #E6D9D7",
    background: "#FFF8F8",
    objectFit: "contain",
  },

  proofTextBox: {
    padding: "10px 12px",
    borderRadius: 8,
    background: "#FFF5F7",
    border: "1px solid #F1CBD5",
  },

  proofText: {
    color: BRAND.text,
    fontSize: 12,
    fontWeight: 700,
    overflowWrap: "anywhere",
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