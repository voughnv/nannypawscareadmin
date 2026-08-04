import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  FileText,
  RefreshCw,
  AlertCircle,
  UserRound,
  Phone,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { useConfirmation } from "./context/ConfirmationProvider";

const BRAND = {
  brown: "#3A1E14", pink: "#D94368", softPink: "#FDEBED",
  sidebar: "#FDEEEF", border: "#EEE2E0", text: "#2E1B16", muted: "#6F625F",
};

const ROWS_PER_PAGE = 6;

// Change this only if your actual Supabase Storage bucket has a different name.
const RESUME_BUCKET = "RESUME";

export default function ApplicantPage() {
  const requestConfirmation = useConfirmation();

  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { fetchApplicantRecords(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, dateFrom, dateTo]);

  async function fetchApplicantRecords() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const [applicantResult, applicationResult] = await Promise.all([
        supabase
          .from("APPLICANT")
          .select("applicant_id, created_at, a_fname, a_lname, a_address, a_contactno, resume_file, pet_place, a_auth_id, a_dob, u_id")
          .order("created_at", { ascending: true }),
        supabase
          .from("APPLICATION")
          .select("application_id, created_at, review_remarks, review_date, application_status, a_id")
          .order("created_at", { ascending: false }),
      ]);

      if (applicantResult.error) throw applicantResult.error;
      if (applicationResult.error) throw applicationResult.error;

      const applicationMap = new Map(
        (applicationResult.data || []).map((item) => [Number(item.a_id), item])
      );

      const merged = (applicantResult.data || []).map((applicant) => {
        const application = applicationMap.get(Number(applicant.applicant_id));
        return {
          ...applicant,
          application_id: application?.application_id ?? null,
          application_created_at: application?.created_at ?? null,
          review_remarks: application?.review_remarks ?? "",
          review_date: application?.review_date ?? null,
          application_status: application?.application_status ?? "Pending",
          has_application_record: Boolean(application),
        };
      });

      setRecords(merged);
      setSelectedRecord((previous) =>
        previous
          ? merged.find((item) => item.applicant_id === previous.applicant_id) || null
          : null
      );
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError?.message || "Unable to load applicant and application records.");
    } finally {
      setLoading(false);
    }
  }

  async function updateReview(record, status, remarks) {
    const isRejecting = status === "Rejected";

    const confirmed = await requestConfirmation({
      title: isRejecting ? "Reject application?" : "Approve application?",
      message: isRejecting
        ? `Reject ${getFullName(
            record
          )}'s application? This review cannot be changed afterward.`
        : `Approve ${getFullName(
            record
          )}'s application? This review cannot be changed afterward.`,
      confirmText: isRejecting ? "Reject Application" : "Approve Application",
      variant: isRejecting ? "danger" : "success",
    });

    if (!confirmed) return;

    setUpdatingId(record.applicant_id);
    setError("");
    setSuccess("");

    try {
      const payload = {
        application_status: status,
        review_remarks: remarks.trim() || null,
        review_date: [new Date().toISOString().slice(0, 10)],
      };

      let result;

      if (record.has_application_record) {
        result = await supabase
          .from("APPLICATION")
          .update(payload)
          .eq("application_id", record.application_id)
          .select("application_id, created_at, review_remarks, review_date, application_status, a_id")
          .single();
      } else {
        result = await supabase
          .from("APPLICATION")
          .insert({ a_id: record.applicant_id, ...payload })
          .select("application_id, created_at, review_remarks, review_date, application_status, a_id")
          .single();
      }

      if (result.error) throw result.error;

      const updated = {
        ...record,
        application_id: result.data.application_id,
        a_id: result.data.a_id ?? record.applicant_id,
        application_created_at: result.data.created_at,
        review_remarks: result.data.review_remarks || "",
        review_date: result.data.review_date,
        application_status: result.data.application_status,
        has_application_record: true,
      };

      setRecords((previous) =>
        previous.map((item) =>
          item.applicant_id === record.applicant_id ? updated : item
        )
      );
      setSelectedRecord(updated);
      setSuccess(
        `${getFullName(record)}'s application was updated to ${status}.`
      );
    } catch (updateError) {
      console.error(updateError);
      setError(updateError?.message || "Unable to update application review.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function downloadResume(record) {
    if (!record?.resume_file) {
      setError("No resume file is stored for this applicant.");
      return;
    }

    setDownloadingResumeId(record.applicant_id);
    setError("");

    try {
      const fileName = getFileName(record.resume_file);
      let blob;

      if (isHttpUrl(record.resume_file)) {
        const response = await fetch(record.resume_file);

        if (!response.ok) {
          throw new Error("Unable to retrieve the resume file.");
        }

        blob = await response.blob();
      } else {
        const storagePath = getStoragePath(
          record.resume_file,
          RESUME_BUCKET
        );

        const { data, error: downloadError } = await supabase.storage
          .from(RESUME_BUCKET)
          .download(storagePath);

        if (downloadError) throw downloadError;
        blob = data;
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName || "applicant_resume.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      console.error("Unable to download resume:", downloadError);
      setError(
        downloadError?.message ||
          `Unable to download the resume. Verify that the file exists in the "${RESUME_BUCKET}" Storage bucket and that Storage RLS allows SELECT.`
      );
    } finally {
      setDownloadingResumeId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All Status");
    setDateFrom("");
    setDateTo("");
    setShowDateFilter(false);
    setCurrentPage(1);
  }

  const normalizedRecords = useMemo(
    () =>
      records.map((record) => ({
        ...record,
        normalizedStatus: normalizeStatus(record.application_status),
      })),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const keyword = search
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    return normalizedRecords.filter((record) => {
      const applicantName = getFullName(record)
        .replace(/\s+/g, " ")
        .toLowerCase();

      const rawApplicantId = String(
        record.applicant_id ?? ""
      ).toLowerCase();

      const formattedApplicantId = formatApplicantId(
        record.applicant_id
      ).toLowerCase();

      const matchesSearch =
        !keyword ||
        applicantName.includes(keyword) ||
        rawApplicantId.includes(keyword) ||
        formattedApplicantId.includes(keyword);

      const matchesStatus =
        statusFilter === "All Status" ||
        record.normalizedStatus === statusFilter;

      const submittedDate = getDateOnlyValue(
        record.created_at
      );

      const matchesDateFrom =
        !dateFrom ||
        (submittedDate && submittedDate >= dateFrom);

      const matchesDateTo =
        !dateTo ||
        (submittedDate && submittedDate <= dateTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [normalizedRecords, search, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ROWS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRecords.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const stats = useMemo(() => ({
    total: records.length,
    pending: normalizedRecords.filter((item) => item.normalizedStatus === "Pending").length,
    approved: normalizedRecords.filter((item) => item.normalizedStatus === "Approved").length,
    rejected: normalizedRecords.filter((item) => item.normalizedStatus === "Rejected").length,
  }), [records, normalizedRecords]);

  const firstVisible = filteredRecords.length ? (currentPage - 1) * ROWS_PER_PAGE + 1 : 0;
  const lastVisible = Math.min(currentPage * ROWS_PER_PAGE, filteredRecords.length);

  return (
    <>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Applicants</h1>
            <p style={styles.subtitle}>Manage applicant information and application reviews.</p>
          </div>
          <div style={styles.breadcrumb}>
            <span>Dashboard</span><span style={styles.chevron}>›</span><span>Applicants</span>
          </div>
        </header>

        <section style={styles.statsGrid}>
          <StatCard icon={<Users size={30} />} iconStyle={styles.statPink} title="Total Applicants" value={stats.total} desc="All applicant records" />
          <StatCard icon={<Clock3 size={30} />} iconStyle={styles.statOrange} title="Pending Review" value={stats.pending} desc="Awaiting review" />
          <StatCard icon={<CheckCircle2 size={32} />} iconStyle={styles.statGreen} title="Approved" value={stats.approved} desc="Approved applications" />
          <StatCard icon={<XCircle size={32} />} iconStyle={styles.statRed} title="Rejected" value={stats.rejected} desc="Rejected applications" />
        </section>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={20} />
            <span style={styles.errorText}>{error}</span>
            <button style={styles.errorClose} onClick={() => setError("")}><X size={18} /></button>
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            <CheckCircle2 size={20} />
            <span style={styles.successText}>{success}</span>
            <button style={styles.successClose} onClick={() => setSuccess("")}>
              <X size={18} />
            </button>
          </div>
        )}

        <section style={styles.tableCard}>
          {/* FILTERS - MATCHING BOOKING PAGE LAYOUT */}
          <div style={styles.filters}>
            {/* Left side: Search + Status dropdown - exactly like Booking page */}
            <div style={styles.leftFilters}>
              <div style={styles.searchBox}>
                <Search size={22} color="#5E4B45" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search Applicant ID or name"
                  style={styles.searchInput}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={styles.select}
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>

            {/* Right side: Refresh + Date range toggle - exactly like Booking page */}
            <div style={styles.filterActions}>
              <button
                style={styles.refreshBtn}
                onClick={fetchApplicantRecords}
                disabled={loading}
                title="Refresh applicants"
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

          {/* DATE FILTER PANEL - exactly like Booking page */}
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
                    const nextValue = sanitizeDateInput(
                      event.currentTarget.value
                    );
                    if (event.currentTarget.value !== nextValue) {
                      event.currentTarget.value = nextValue;
                    }
                  }}
                  onChange={(event) => {
                    const nextFrom = sanitizeDateInput(
                      event.target.value
                    );
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
                  type="date"
                  value={dateTo}
                  min={dateFrom || "0001-01-01"}
                  max="9999-12-31"
                  onInput={(event) => {
                    const nextValue = sanitizeDateInput(
                      event.currentTarget.value
                    );
                    if (event.currentTarget.value !== nextValue) {
                      event.currentTarget.value = nextValue;
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
                  <Th>No.</Th><Th>Applicant</Th><Th>Contact Number</Th>
                  <Th>Address</Th><Th>Pet Place</Th><Th>Resume</Th><Th>Status</Th><Th>Submitted On</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={styles.emptyCell}>
                      <div style={styles.loadingContent}>
                        <RefreshCw size={22} />
                        <span>Loading applicant records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRecords.length ? (
                  paginatedRecords.map((record, index) => (
                    <tr
                      key={record.applicant_id}
                      style={{ ...styles.tableRow, cursor: "pointer" }}
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td style={styles.numberCell}>
                        {(currentPage - 1) * ROWS_PER_PAGE + index + 1}
                      </td>
                      <td style={styles.normalCell}>
                        <strong style={styles.primaryText}>{getFullName(record)}</strong>
                      </td>
                      <td style={styles.normalCell}>
                        {formatContactNumber(record.a_contactno)}
                      </td>
                      <td style={styles.normalCell}>
                        {record.a_address || "Not set"}
                      </td>
                      <td style={styles.normalCell}>
                        {isHttpUrl(record.pet_place) ? (
                          <button
                            type="button"
                            style={styles.fileCellButton}
                            onClick={(event) => {
                              event.stopPropagation();
                              window.open(record.pet_place, "_blank", "noopener,noreferrer");
                            }}
                            title="Open pet place image"
                          >
                            <img
                              src={record.pet_place}
                              alt={`${getFullName(record)} pet place`}
                              style={styles.petPlaceThumbnail}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                            <span>View Image</span>
                          </button>
                        ) : (
                          <span style={styles.mutedCell}>No image</span>
                        )}
                      </td>
                      <td style={styles.normalCell}>
                        {record.resume_file ? (
                          <button
                            type="button"
                            style={styles.fileCellButton}
                            disabled={
                              downloadingResumeId === record.applicant_id
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              downloadResume(record);
                            }}
                          >
                            <FileText size={15} />
                            <span
                              style={styles.resumeFileName}
                              title={getFileName(record.resume_file)}
                            >
                              {downloadingResumeId === record.applicant_id
                                ? "Downloading..."
                                : getFileName(record.resume_file)}
                            </span>
                          </button>
                        ) : (
                          <span style={styles.mutedCell}>No resume</span>
                        )}
                      </td>
                      <td style={styles.normalCell}>
                        <StatusBadge status={record.application_status} />
                      </td>
                      <td style={styles.normalCell}>
                        {formatDateTime(record.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={styles.emptyCell}>
                      No applicants found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <p style={styles.pageText}>
              Showing {firstVisible} to {lastVisible} of {filteredRecords.length} applicants
            </p>
            <div style={styles.pages}>
              <button
                style={{
                  ...styles.pageBtn,
                  ...(currentPage === 1 ? styles.disabledBtn : {}),
                }}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={17} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
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
              ))}
              <button
                style={{
                  ...styles.pageBtn,
                  ...(currentPage === totalPages ? styles.disabledBtn : {}),
                }}
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

      {selectedRecord && (
        <ApplicantModal
          record={selectedRecord}
          updating={updatingId === selectedRecord.applicant_id}
          onClose={() => setSelectedRecord(null)}
          onUpdate={updateReview}
          onDownloadResume={downloadResume}
          downloadingResume={
            downloadingResumeId === selectedRecord.applicant_id
          }
        />
      )}
    </>
  );
}

// [Rest of the component functions remain the same...]
// StatCard, Th, StatusBadge, ApplicantModal, DetailItem, normalizeStatus, 
// getFullName, formatApplicationId, formatApplicantId, formatContactNumber,
// getFileName, isHttpUrl, getStoragePath, formatDate, formatDateTime

function StatCard({ icon, iconStyle, title, value, desc }) {
  return <div style={styles.statCard}><div style={{ ...styles.statIcon, ...iconStyle }}>{icon}</div><div><p style={styles.statTitle}>{title}</p><h2 style={styles.statValue}>{value}</h2><p style={styles.statDesc}>{desc}</p></div></div>;
}

function Th({ children }) {
  return <th style={styles.th}>{children}</th>;
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const badgeStyle =
    normalized === "Pending" ? styles.statusPending :
    normalized === "Approved" ? styles.statusApproved :
    normalized === "Rejected" ? styles.statusRejected :
    styles.statusDefault;

  return <span style={{ ...styles.badge, ...badgeStyle }}>{normalized}</span>;
}

function ApplicantModal({
  record,
  updating,
  onClose,
  onUpdate,
  onDownloadResume,
  downloadingResume,
}) {
  const [remarks, setRemarks] = useState(record.review_remarks || "");
  const normalizedStatus = normalizeStatus(record.application_status);
  const reviewCompleted =
    normalizedStatus === "Approved" || normalizedStatus === "Rejected";

  useEffect(() => { setRemarks(record.review_remarks || ""); }, [record]);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Applicant Details</h2>
          </div>
          <button style={styles.modalCloseBtn} onClick={onClose}><X size={22} /></button>
        </div>

        <div style={styles.modalBody}>
        <div style={styles.profileTop}>
          <div style={styles.bigAvatar}><UserRound size={34} /></div>
          <div>
            <h3 style={styles.detailsName}>{getFullName(record)}</h3>
            <p style={styles.detailsLocation}><MapPin size={13} />{record.a_address || "Address not set"}</p>
            <StatusBadge status={record.application_status} />
          </div>
        </div>

        <div style={styles.detailsGrid}>
          <DetailItem
            icon={<FileText size={16} />}
            label="Application Form ID"
            value={formatApplicationId(record.application_id)}
          />
          <DetailItem
            icon={<UserRound size={16} />}
            label="Applicant ID"
            value={formatApplicantId(record.applicant_id)}
          />
          <DetailItem icon={<UserRound size={16} />} label="First Name" value={record.a_fname || "Not set"} />
          <DetailItem icon={<UserRound size={16} />} label="Last Name" value={record.a_lname || "Not set"} />
          <DetailItem icon={<Phone size={16} />} label="Contact Number" value={formatContactNumber(record.a_contactno)} />
          <DetailItem icon={<MapPin size={16} />} label="Address" value={record.a_address || "Not set"} />
          <div style={styles.mediaCard}>
            <div style={styles.mediaHeader}>
              <div style={styles.detailIcon}><ImageIcon size={16} /></div>
              <div>
                <p style={styles.detailLabel}>Pet Place</p>
                <h4 style={styles.detailValue}>
                  {isHttpUrl(record.pet_place) ? "Uploaded image" : "No image uploaded"}
                </h4>
              </div>
            </div>

            {isHttpUrl(record.pet_place) && (
              <a
                href={record.pet_place}
                target="_blank"
                rel="noreferrer"
                style={styles.mediaLink}
              >
                <img
                  src={record.pet_place}
                  alt={`${getFullName(record)} pet place`}
                  style={styles.petPlaceImage}
                />
                <span style={styles.mediaActionText}>Open full image</span>
              </a>
            )}
          </div>
          <DetailItem icon={<Calendar size={16} />} label="Date of Birth" value={formatDate(record.a_dob, "Not set")} />
          <DetailItem icon={<Calendar size={16} />} label="Submitted On" value={formatDateTime(record.created_at)} />
          <DetailItem icon={<Calendar size={16} />} label="Review Date" value={formatDate(record.review_date)} />
          <div style={styles.resumeCard}>
            <div style={styles.detailIcon}><FileText size={16} /></div>
            <div style={styles.resumeCardContent}>
              <p style={styles.detailLabel}>Resume File</p>
              <h4 style={styles.detailValue}>
                {record.resume_file
                  ? getFileName(record.resume_file)
                  : "No resume uploaded"}
              </h4>

              {record.resume_file && (
                <button
                  type="button"
                  style={styles.modalFileButton}
                  disabled={downloadingResume}
                  onClick={() => onDownloadResume(record)}
                >
                  <Download size={15} />
                  {downloadingResume
                    ? "Downloading..."
                    : "Download Resume"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={styles.remarksBox}>
          <p style={styles.detailLabel}>Review Remarks</p>
          <textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Enter remarks before approving or rejecting..."
            readOnly={reviewCompleted}
            style={
              reviewCompleted
                ? { ...styles.remarksInput, ...styles.readOnlyRemarks }
                : styles.remarksInput
            }
          />
        </div>
        </div>

        {!reviewCompleted && (
          <div style={styles.modalActions}>
            <button
              style={styles.rejectModalBtn}
              disabled={updating}
              onClick={() => onUpdate(record, "Rejected", remarks)}
            >
              Reject
            </button>

            <button
              style={styles.approveModalBtn}
              disabled={updating}
              onClick={() => onUpdate(record, "Approved", remarks)}
            >
              {updating ? "Updating..." : "Approve"}
            </button>
          </div>
        )}

        {reviewCompleted && (
          <div style={styles.reviewCompleteNotice}>
            This application review is complete and can no longer be changed.
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return <div style={styles.detailItem}><div style={styles.detailIcon}>{icon}</div><div><p style={styles.detailLabel}>{label}</p><h4 style={styles.detailValue}>{value}</h4></div></div>;
}

function normalizeStatus(status) {
  const value = String(status || "Pending").trim().toLowerCase();
  if (value === "approved" || value === "accepted") return "Approved";
  if (value === "rejected" || value === "declined") return "Rejected";
  return "Pending";
}

function getFullName(record) {
  return `${record.a_fname || ""} ${record.a_lname || ""}`.trim() || "Name not set";
}

function formatApplicationId(id) {
  return id === null || id === undefined || id === ""
    ? "Not assigned"
    : `APP-${String(id).padStart(4, "0")}`;
}

function formatApplicantId(id) {
  return id === null || id === undefined || id === ""
    ? "N/A"
    : `AP-${String(id).padStart(4, "0")}`;
}

function formatContactNumber(value) {
  return value === null || value === undefined || value === "" ? "Not set" : String(value);
}

function getFileName(value) {
  if (!value) return "No resume";
  const parts = String(value).split("/");
  return parts[parts.length - 1] || String(value);
}

function isHttpUrl(value) {
  const text = String(value || "").trim();
  return text.startsWith("http://") || text.startsWith("https://");
}

function getStoragePath(value, bucketName) {
  const text = String(value || "").trim();

  if (!text) return "";

  if (isHttpUrl(text)) {
    const marker = `/storage/v1/object/public/${bucketName}/`;
    const markerIndex = text.indexOf(marker);

    if (markerIndex !== -1) {
      return decodeURIComponent(text.slice(markerIndex + marker.length));
    }

    try {
      const url = new URL(text);
      return decodeURIComponent(url.pathname.split("/").pop() || "");
    } catch {
      return "";
    }
  }

  const normalized = text.replace(/^\/+/, "");
  const bucketPrefix = `${bucketName}/`;

  return normalized.startsWith(bucketPrefix)
    ? normalized.slice(bucketPrefix.length)
    : normalized;
}

function sanitizeDateInput(value) {
  const text = String(value || "").trim();

  if (!text) return "";

  const match = text.match(/^(\d{1,})-(\d{1,2})-(\d{1,2})$/);

  if (!match) return text;

  const year = match[1].slice(0, 4);
  const month = match[2].padStart(2, "0").slice(0, 2);
  const day = match[3].padStart(2, "0").slice(0, 2);

  if (year.length < 4) return "";

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

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDate(value, fallback = "Not reviewed") {
  if (!value) return fallback;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return fallback;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(raw) : new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { margin: 0, color: BRAND.brown, fontSize: 34, fontWeight: 900, letterSpacing: "-1px" },
  subtitle: { margin: "8px 0 0", color: "#5D5351", fontSize: 15 },
  breadcrumb: { display: "flex", alignItems: "center", gap: 14, color: BRAND.brown, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" },
  chevron: { color: "#9A8C89", fontSize: 22 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 18, marginBottom: 24 },
  statCard: { height: 118, background: "#fff", borderRadius: 16, border: "1px solid #EEE2DF", boxShadow: "0 8px 16px rgba(51,26,18,0.07)", padding: 18, display: "flex", alignItems: "center", gap: 16, boxSizing: "border-box" },
  statIcon: { width: 64, height: 64, minWidth: 64, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center" },
  statPink: { background: "#F9DCE5", color: "#D94D72" },
  statOrange: { background: "#FCEBDD", color: "#F16C08" },
  statGreen: { background: "#DDF3E7", color: "#0D9B4A" },
  statRed: { background: "#FCE2E8", color: "#E11D48" },
  statTitle: { margin: 0, fontSize: 14, fontWeight: 800, color: "#1F1714" },
  statValue: { margin: "4px 0 2px", fontSize: 28, fontWeight: 900, color: BRAND.brown },
  statDesc: { margin: 0, fontSize: 12, color: "#6D5F5B" },
  errorBox: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 18, borderRadius: 10, border: "1px solid #F1BFC5", background: "#FFF0F2", color: "#B42335" },
  errorText: { flex: 1, fontSize: 13, fontWeight: 700 },
  errorClose: { border: "none", background: "transparent", color: "#B42335", cursor: "pointer" },
  successBox: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 18, borderRadius: 10, border: "1px solid #B7E2C9", background: "#ECF9F1", color: "#08783C" },
  successText: { flex: 1, fontSize: 13, fontWeight: 700 },
  successClose: { border: "none", background: "transparent", color: "#08783C", cursor: "pointer", display: "flex", padding: 0 },
  tableCard: { width: "100%", background: "#fff", borderRadius: 16, border: "1px solid #EEE2DF", boxShadow: "0 8px 18px rgba(51,26,18,0.07)", padding: "22px 14px 16px", boxSizing: "border-box" },
  
  // MATCHING BOOKING PAGE FILTER STYLES
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
  
  // MATCHING BOOKING PAGE DATE PANEL
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

  // Rest of the styles remain the same...
  tableWrapper: { width: "100%", overflowX: "auto" },
  table: { width: "100%", minWidth: 1260, borderCollapse: "collapse" },
  tableHeadRow: { background: "#FFFBFA", borderTop: "1px solid #EEE2DF", borderBottom: "1px solid #E7DAD7" },
  th: { textAlign: "left", padding: 14, color: "#16100E", fontSize: 13, fontWeight: 900, whiteSpace: "nowrap" },
  tableRow: { borderBottom: "1px solid #E7DAD7" },
  numberCell: {
    padding: 14,
    color: BRAND.muted,
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  normalCell: { padding: 14, fontSize: 13, color: "#1F1714", whiteSpace: "nowrap" },
  primaryText: { display: "block", fontSize: 13, color: "#1B1412", fontWeight: 800 },
  fileCellButton: { border: "none", background: "transparent", padding: 0, display: "inline-flex", alignItems: "center", gap: 8, color: BRAND.pink, fontSize: 12, fontWeight: 800, cursor: "pointer" },
  petPlaceThumbnail: { width: 54, height: 42, borderRadius: 8, objectFit: "cover", border: "1px solid #E6D9D7", background: "#FFF8F8" },
  resumeFileName: {
    display: "inline-block",
    maxWidth: 150,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },
  mutedCell: { color: BRAND.muted, fontSize: 12 },
  badge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 76, height: 26, borderRadius: 7, fontSize: 12, fontWeight: 800 },
  statusPending: { background: "#FDEADB", color: "#F2650C" },
  statusApproved: { background: "#DDF4E7", color: "#0B8F45" },
  statusRejected: { background: "#FCE2E8", color: "#E11D48" },
  statusDefault: { background: "#EEE9E7", color: "#645854" },
  emptyCell: { padding: 28, textAlign: "center", color: BRAND.muted, fontSize: 14, fontWeight: 700 },
  loadingContent: { display: "inline-flex", alignItems: "center", gap: 10 },
  pagination: { padding: "14px 12px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  pageText: { margin: 0, fontSize: 13, color: "#1F1714" },
  pages: { display: "flex", gap: 6, alignItems: "center" },
  pageBtn: { width: 34, height: 34, borderRadius: 7, border: "1px solid #E6D9D7", background: "#fff", color: "#1F1714", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  activePage: { background: BRAND.pink, color: "#fff", borderColor: BRAND.pink },
  disabledBtn: { opacity: 0.45, cursor: "not-allowed" },
  mediaCard: { gridColumn: "span 2", border: "1px solid #EEE2DF", borderRadius: 12, padding: 14, background: "#FFFCFB", boxSizing: "border-box" },
  mediaHeader: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  mediaLink: { display: "block", textDecoration: "none" },
  petPlaceImage: { width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 10, border: "1px solid #E6D9D7", background: "#FFF8F8" },
  mediaActionText: { display: "inline-block", marginTop: 8, color: BRAND.pink, fontSize: 12, fontWeight: 800 },
  resumeCard: { border: "1px solid #EEE2DF", borderRadius: 12, padding: 14, background: "#FFFCFB", display: "flex", gap: 10, alignItems: "flex-start", minHeight: 82, boxSizing: "border-box" },
  resumeCardContent: { minWidth: 0 },
  modalFileButton: { marginTop: 10, border: "none", background: "transparent", padding: 0, display: "inline-flex", alignItems: "center", gap: 6, color: BRAND.pink, fontSize: 12, fontWeight: 900, cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(35, 20, 16, 0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 },
  modal: {
    width: "min(760px, 100%)",
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
    padding: "18px 22px 22px",
  },
  modalTitle: { margin: 0, color: BRAND.brown, fontSize: 24, fontWeight: 900 },
  modalSubtitle: { margin: "4px 0 0", color: BRAND.pink, fontSize: 13, fontWeight: 800 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 9, border: "1px solid #E6D9D7", background: "#fff", color: BRAND.brown, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  profileTop: { display: "flex", alignItems: "center", gap: 16, paddingBottom: 18, borderBottom: "1px solid #EEE2DF", marginBottom: 18 },
  bigAvatar: { width: 74, height: 74, borderRadius: "50%", background: BRAND.softPink, color: BRAND.pink, display: "flex", alignItems: "center", justifyContent: "center" },
  detailsName: { margin: 0, color: BRAND.brown, fontSize: 22, fontWeight: 900 },
  detailsLocation: { margin: "5px 0 10px", color: "#6D5F5B", fontSize: 13, display: "flex", alignItems: "center", gap: 5 },
  detailsGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
  detailItem: { border: "1px solid #EEE2DF", borderRadius: 12, padding: 14, background: "#FFFCFB", display: "flex", gap: 10, alignItems: "flex-start", minHeight: 82, boxSizing: "border-box" },
  detailIcon: { width: 34, height: 34, borderRadius: 8, background: "#F9DCE5", color: "#D94D72", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  detailLabel: { margin: "0 0 7px", color: "#6D5F5B", fontSize: 12, fontWeight: 900 },
  detailValue: { margin: 0, color: BRAND.text, fontSize: 14, fontWeight: 900, overflowWrap: "anywhere" },
  remarksBox: { marginTop: 14, border: "1px solid #EEE2DF", borderRadius: 12, padding: 14, background: "#FFFCFB" },
  remarksInput: { width: "100%", minHeight: 100, resize: "vertical", border: "1px solid #E2D5D3", borderRadius: 9, padding: 12, fontFamily: "inherit", fontSize: 13, boxSizing: "border-box" },
  readOnlyRemarks: { background: "#F8F3F2", color: BRAND.muted, cursor: "not-allowed" },
  modalActions: {
    minHeight: 72,
    padding: "14px 22px",
    borderTop: "1px solid #EEE2DF",
    background: "#FFFFFF",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flexShrink: 0,
    boxSizing: "border-box",
    boxShadow: "0 -8px 18px rgba(51, 26, 18, 0.06)",
    zIndex: 5,
  },
  reviewCompleteNotice: {
    flexShrink: 0,
    padding: "15px 22px",
    borderTop: "1px solid #D8CDC9",
    background: "#F8F3F2",
    color: BRAND.muted,
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
  },
  rejectModalBtn: { height: 40, borderRadius: 9, border: "none", background: "#FCE2E8", color: "#E11D48", padding: "0 14px", fontSize: 13, fontWeight: 900, cursor: "pointer" },
  approveModalBtn: { height: 40, borderRadius: 9, border: "none", background: BRAND.pink, color: "#fff", padding: "0 16px", fontSize: 13, fontWeight: 900, cursor: "pointer" },
};