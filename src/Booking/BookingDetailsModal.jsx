import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  text: "#2E1B16",
  muted: "#6F625F",
};

// Set VITE_PAYMENT_PROOF_BUCKET in .env when your actual bucket uses
// a different name. The common fallback names below are also checked.
const PAYMENT_PROOF_BUCKET =
  import.meta.env.VITE_PAYMENT_PROOF_BUCKET || "PAYMENT_PROOF";

const PAYMENT_PROOF_BUCKET_CANDIDATES = Array.from(
  new Set([
    PAYMENT_PROOF_BUCKET,
    "PAYMENT_PROOF",
    "PAYMENT PROOF",
    "payment-proof",
    "payment_proof",
    "paymentproof",
    "proof-of-payment",
  ])
);

export default function BookingDetailsModal({
  booking,
  petSitters = [],
  allowSitterReassignment = false,
  updating,
  onClose,
  onChangeSitter,
  onPending,
  onApprove,
  onReject,
  onComplete,
}) {
  const [selectedSitterId, setSelectedSitterId] = useState("");

  useEffect(() => {
    setSelectedSitterId(
      booking?.ps_id === null ||
        booking?.ps_id === undefined ||
        booking?.ps_id === ""
        ? ""
        : String(booking.ps_id)
    );
  }, [booking?.booking_id, booking?.ps_id]);

  if (!booking) return null;

  const normalizedStatus = normalizeStatus(booking.booking_status);
  const isPending = normalizedStatus === "Pending";
  const isConfirmed = normalizedStatus === "Confirmed";
  const isCompleted = normalizedStatus === "Completed";
  const isRejected = normalizedStatus === "Rejected";
  const hasUnknownStatus =
    !isPending && !isConfirmed && !isCompleted && !isRejected;

  const canReassignSitter =
    allowSitterReassignment === true &&
    isPending &&
    typeof onChangeSitter === "function";

  const currentSitterId =
    booking.ps_id === null ||
    booking.ps_id === undefined ||
    booking.ps_id === ""
      ? ""
      : String(booking.ps_id);

  const sitterAssignmentChanged =
    selectedSitterId !== currentSitterId;

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

        <div style={styles.modalBody}>
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
            fullWidth
          />
        </div>

        <h3 style={styles.sectionTitle}>Pet and Assigned Users</h3>

        <div style={styles.modalGrid}>
          <DetailItem
            label="Pet Owner"
            value={getOwnerName(booking)}
            secondary={formatReference("Owner ID", booking.po_id)}
          />

          {canReassignSitter ? (
            <SitterAssignmentField
              booking={booking}
              petSitters={petSitters}
              selectedSitterId={selectedSitterId}
              onSelect={setSelectedSitterId}
              changed={sitterAssignmentChanged}
              updating={updating}
              onSave={() =>
                onChangeSitter?.(booking, selectedSitterId)
              }
            />
          ) : (
            <DetailItem
              label="Pet Sitter"
              value={getSitterName(booking)}
              secondary={
                isPending
                  ? "Pet sitter assignment is unavailable."
                  : booking.ps_id
                  ? `${formatReference(
                      "Sitter ID",
                      booking.ps_id
                    )} • Assignment locked`
                  : "No sitter assigned • Assignment locked"
              }
            />
          )}

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

        </div>

        {(isCompleted || isRejected) && (
          <div style={styles.stickyReadOnlyFooter}>
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
                  {updating ? "Updating..." : "Approve"}
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

function SitterAssignmentField({
  booking,
  petSitters,
  selectedSitterId,
  onSelect,
  changed,
  updating,
  onSave,
}) {
  const currentSitterId =
    booking.ps_id === null ||
    booking.ps_id === undefined ||
    booking.ps_id === ""
      ? ""
      : String(booking.ps_id);

  const sortedSitters = [...petSitters].sort((first, second) =>
    getSitterDisplayName(first).localeCompare(
      getSitterDisplayName(second)
    )
  );

  const currentSitterIncluded =
    !currentSitterId ||
    sortedSitters.some(
      (sitter) =>
        String(getSitterRecordId(sitter)) === currentSitterId
    );

  return (
    <div style={styles.detailItem}>
      <p style={styles.detailLabel}>Pet Sitter</p>

      <select
        value={selectedSitterId}
        onChange={(event) => onSelect(event.target.value)}
        disabled={updating}
        style={{
          ...styles.sitterSelect,
          ...(updating ? styles.disabledControl : {}),
        }}
      >
        <option value="">Not assigned</option>

        {!currentSitterIncluded && currentSitterId && (
          <option value={currentSitterId}>
            {getSitterName(booking)} — Current assignment
          </option>
        )}

        {sortedSitters.map((sitter) => {
          const sitterId = getSitterRecordId(sitter);

          return (
            <option key={sitterId} value={String(sitterId)}>
              {getSitterDisplayName(sitter)} —{" "}
              {formatSitterId(sitterId)}
            </option>
          );
        })}
      </select>

      <p style={styles.assignmentHelper}>
        Select the appropriate pet sitter before approving this booking.
      </p>

      <button
        type="button"
        disabled={!changed || updating}
        onClick={onSave}
        style={{
          ...styles.assignmentButton,
          ...(!changed || updating
            ? styles.disabledAssignmentButton
            : {}),
        }}
      >
        {updating ? "Updating..." : "Update Assignment"}
      </button>
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
  const [imageUrl, setImageUrl] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function resolvePaymentProof() {
      const storedValue = String(value || "").trim();

      setImageUrl("");
      setImageError("");

      if (!storedValue) {
        setLoadingImage(false);
        return;
      }

      if (isHttpUrl(storedValue)) {
        setImageUrl(storedValue);
        setLoadingImage(false);
        return;
      }

      setLoadingImage(true);

      for (const bucketName of PAYMENT_PROOF_BUCKET_CANDIDATES) {
        const storagePath = getPaymentProofStoragePath(
          storedValue,
          bucketName
        );

        if (!storagePath) continue;

        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(storagePath, 60 * 60);

        if (!error && data?.signedUrl) {
          if (!cancelled) {
            setImageUrl(data.signedUrl);
            setImageError("");
            setLoadingImage(false);
          }
          return;
        }
      }

      if (!cancelled) {
        setLoadingImage(false);
        setImageError(
          "Unable to load the payment proof image. Check the Storage bucket name and read policy."
        );
      }
    }

    resolvePaymentProof();

    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!value) {
    return <h4 style={styles.detailValue}>Not uploaded</h4>;
  }

  if (loadingImage) {
    return (
      <div style={styles.proofLoadingBox}>
        Loading proof of payment...
      </div>
    );
  }

  if (imageError || !imageUrl) {
    return (
      <div style={styles.proofErrorBox}>
        <strong>Image could not be displayed.</strong>
        <span>{imageError}</span>
        <span style={styles.proofFileName}>
          Stored file: {getPaymentProofFileName(value)}
        </span>
      </div>
    );
  }

  return (
    <a
      href={imageUrl}
      target="_blank"
      rel="noreferrer"
      style={styles.proofLink}
      title="Open proof of payment in full size"
    >
      <img
        src={imageUrl}
        alt={`Payment proof for ${formatBookingId(bookingId)}`}
        style={styles.proofImage}
        onError={() =>
          setImageError(
            "The image link was created, but the image could not be opened."
          )
        }
      />
      <span style={styles.proofActionText}>
        Click the image to open full size
      </span>
    </a>
  );
}

function isHttpUrl(value) {
  const text = String(value || "").trim();

  return (
    text.startsWith("http://") ||
    text.startsWith("https://")
  );
}

function getPaymentProofStoragePath(value, bucketName) {
  const text = String(value || "")
    .trim()
    .replace(/^\/+/, "");

  if (!text || isHttpUrl(text)) return "";

  const bucketPrefix = `${bucketName}/`;

  return text.toLowerCase().startsWith(bucketPrefix.toLowerCase())
    ? text.slice(bucketPrefix.length)
    : text;
}

function getPaymentProofFileName(value) {
  const text = String(value || "").trim();
  const parts = text.split("/");

  return parts[parts.length - 1] || text;
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
    fullName ||
    booking.ownerName ||
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

function getSitterRecordId(sitter) {
  return (
    sitter?.petsitter_id ??
    sitter?.ps_id ??
    sitter?.pet_sitter_id ??
    sitter?.id ??
    ""
  );
}

function getSitterDisplayName(sitter) {
  const fullName = `${sitter?.ps_fname || ""} ${
    sitter?.ps_lname || ""
  }`.trim();

  return (
    fullName ||
    sitter?.ps_username ||
    sitter?.username ||
    "Name not set"
  );
}

function formatSitterId(id) {
  if (id === null || id === undefined || id === "") {
    return "ID not set";
  }

  return `PS-${String(id).padStart(4, "0")}`;
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

  const text = String(dateValue).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const date = new Date(`${text}T00:00:00`);

    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(date);
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) return text.slice(0, 10);

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    borderBottom: "1px solid #EEE2DF",
    padding: "22px 22px 16px",
    flexShrink: 0,
  },

  modalBody: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "0 22px 22px",
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

  sitterSelect: {
    width: "100%",
    height: 40,
    border: "1px solid #E2D5D3",
    borderRadius: 8,
    padding: "0 10px",
    background: "#FFFFFF",
    color: BRAND.text,
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 800,
    outline: "none",
    boxSizing: "border-box",
  },

  assignmentHelper: {
    margin: "7px 0 0",
    color: BRAND.muted,
    fontSize: 10,
    lineHeight: 1.4,
  },

  assignmentButton: {
    minHeight: 36,
    marginTop: 10,
    border: "none",
    borderRadius: 8,
    padding: "0 12px",
    background: BRAND.pink,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },

  disabledAssignmentButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  disabledControl: {
    opacity: 0.65,
    cursor: "not-allowed",
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
    maxHeight: 420,
    borderRadius: 10,
    border: "1px solid #E6D9D7",
    background: "#FFF8F8",
    objectFit: "contain",
    cursor: "zoom-in",
  },

  proofActionText: {
    display: "inline-block",
    marginTop: 9,
    color: BRAND.pink,
    fontSize: 12,
    fontWeight: 900,
  },

  proofLoadingBox: {
    minHeight: 130,
    borderRadius: 10,
    border: "1px dashed #E6D9D7",
    background: "#FFF8F8",
    color: BRAND.muted,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 800,
  },

  proofErrorBox: {
    padding: "12px 14px",
    borderRadius: 9,
    border: "1px solid #F1CBD5",
    background: "#FFF5F7",
    color: "#B42335",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 12,
    lineHeight: 1.45,
  },

  proofFileName: {
    color: BRAND.muted,
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

  modalActions: {
    flexShrink: 0,
    minHeight: 74,
    padding: "15px 22px",
    borderTop: "1px solid #EEE2DF",
    background: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
    boxSizing: "border-box",
    boxShadow: "0 -8px 18px rgba(51, 26, 18, 0.06)",
    zIndex: 5,
  },

  stickyReadOnlyFooter: {
    flexShrink: 0,
    padding: "15px 22px",
    borderTop: "1px solid #E6D9D7",
    background: "#F8F5F4",
    color: BRAND.muted,
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
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