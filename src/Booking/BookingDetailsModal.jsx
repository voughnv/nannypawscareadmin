import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { adminScaledFontSize } from "../context/AdminSettingsContext";

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


const BOOKING_MODAL_INTERACTION_CSS = `
  .booking-details-interactive button:not(:disabled) {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease,
      background-color 160ms ease,
      color 160ms ease,
      filter 160ms ease;
  }

  .booking-details-interactive button:not(:disabled):hover {
    transform: translateY(-1px);
    filter: brightness(1.015) saturate(1.03);
  }

  .booking-details-interactive button:not(:disabled):active {
    transform: translateY(0) scale(0.98);
  }

  .booking-details-interactive button:focus-visible,
  .booking-details-interactive textarea:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.42);
    outline-offset: 2px;
  }

  .booking-details-interactive .booking-modal-close:not(:disabled):hover {
    color: #D94368 !important;
    border-color: rgba(217, 67, 104, 0.52) !important;
    box-shadow: 0 5px 12px rgba(58, 30, 20, 0.08);
  }

  .booking-details-interactive .booking-review-textarea:not([readonly]) {
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease,
      background-color 160ms ease,
      transform 160ms ease;
  }

  .booking-details-interactive .booking-review-textarea:not([readonly]):hover {
    border-color: rgba(217, 67, 104, 0.46) !important;
    background: #fffdfd !important;
  }

  .booking-details-interactive .booking-review-textarea:not([readonly]):focus {
    outline: none;
    transform: translateY(-1px);
    border-color: #D94368 !important;
    box-shadow: 0 0 0 3px rgba(217, 67, 104, 0.10);
    background: #ffffff !important;
  }

  .booking-details-interactive .booking-proof-interactive:not(:disabled):hover {
    box-shadow: 0 8px 18px rgba(217, 67, 104, 0.10);
  }

  .booking-details-interactive .booking-proof-interactive:not(:disabled):hover img {
    transform: scale(1.012);
    border-color: rgba(217, 67, 104, 0.48) !important;
  }

  .booking-details-interactive .booking-proof-interactive img {
    transition:
      transform 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;
  }

  .booking-details-interactive .booking-action-button:not(:disabled):hover {
    box-shadow: 0 7px 16px rgba(58, 30, 20, 0.10);
  }

  .booking-details-interactive .booking-action-button:not(:disabled):active {
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .booking-details-interactive *,
    .booking-details-interactive *::before,
    .booking-details-interactive *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default function BookingDetailsModal({
  booking,
  updating,
  onClose,
  onPending,
  onApprove,
  onCancel,
  onPaid,
}) {
  const [reviewRemarks, setReviewRemarks] = useState(
    booking?.admin_review_remarks || ""
  );
  const [remarksError, setRemarksError] = useState("");

  useEffect(() => {
    setReviewRemarks(booking?.admin_review_remarks || "");
    setRemarksError("");
  }, [booking]);

  if (!booking) return null;

  const normalizedStatus = normalizeStatus(booking.booking_status);
  const isPending = normalizedStatus === "Pending";
  const isConfirmed = normalizedStatus === "Confirmed";
  const isCompleted = normalizedStatus === "Completed";
  const isCancelled = normalizedStatus === "Cancelled";
  const paymentState = getBookingPaymentState(booking);
  const isPaid = paymentState === "Paid";
  const isCash = isCashPaymentMethod(
    booking.payment_method
  );
  const hasUnknownStatus =
    !isPending && !isConfirmed && !isCompleted && !isCancelled;

  const startTime = booking.start_time || booking.booking_time;
  const paymentProof = String(booking.payment_proof || "").trim();
  const hasPaymentProof = Boolean(paymentProof);
  const canMarkPaid =
    isCompleted &&
    !isPaid &&
    (isCash || hasPaymentProof);

  return (
    <div
      className="booking-details-interactive"
      style={styles.modalOverlay}
      onClick={updating ? undefined : onClose}
    >
      <style>{BOOKING_MODAL_INTERACTION_CSS}</style>

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
            className="booking-modal-close"
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

        <h3 style={styles.sectionTitle}>Pet and Assignment Details</h3>

        <div style={styles.modalGrid}>
          <DetailItem
            label="Pet Owner"
            value={getOwnerName(booking)}
            secondary={formatReference("Owner ID", booking.po_id)}
          />

          <DetailItem
            label="Pet Sitter"
            value={getSitterName(booking)}
            secondary={getSitterAssignmentStatusText(
              booking,
              normalizedStatus
            )}
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
            value={
              booking.payment_method ||
              "Not specified"
            }
          />

          <DetailItem
            label="Amount"
            value={
              formatAmount(
                booking.amount
              )
            }
          />

          <DetailItem
            label="Payment Status"
            custom={
              <PaymentStatusBadge
                state={paymentState}
              />
            }
            fullWidth
          />

          <DetailItem
            label="Proof of Payment"
            custom={
              <PaymentProofForBooking
                booking={booking}
                value={paymentProof}
                paymentState={paymentState}
              />
            }
            fullWidth
          />
        </div>

        <div style={styles.paymentFlowNote}>
          {isCancelled
            ? "No payment is required for this cancelled booking."
            : !isCompleted
            ? "Payment will be processed after the service is completed."
            : isPaid
            ? "Payment has been received and recorded successfully."
            : isCash
            ? "The service has been completed. Cash payment is awaiting confirmation."
            : hasPaymentProof
            ? "Proof of payment has been submitted and is awaiting verification."
            : "The service has been completed. Proof of payment has not yet been submitted."}
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
        <>
          <h3 style={styles.sectionTitle}>Admin Review</h3>

          <div style={styles.reviewRemarksCard}>
            <div style={styles.reviewRemarksHeader}>
              <div>
                <p style={styles.reviewRemarksLabel}>
                  Review Notes
                </p>

                <p style={styles.reviewRemarksHelp}>
                  {isPending
                    ? "Add optional notes to document the booking review."
                    : reviewRemarks.trim()
                    ? "Review notes for this booking."
                    : "No review notes were recorded for this booking."}
                </p>
              </div>
            </div>

            <textarea
              className="booking-review-textarea"
              value={reviewRemarks}
              onChange={(event) => {
                setReviewRemarks(event.target.value);

                if (remarksError) {
                  setRemarksError("");
                }
              }}
              readOnly={!isPending}
              placeholder={
                isPending
                  ? "Add optional review notes..."
                  : "No review notes recorded."
              }
              style={{
                ...styles.reviewRemarksInput,
                ...(!isPending
                  ? styles.reviewRemarksReadOnly
                  : {}),
                ...(remarksError
                  ? styles.reviewRemarksInputError
                  : {}),
              }}
            />

            {remarksError && (
              <p style={styles.reviewRemarksError}>
                {remarksError}
              </p>
            )}
          </div>
        </>

        </div>

        {(isConfirmed ||
          isCancelled ||
          (isCompleted && isPaid)) && (
          <div style={styles.stickyReadOnlyFooter}>
            {isCancelled
              ? "This booking has been cancelled. No payment is required."
              : isCompleted
              ? "The service has been completed, and payment has been recorded."
              : "Booking approved. The assigned Pet Sitter will update the booking once the service is completed."}
          </div>
        )}

        {(isPending ||
          hasUnknownStatus ||
          (isCompleted && !isPaid)) && (
          <div style={styles.modalActions}>
            {hasUnknownStatus && (
              <button
                type="button"
                style={{
                  ...styles.actionButton,
                  ...styles.pendingButton,
                  ...(updating
                    ? styles.disabledButton
                    : {}),
                }}
                disabled={updating}
                onClick={() =>
                  onPending(booking)
                }
              >
                {updating
                  ? "Updating..."
                  : "Move to Pending"}
              </button>
            )}

            {isPending && (
              <>
                <button
                  type="button"
                  className="booking-action-button"
                  style={{
                    ...styles.actionButton,
                    ...styles.cancelButton,
                    ...(updating
                      ? styles.disabledButton
                      : {}),
                  }}
                  disabled={updating}
                  onClick={async () => {
                    setRemarksError("");

                    await onCancel?.(
                      booking,
                      reviewRemarks.trim()
                    );
                  }}
                >
                  Cancel Booking
                </button>

                <button
                  type="button"
                  className="booking-action-button"
                  style={{
                    ...styles.actionButton,
                    ...styles.confirmButton,
                    ...(updating
                      ? styles.disabledButton
                      : {}),
                  }}
                  disabled={updating}
                  onClick={() =>
                    onApprove?.(booking)
                  }
                >
                  {updating
                    ? "Updating..."
                    : "Approve Booking"}
                </button>
              </>
            )}

            {isCompleted && !isPaid && (
              <button
                type="button"
                className="booking-action-button"
                style={{
                  ...styles.actionButton,
                  ...styles.paidButton,
                  ...(!canMarkPaid ||
                  updating
                    ? styles.disabledButton
                    : {}),
                }}
                disabled={
                  updating ||
                  !canMarkPaid
                }
                onClick={() =>
                  onPaid?.(booking)
                }
                title={
                  canMarkPaid
                    ? isCash
                      ? "Confirm receipt of the cash payment."
                      : "Confirm that the submitted payment proof has been verified."
                    : "Payment proof has not yet been submitted."
                }
              >
                {updating
                  ? "Updating..."
                  : canMarkPaid
                  ? "Mark as Paid"
                  : "Awaiting Payment Proof"}
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

function PaymentProofForBooking({
  booking,
  value,
  paymentState,
}) {
  const normalizedStatus =
    normalizeStatus(
      booking?.booking_status
    );

  const isCash =
    isCashPaymentMethod(
      booking?.payment_method
    );

  const hasProof =
    Boolean(
      String(value || "").trim()
    );

  if (normalizedStatus === "Cancelled") {
    return (
      <PaymentMessage>
        No proof of payment is required.
      </PaymentMessage>
    );
  }

  if (normalizedStatus !== "Completed") {
    return (
      <PaymentMessage>
        Proof of payment can be submitted after the service is completed.
      </PaymentMessage>
    );
  }

  if (hasProof) {
    return (
      <PaymentProof
        value={value}
        bookingId={
          booking?.booking_id
        }
      />
    );
  }

  if (
    isCash &&
    paymentState === "Paid"
  ) {
    return (
      <PaymentMessage positive>
        Cash payment has been recorded. No payment proof is required.
      </PaymentMessage>
    );
  }

  return (
    <PaymentMessage>
      {isCash
        ? "Cash payment has not yet been confirmed."
        : "Proof of payment has not yet been submitted."}
    </PaymentMessage>
  );
}

function PaymentMessage({
  children,
  positive = false,
}) {
  return (
    <div
      style={{
        ...styles.paymentMessage,
        ...(positive
          ? styles.paymentMessagePositive
          : {}),
      }}
    >
      {children}
    </div>
  );
}

function PaymentProof({ value, bookingId }) {
  const [imageUrl, setImageUrl] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

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
          "The proof of payment could not be loaded. Please try again."
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
        <strong>Proof of payment unavailable.</strong>
        <span>{imageError}</span>
        <span style={styles.proofFileName}>
          File: {getPaymentProofFileName(value)}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="booking-proof-interactive"
        style={styles.proofLink}
        title="View proof of payment"
        onClick={() => setPreviewOpen(true)}
      >
        <img
          src={imageUrl}
          alt={`Payment proof for ${formatBookingId(bookingId)}`}
          style={styles.proofImage}
          onError={() =>
            setImageError(
              "The proof of payment could not be displayed. Please try again."
            )
          }
        />
        <span style={styles.proofActionText}>
          View Full Image
        </span>
      </button>

      {previewOpen && (
        <div
          style={styles.proofPreviewOverlay}
          onClick={(event) => {
            event.stopPropagation();
            setPreviewOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Proof of payment preview"
            style={styles.proofPreviewModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.proofPreviewHeader}>
              <div>
                <p style={styles.proofPreviewLabel}>
                  Proof of Payment
                </p>
                <h3 style={styles.proofPreviewTitle}>
                  {formatBookingId(bookingId)}
                </h3>
              </div>

              <button
                type="button"
                aria-label="Close proof preview"
                className="booking-modal-close"
                style={styles.proofPreviewCloseBtn}
                onClick={() => setPreviewOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.proofPreviewBody}>
              <img
                src={imageUrl}
                alt={`Full payment proof for ${formatBookingId(
                  bookingId
                )}`}
                style={styles.proofPreviewImage}
              />
            </div>
          </div>
        </div>
      )}
    </>
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
      : normalizedStatus === "Cancelled"
      ? styles.statusCancelled
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
    return "Cancelled";
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function normalizePaymentStatus(status) {
  const cleaned = String(status || "")
    .trim()
    .toLowerCase();

  if (cleaned === "paid") {
    return "Paid";
  }

  if (cleaned === "unpaid") {
    return "Unpaid";
  }

  return "";
}

function getBookingPaymentState(booking) {
  const storedStatus =
    normalizePaymentStatus(
      booking?.payment_status
    );

  return storedStatus === "Paid"
    ? "Paid"
    : "Unpaid";
}

function isCashPaymentMethod(method) {
  const cleaned =
    String(method || "")
      .trim()
      .toLowerCase();

  return (
    cleaned === "cash" ||
    cleaned.includes("cash")
  );
}

function PaymentStatusBadge({ state }) {
  const isPaid =
    state === "Paid";

  return (
    <span
      style={{
        ...styles.paymentStatusBadge,
        ...(isPaid
          ? styles.paymentPaid
          : styles.paymentUnpaid),
      }}
    >
      {isPaid ? "Paid" : "Unpaid"}
    </span>
  );
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

function getSitterAssignmentStatusText(
  booking,
  normalizedStatus
) {
  const sitterReference = booking.ps_id
    ? formatReference("Sitter ID", booking.ps_id)
    : "No sitter assigned";

  if (normalizedStatus === "Confirmed") {
    return `${sitterReference} • Assignment finalized`;
  }

  if (normalizedStatus === "Completed") {
    return `${sitterReference} • Service completed`;
  }

  if (normalizedStatus === "Cancelled") {
    return `${sitterReference} • Booking cancelled`;
  }

  return booking.ps_id
    ? sitterReference
    : "No sitter assigned";
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
    fontSize: adminScaledFontSize(24),
    fontWeight: 900,
  },

  modalReference: {
    margin: "5px 0 0",
    color: BRAND.muted,
    fontSize: adminScaledFontSize(13),
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
    fontSize: adminScaledFontSize(14),
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
    fontSize: adminScaledFontSize(12),
    fontWeight: 900,
    color: BRAND.muted,
  },

  detailValue: {
    margin: 0,
    fontSize: adminScaledFontSize(14),
    fontWeight: 900,
    color: BRAND.text,
    overflowWrap: "anywhere",
  },

  detailSecondary: {
    margin: "6px 0 0",
    color: BRAND.muted,
    fontSize: adminScaledFontSize(11),
    fontWeight: 700,
  },

  proofLink: {
    width: "100%",
    display: "block",
    border: "none",
    background: "transparent",
    padding: 0,
    color: BRAND.pink,
    fontSize: adminScaledFontSize(12),
    fontWeight: 900,
    textDecoration: "none",
    textAlign: "left",
    cursor: "pointer",
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
    fontSize: adminScaledFontSize(12),
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
    fontSize: adminScaledFontSize(13),
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
    fontSize: adminScaledFontSize(12),
    lineHeight: 1.45,
  },

  proofFileName: {
    color: BRAND.muted,
    overflowWrap: "anywhere",
  },

  reviewRemarksCard: {
    border: "1px solid #EEE2DF",
    borderRadius: 12,
    padding: 14,
    background: "#FFFCFB",
  },

  reviewRemarksHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },

  reviewRemarksLabel: {
    margin: 0,
    color: BRAND.text,
    fontSize: adminScaledFontSize(13),
    fontWeight: 900,
  },

  reviewRemarksHelp: {
    margin: "4px 0 0",
    color: BRAND.muted,
    fontSize: adminScaledFontSize(11),
    lineHeight: 1.4,
    fontWeight: 700,
  },

  reviewRemarksInput: {
    width: "100%",
    minHeight: 92,
    resize: "vertical",
    border: "1px solid #E2D5D3",
    borderRadius: 9,
    background: "#FFFFFF",
    color: BRAND.text,
    padding: 11,
    fontFamily: "inherit",
    fontSize: adminScaledFontSize(13),
    lineHeight: 1.45,
    outline: "none",
    boxSizing: "border-box",
  },

  reviewRemarksReadOnly: {
    background: "#F8F5F4",
    color: BRAND.muted,
    cursor: "default",
  },

  reviewRemarksInputError: {
    borderColor: "#D98E94",
    background: "#FFF8F9",
  },

  reviewRemarksError: {
    margin: "7px 0 0",
    color: "#B42335",
    fontSize: adminScaledFontSize(11),
    fontWeight: 800,
  },

  proofPreviewOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 220,
    background: "rgba(26, 16, 13, 0.62)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    boxSizing: "border-box",
  },

  proofPreviewModal: {
    width: "min(760px, 100%)",
    maxHeight: "90vh",
    borderRadius: 18,
    background: "#FFFFFF",
    border: "1px solid #EEE2DF",
    boxShadow: "0 28px 65px rgba(33,18,14,0.30)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  proofPreviewHeader: {
    flexShrink: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    padding: "18px 20px",
    borderBottom: "1px solid #EEE2DF",
  },

  proofPreviewLabel: {
    margin: "0 0 4px",
    color: BRAND.pink,
    fontSize: adminScaledFontSize(11),
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  proofPreviewTitle: {
    margin: 0,
    color: BRAND.brown,
    fontSize: adminScaledFontSize(21),
    fontWeight: 900,
  },

  proofPreviewCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    border: "1px solid #E6D9D7",
    background: "#FFFFFF",
    color: BRAND.brown,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  proofPreviewBody: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    padding: 18,
    background: "#FFF9F8",
  },

  proofPreviewImage: {
    display: "block",
    width: "100%",
    maxHeight: "70vh",
    objectFit: "contain",
    borderRadius: 12,
    background: "#FFFFFF",
    border: "1px solid #E6D9D7",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 78,
    height: 26,
    padding: "0 9px",
    borderRadius: 7,
    fontSize: adminScaledFontSize(12),
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

  statusCancelled: {
    background: "#F8D8DB",
    color: "#DF101D",
  },

  paymentStatusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 86,
    height: 28,
    padding: "0 10px",
    borderRadius: 7,
    border: "1px solid transparent",
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 850,
    boxSizing: "border-box",
    whiteSpace: "nowrap",
  },

  paymentPaid: {
    background: "#E7F6ED",
    color: "#167545",
    borderColor: "#D3ECDD",
  },

  paymentUnpaid: {
    background: "#FFF1DF",
    color: "#A9570A",
    borderColor: "#F2DDBF",
  },

  statusDefault: {
    background: "#EEE9E7",
    color: "#645854",
  },

  paymentFlowNote: {
    marginTop: 12,
    padding: "11px 13px",
    borderRadius: 9,
    border: "1px solid #EEE5E2",
    background: "#FCFAF9",
    color: BRAND.muted,
    fontSize: adminScaledFontSize(12),
    fontWeight: 650,
    lineHeight: 1.5,
  },

  paymentMessage: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 9,
    border: "1px solid #E8DDDA",
    background: "#FAF7F6",
    color: BRAND.muted,
    fontSize: adminScaledFontSize(12.5),
    fontWeight: 700,
    lineHeight: 1.45,
    boxSizing: "border-box",
  },

  paymentMessagePositive: {
    borderColor: "#CDE9D9",
    background: "#EFF9F3",
    color: "#0D7C44",
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
    fontSize: adminScaledFontSize(13),
    fontWeight: 800,
    textAlign: "center",
  },

  actionButton: {
    height: 40,
    borderRadius: 9,
    padding: "0 14px",
    fontSize: adminScaledFontSize(13),
    fontWeight: 900,
    cursor: "pointer",
  },

  pendingButton: {
    border: "1px solid #E6D9D7",
    background: "#fff",
    color: BRAND.brown,
  },

  cancelButton: {
    border: "none",
    background: "#F8D8DB",
    color: "#DF101D",
  },

  paidButton: {
    border: "none",
    background: "#DDF3E7",
    color: "#0D8B48",
    padding: "0 16px",
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
