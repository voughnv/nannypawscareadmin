import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";
import {
  ChevronLeft,
  ChevronRight,
  User,
  X,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  Image as ImageIcon,
  UserRound,
  CalendarPlus,
  AtSign,
  BarChart3,
  MoreHorizontal,
  Eye,
  Pencil,
  Save,
  Trash2,
  UserPlus,
  KeyRound,
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

const SITTER_FIELDS =
  "petsitter_id, created_at, ps_auth_id, ps_fname, ps_lname, ps_username, ps_contactno, ps_email, ps_place";

// These column names must match the PET SITTER table.
const SITTER_PASSWORD_COLUMN = "ps_password";
const SITTER_AUTH_ID_COLUMN = "ps_auth_id";

// Supabase Auth requires a stronger password than the previous "1234".
const DEFAULT_SITTER_PASSWORD = "NannyPaws@123";

// Add VITE_SITTER_EMAIL_REDIRECT_URL to .env when you have a dedicated
// verification-success page or mobile deep link. Otherwise, the current
// website origin is used.
const SITTER_EMAIL_REDIRECT_URL =
  import.meta.env.VITE_SITTER_EMAIL_REDIRECT_URL ||
  (typeof window !== "undefined" ? window.location.origin : undefined);

// Use a separate non-persistent client so creating a sitter does not replace
// any Auth session used elsewhere in the admin website.
const sitterAuthClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

export default function SittersPage() {
  const requestConfirmation = useConfirmation();

  const [sitters, setSitters] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSitter, setSelectedSitter] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [openActionId, setOpenActionId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSitters();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    function closeActionMenu() {
      setOpenActionId(null);
      setActionMenuPosition(null);
    }

    document.addEventListener("click", closeActionMenu);
    window.addEventListener("resize", closeActionMenu);
    window.addEventListener("scroll", closeActionMenu, true);

    return () => {
      document.removeEventListener("click", closeActionMenu);
      window.removeEventListener("resize", closeActionMenu);
      window.removeEventListener("scroll", closeActionMenu, true);
    };
  }, []);

  async function fetchSitters() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data, error: fetchError } = await supabase
        .from("PET SITTER")
        .select(SITTER_FIELDS)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      setSitters(data || []);
    } catch (fetchError) {
      console.error("Unable to load pet sitters:", fetchError);
      setError(
        fetchError?.message ||
          "Unable to load pet sitters. Please check your Supabase connection and table policies."
      );
    } finally {
      setLoading(false);
    }
  }

  function openSitter(sitter, mode = "view") {
    setOpenActionId(null);
    setActionMenuPosition(null);
    setSelectedSitter(sitter);
    setModalMode(mode);
  }

  function closeSitterModal() {
    setSelectedSitter(null);
    setModalMode("view");
  }

  async function createSitterAccount(formValues) {
    const fullName = formValues.fullName.trim().replace(/\s+/g, " ");
    const username = formValues.username.trim();
    const contactNumber = formValues.contactNumber.trim();
    const email = formValues.email.trim().toLowerCase();

    const { firstName, lastName } = splitFullName(fullName);

    if (!firstName || !lastName) {
      setError("Enter the sitter's complete first and last name.");
      return false;
    }

    if (!username) {
      setError("Username is required.");
      return false;
    }

    if (!contactNumber) {
      setError("Contact number is required.");
      return false;
    }

    if (!email) {
      setError("Email address is required.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return false;
    }

    try {
      const { data: existingSitter, error: checkError } = await supabase
        .from("PET SITTER")
        .select("petsitter_id, ps_email, ps_auth_id")
        .ilike("ps_email", email)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingSitter) {
        setError(
          `The email "${email}" is already registered to a pet sitter account.`
        );
        return false;
      }
    } catch (checkError) {
      console.error("Unable to check the sitter email:", checkError);
      setError(
        checkError?.message ||
          "Unable to verify whether the email is already registered."
      );
      return false;
    }

    const confirmed = await requestConfirmation({
      title: "Create pet sitter account?",
      message: `Create an account for ${fullName} and send a Supabase verification email to ${email}?`,
      confirmText: "Create & Send Email",
      variant: "success",
    });

    if (!confirmed) return false;

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const { data: authData, error: authError } =
        await sitterAuthClient.auth.signUp({
          email,
          password: DEFAULT_SITTER_PASSWORD,
          options: {
            emailRedirectTo: SITTER_EMAIL_REDIRECT_URL,
            data: {
              role: "pet_sitter",
              first_name: firstName,
              last_name: lastName,
              username,
            },
          },
        });

      if (authError) throw authError;

      const authUser = authData?.user;

      if (!authUser?.id) {
        throw new Error(
          "Supabase Auth did not return a user ID. The sitter account was not created."
        );
      }

      // With email confirmation enabled, Supabase can hide whether a confirmed
      // account already exists. An empty identities array is a strong signal
      // that the email already belongs to an Auth account.
      if (
        Array.isArray(authUser.identities) &&
        authUser.identities.length === 0
      ) {
        throw new Error(
          "An authentication account already exists for this email address."
        );
      }

      const payload = {
        [SITTER_AUTH_ID_COLUMN]: authUser.id,
        ps_fname: firstName,
        ps_lname: lastName,
        ps_username: username,
        ps_contactno: contactNumber,
        ps_email: email,
        ps_place: null,
        [SITTER_PASSWORD_COLUMN]: DEFAULT_SITTER_PASSWORD,
      };

      const { data, error: createError } = await supabase
        .from("PET SITTER")
        .insert(payload)
        .select(SITTER_FIELDS)
        .single();

      if (createError) throw createError;

      setSitters((previous) => [...previous, data]);
      setCurrentPage(
        Math.max(1, Math.ceil((sitters.length + 1) / ROWS_PER_PAGE))
      );
      setShowCreatePanel(false);

      setSuccess(
        `${getFullName(
          data
        )}'s account was created. A verification email was sent to ${email}. The sitter must confirm the email before signing in.`
      );

      return true;
    } catch (createError) {
      console.error(
        "Unable to create the pet sitter Auth/profile account:",
        createError
      );

      const errorMessage = String(createError?.message || "");
      const lowerMessage = errorMessage.toLowerCase();

      if (
        lowerMessage.includes("already registered") ||
        lowerMessage.includes("already exists") ||
        lowerMessage.includes("duplicate") ||
        lowerMessage.includes("unique")
      ) {
        setError(
          `The email "${email}" is already linked to an existing account.`
        );
      } else if (
        lowerMessage.includes(SITTER_AUTH_ID_COLUMN.toLowerCase())
      ) {
        setError(
          `The "${SITTER_AUTH_ID_COLUMN}" column is missing or is not configured correctly in the PET SITTER table. Add it as a UUID linked to auth.users.id.`
        );
      } else if (
        lowerMessage.includes(SITTER_PASSWORD_COLUMN.toLowerCase())
      ) {
        setError(
          `The "${SITTER_PASSWORD_COLUMN}" column was not found in the PET SITTER table.`
        );
      } else if (
        lowerMessage.includes("password") &&
        (lowerMessage.includes("characters") ||
          lowerMessage.includes("weak"))
      ) {
        setError(
          "Supabase rejected the temporary password. Update DEFAULT_SITTER_PASSWORD to meet your Auth password rules."
        );
      } else if (
        lowerMessage.includes("rate limit") ||
        lowerMessage.includes("email rate")
      ) {
        setError(
          "Supabase temporarily blocked the verification email because the email rate limit was reached. Wait a moment and try again."
        );
      } else {
        setError(
          createError?.message ||
            "Unable to create the Auth account and pet sitter profile. Check Auth settings, the PET SITTER INSERT policy, and the ps_auth_id column."
        );
      }

      return false;
    } finally {
      setCreating(false);
    }
  }

  async function updateSitter(sitter, formValues) {
    const firstName = formValues.ps_fname.trim();
    const lastName = formValues.ps_lname.trim();
    const username = formValues.ps_username.trim();
    const email = formValues.ps_email.trim().toLowerCase();
    const contactNumber = formValues.ps_contactno.trim();

    if (!firstName || !lastName) {
      setError("First name and last name are required.");
      return false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return false;
    }

    if (
      sitter.ps_auth_id &&
      email !== String(sitter.ps_email || "").trim().toLowerCase()
    ) {
      setError(
        "This email is linked to Supabase Auth and cannot be changed from the Pet Sitters page."
      );
      return false;
    }

    const confirmed = await requestConfirmation({
      title: "Save sitter changes?",
      message: `Update the account information for ${getFullName(sitter)}?`,
      confirmText: "Save Changes",
      variant: "primary",
    });

    if (!confirmed) return false;

    setUpdatingId(sitter.petsitter_id);
    setError("");
    setSuccess("");

    try {
      const { data, error: updateError } = await supabase
        .from("PET SITTER")
        .update({
          ps_fname: firstName,
          ps_lname: lastName,
          ps_username: username || null,
          ps_contactno: contactNumber || null,
          ps_email: email || null,
        })
        .eq("petsitter_id", sitter.petsitter_id)
        .select(SITTER_FIELDS)
        .single();

      if (updateError) throw updateError;

      setSitters((previous) =>
        previous.map((item) =>
          item.petsitter_id === sitter.petsitter_id ? data : item
        )
      );

      setSelectedSitter(data);
      setModalMode("view");
      setSuccess(`${getFullName(data)}'s account was updated successfully.`);
      return true;
    } catch (updateError) {
      console.error("Unable to update pet sitter:", updateError);
      setError(
        updateError?.message ||
          "Unable to update the pet sitter. Check your Supabase UPDATE policy."
      );
      return false;
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteSitter(sitter) {
    const confirmed = await requestConfirmation({
      title: "Delete pet sitter?",
      message: `Delete ${getFullName(
        sitter
      )}'s account permanently? This action cannot be undone.`,
      confirmText: "Delete Sitter",
      variant: "danger",
    });

    if (!confirmed) return false;

    setDeletingId(sitter.petsitter_id);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("PET SITTER")
        .delete()
        .eq("petsitter_id", sitter.petsitter_id);

      if (deleteError) throw deleteError;

      setSitters((previous) =>
        previous.filter(
          (item) => item.petsitter_id !== sitter.petsitter_id
        )
      );

      closeSitterModal();
      setSuccess(`${getFullName(sitter)}'s account was deleted.`);
      return true;
    } catch (deleteError) {
      console.error("Unable to delete pet sitter:", deleteError);
      setError(
        deleteError?.message ||
          "Unable to delete the pet sitter. The account may still be referenced by bookings, or your Supabase DELETE policy may block this action."
      );
      return false;
    } finally {
      setDeletingId(null);
    }
  }

  const filteredSitters = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return sitters;

    return sitters.filter((sitter) => {
      const fullName = `${sitter.ps_fname || ""} ${
        sitter.ps_lname || ""
      }`.trim();

      const searchableValues = [
        sitter.petsitter_id,
        sitter.ps_auth_id,
        formatSitterId(sitter.petsitter_id),
        fullName,
        sitter.ps_fname,
        sitter.ps_lname,
        sitter.ps_username,
        sitter.ps_contactno,
        sitter.ps_email,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return searchableValues.some((value) => value.includes(keyword));
    });
  }, [sitters, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSitters.length / ROWS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedSitters = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredSitters.slice(start, start + ROWS_PER_PAGE);
  }, [filteredSitters, currentPage]);

  const stats = useMemo(() => {
    const now = new Date();

    return {
      total: sitters.length,
      newThisMonth: sitters.filter((sitter) =>
        isSameMonth(sitter.created_at, now)
      ).length,
      addedThisYear: sitters.filter((sitter) =>
        isSameYear(sitter.created_at, now)
      ).length,
    };
  }, [sitters]);

  const firstVisible =
    filteredSitters.length === 0
      ? 0
      : (currentPage - 1) * ROWS_PER_PAGE + 1;

  const lastVisible = Math.min(
    currentPage * ROWS_PER_PAGE,
    filteredSitters.length
  );

  return (
    <>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Pet Sitters</h1>
            <p style={styles.subtitle}>
              View and monitor registered pet sitter accounts.
            </p>
          </div>

          <div style={styles.headerActions}>
            <div style={styles.breadcrumb}>
              <span>Dashboard</span>
              <span style={styles.chevron}>›</span>
              <span>Pet Sitters</span>
            </div>

            <button
              type="button"
              style={styles.addSitterBtn}
              onClick={() => {
                setOpenActionId(null);
                setActionMenuPosition(null);
                setShowCreatePanel(true);
                setError("");
                setSuccess("");
              }}
            >
              <UserPlus size={18} />
              Add Pet Sitter
            </button>
          </div>
        </header>

        <section style={styles.statsGrid}>
          <StatCard
            icon={<UserRound size={30} />}
            iconStyle={styles.statPink}
            title="Total Pet Sitters"
            value={stats.total}
            desc="All registered sitters"
          />

          <StatCard
            icon={<CalendarPlus size={30} />}
            iconStyle={styles.statOrange}
            title="New This Month"
            value={stats.newThisMonth}
            desc="Recently added accounts"
          />

          <StatCard
            icon={<BarChart3 size={30} />}
            iconStyle={styles.statGreen}
            title="Added This Year"
            value={stats.addedThisYear}
            desc="Accounts created this year"
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
            <button style={styles.successClose} onClick={() => setSuccess("")}>
              <X size={18} />
            </button>
          </div>
        )}

        <section style={styles.tableCard}>
          <div style={styles.filters}>
            <div style={styles.searchBox}>
              <Search size={22} color="#5E4B45" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, username, or email"
                style={styles.searchInput}
              />
            </div>

            <button
              style={styles.refreshBtn}
              onClick={fetchSitters}
              disabled={loading}
            >
              <RefreshCw size={19} />
              <span>{loading ? "Loading..." : "Refresh"}</span>
            </button>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <Th>No.</Th>
                  <Th>Full Name</Th>
                  <Th>Username</Th>
                  <Th>Contact Number</Th>
                  <Th>Email Address</Th>
                  <Th>Place Photo</Th>
                  <Th>Date Added</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={styles.emptyCell}>
                      <div style={styles.loadingContent}>
                        <RefreshCw size={22} />
                        <span>Loading pet sitter records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedSitters.length > 0 ? (
                  paginatedSitters.map((sitter, index) => (
                    <tr
                      key={sitter.petsitter_id}
                      style={{ ...styles.tableRow, cursor: "pointer" }}
                      onClick={() => openSitter(sitter)}
                    >
                      <td style={styles.numberCell}>
                        {(currentPage - 1) * ROWS_PER_PAGE + index + 1}
                      </td>

                      <td style={styles.normalCell}>
                        <strong style={styles.primaryText}>
                          {getFullName(sitter)}
                        </strong>
                      </td>

                      <td style={styles.normalCell}>
                        {sitter.ps_username || "Not set"}
                      </td>

                      <td style={styles.normalCell}>
                        {formatContactNumber(sitter.ps_contactno)}
                      </td>

                      <td style={styles.normalCell}>
                        {sitter.ps_email || "Not set"}
                      </td>

                      <td style={styles.normalCell}>
                        <PlacePhotoPreview
                          imageValue={sitter.ps_place}
                          sitterName={getFullName(sitter)}
                        />
                      </td>

                      <td style={styles.normalCell}>
                        {formatDateTime(sitter.created_at)}
                      </td>

                      <td style={styles.actionCell}>
                        <div
                          style={styles.actionMenuWrap}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            style={styles.actionMenuTrigger}
                            aria-label={`Open actions for ${getFullName(sitter)}`}
                            aria-expanded={
                              openActionId === sitter.petsitter_id
                            }
                            title="More actions"
                            onClick={(event) => {
                              event.stopPropagation();

                              if (openActionId === sitter.petsitter_id) {
                                setOpenActionId(null);
                                setActionMenuPosition(null);
                                return;
                              }

                              const buttonRect =
                                event.currentTarget.getBoundingClientRect();
                              const menuWidth = 180;
                              const menuHeight = 148;
                              const gap = 6;
                              const viewportPadding = 8;

                              const hasSpaceBelow =
                                window.innerHeight - buttonRect.bottom >=
                                menuHeight + gap;

                              const top = hasSpaceBelow
                                ? buttonRect.bottom + gap
                                : Math.max(
                                    viewportPadding,
                                    buttonRect.top - menuHeight - gap
                                  );

                              const left = Math.min(
                                Math.max(
                                  viewportPadding,
                                  buttonRect.right - menuWidth
                                ),
                                window.innerWidth -
                                  menuWidth -
                                  viewportPadding
                              );

                              setActionMenuPosition({ top, left });
                              setOpenActionId(sitter.petsitter_id);
                            }}
                          >
                            <MoreHorizontal size={19} />
                          </button>

                          {openActionId === sitter.petsitter_id &&
                            actionMenuPosition &&
                            createPortal(
                              <div
                                style={{
                                  ...styles.actionMenu,
                                  top: actionMenuPosition.top,
                                  left: actionMenuPosition.left,
                                }}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  style={styles.actionMenuItem}
                                  onClick={() => openSitter(sitter, "view")}
                                >
                                  <Eye size={16} />
                                  <span>View Details</span>
                                </button>

                                <button
                                  type="button"
                                  style={styles.actionMenuItem}
                                  onClick={() => openSitter(sitter, "edit")}
                                >
                                  <Pencil size={16} />
                                  <span>Edit Details</span>
                                </button>

                                <div style={styles.actionMenuDivider} />

                                <button
                                  type="button"
                                  style={{
                                    ...styles.actionMenuItem,
                                    ...styles.actionMenuDanger,
                                    ...(deletingId === sitter.petsitter_id
                                      ? styles.disabledAction
                                      : {}),
                                  }}
                                  disabled={
                                    deletingId === sitter.petsitter_id
                                  }
                                  onClick={() => {
                                    setOpenActionId(null);
                                    setActionMenuPosition(null);
                                    deleteSitter(sitter);
                                  }}
                                >
                                  <Trash2 size={16} />
                                  <span>
                                    {deletingId === sitter.petsitter_id
                                      ? "Deleting..."
                                      : "Delete Sitter"}
                                  </span>
                                </button>
                              </div>,
                              document.body
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={styles.emptyCell}>
                      No pet sitters found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <p style={styles.pageText}>
              Showing {firstVisible} to {lastVisible} of{" "}
              {filteredSitters.length} pet sitters
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

      {showCreatePanel &&
        createPortal(
          <AddSitterPanel
            creating={creating}
            defaultPassword={DEFAULT_SITTER_PASSWORD}
            onClose={() => {
              if (!creating) {
                setShowCreatePanel(false);
              }
            }}
            onCreate={createSitterAccount}
          />,
          document.body
        )}

      {selectedSitter && (
        <SitterModal
          sitter={selectedSitter}
          initialEditing={modalMode === "edit"}
          updating={updatingId === selectedSitter.petsitter_id}
          deleting={deletingId === selectedSitter.petsitter_id}
          onClose={closeSitterModal}
          onUpdate={updateSitter}
          onDelete={deleteSitter}
        />
      )}
    </>
  );
}

function StatCard({
  icon,
  iconStyle,
  title,
  value,
  desc,
  compactValue = false,
}) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, ...iconStyle }}>{icon}</div>
      <div style={styles.statContent}>
        <p style={styles.statTitle}>{title}</p>
        <h2
          style={
            compactValue
              ? { ...styles.statValue, ...styles.statValueCompact }
              : styles.statValue
          }
          title={String(value)}
        >
          {value}
        </h2>
        <p style={styles.statDesc}>{desc}</p>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th style={styles.th}>{children}</th>;
}

function AddSitterPanel({
  creating,
  defaultPassword,
  onClose,
  onCreate,
}) {
  const [formValues, setFormValues] = useState({
    fullName: "",
    username: "",
    contactNumber: "",
    email: "",
  });

  function updateField(field, value) {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreate(formValues);
  }

  return (
    <div
      style={styles.createPanelOverlay}
      onClick={creating ? undefined : onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-sitter-title"
        style={styles.createPanel}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.createPanelHeader}>
          <div>
            <p style={styles.createPanelEyebrow}>ACCOUNT CREATION</p>
            <h2 id="create-sitter-title" style={styles.createPanelTitle}>
              Add Pet Sitter
            </h2>
            <p style={styles.createPanelSubtitle}>
              Create an Auth account and send email verification to an approved sitter.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close account creation form"
            style={{
              ...styles.closeBtn,
              ...(creating ? styles.disabledAction : {}),
            }}
            disabled={creating}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.createForm}>
          <CreateField
            label="Full Name"
            placeholder="e.g. Michael Jordan"
            value={formValues.fullName}
            onChange={(value) => updateField("fullName", value)}
            icon={<UserRound size={18} />}
            autoComplete="name"
            required
          />

          <CreateField
            label="Username"
            placeholder="e.g. michaeljordan321"
            value={formValues.username}
            onChange={(value) => updateField("username", value)}
            icon={<AtSign size={18} />}
            autoComplete="username"
            required
          />

          <CreateField
            label="Contact Number"
            placeholder="e.g. 09171234567"
            value={formValues.contactNumber}
            onChange={(value) => updateField("contactNumber", value)}
            icon={<Phone size={18} />}
            inputMode="tel"
            autoComplete="tel"
            required
          />

          <CreateField
            label="Email Address"
            placeholder="e.g. michaeljordan@gmail.com"
            value={formValues.email}
            onChange={(value) => updateField("email", value)}
            icon={<Mail size={18} />}
            type="email"
            autoComplete="email"
            required
          />

          <label style={styles.createField}>
            <span style={styles.createFieldLabel}>Default Password</span>

            <div style={styles.createInputWrap}>
              <KeyRound size={18} />
              <input
                type="text"
                value={defaultPassword}
                readOnly
                style={{
                  ...styles.createInput,
                  ...styles.readOnlyInput,
                }}
              />
            </div>

            <span style={styles.createFieldNote}>
              The sitter will use this temporary password after confirming the
              verification email. They should change it after the first login.
            </span>
          </label>

          <div style={styles.createPanelFooter}>
            <button
              type="button"
              style={{
                ...styles.createCancelBtn,
                ...(creating ? styles.disabledAction : {}),
              }}
              disabled={creating}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                ...styles.createSubmitBtn,
                ...(creating ? styles.disabledAction : {}),
              }}
              disabled={creating}
            >
              <UserPlus size={17} />
              {creating ? "Creating..." : "Create & Send Verification"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function CreateField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  required = false,
}) {
  return (
    <label style={styles.createField}>
      <span style={styles.createFieldLabel}>
        {label}
        {required ? " *" : ""}
      </span>

      <div style={styles.createInputWrap}>
        {icon}
        <input
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          style={styles.createInput}
        />
      </div>
    </label>
  );
}

function SitterModal({
  sitter,
  initialEditing,
  updating,
  deleting,
  onClose,
  onUpdate,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [formValues, setFormValues] = useState(() => getSitterFormValues(sitter));

  useEffect(() => {
    setIsEditing(initialEditing);
    setFormValues(getSitterFormValues(sitter));
  }, [sitter, initialEditing]);

  function updateField(field, value) {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function cancelEditing() {
    setFormValues(getSitterFormValues(sitter));
    setIsEditing(false);
  }

  async function handleSave() {
    const saved = await onUpdate(sitter, formValues);

    if (saved) {
      setIsEditing(false);
    }
  }

  const busy = updating || deleting;

  return (
    <div style={styles.modalOverlay} onClick={busy ? undefined : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sitter-modal-title"
        style={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <div>
            <h2 id="sitter-modal-title" style={styles.modalTitle}>
              {isEditing ? "Edit Pet Sitter" : "Pet Sitter Details"}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close sitter details"
            style={{
              ...styles.closeBtn,
              ...(busy ? styles.disabledAction : {}),
            }}
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div style={styles.modalProfile}>
          <div style={styles.modalAvatar}>
            <UserRound size={32} />
          </div>

          <div>
            <h3 style={styles.modalName}>{getFullName(sitter)}</h3>
            <p style={styles.modalUsername}>
              @{sitter.ps_username || "no-username"}
            </p>
          </div>
        </div>

        {isEditing ? (
          <div style={styles.modalGrid}>
            <DetailItem
              icon={<UserRound size={18} />}
              label="Pet Sitter ID"
              value={formatSitterId(sitter.petsitter_id)}
            />

            <DetailItem
              icon={<CalendarPlus size={18} />}
              label="Date Added"
              value={formatDateTime(sitter.created_at)}
            />

            <EditField
              icon={<User size={18} />}
              label="First Name"
              value={formValues.ps_fname}
              onChange={(value) => updateField("ps_fname", value)}
              required
            />

            <EditField
              icon={<User size={18} />}
              label="Last Name"
              value={formValues.ps_lname}
              onChange={(value) => updateField("ps_lname", value)}
              required
            />

            <EditField
              icon={<AtSign size={18} />}
              label="Username"
              value={formValues.ps_username}
              onChange={(value) => updateField("ps_username", value)}
            />

            <EditField
              icon={<Mail size={18} />}
              label="Email Address"
              type="email"
              value={formValues.ps_email}
              onChange={(value) => updateField("ps_email", value)}
              disabled={Boolean(sitter.ps_auth_id)}
              note={
                sitter.ps_auth_id
                  ? "Linked to Supabase Auth. Change it through a secure Auth update flow."
                  : ""
              }
            />

              <div style={styles.fullWidthItem}>
              <EditField
                icon={<Phone size={18} />}
                label="Contact Number"
                value={formValues.ps_contactno}
                onChange={(value) => updateField("ps_contactno", value)}
              />
            </div>

            <PlacePhotoCard
              imageValue={sitter.ps_place}
              sitterName={getFullName(sitter)}
              note="This photo is uploaded and managed by the pet sitter after logging in. Administrators cannot edit it."
            />
          </div>
        ) : (
          <div style={styles.modalGrid}>
            <DetailItem
              icon={<UserRound size={18} />}
              label="Pet Sitter ID"
              value={formatSitterId(sitter.petsitter_id)}
            />
            <DetailItem
              icon={<User size={18} />}
              label="First Name"
              value={sitter.ps_fname || "Not set"}
            />
            <DetailItem
              icon={<User size={18} />}
              label="Last Name"
              value={sitter.ps_lname || "Not set"}
            />
            <DetailItem
              icon={<AtSign size={18} />}
              label="Username"
              value={sitter.ps_username || "Not set"}
            />
            <DetailItem
              icon={<Mail size={18} />}
              label="Email Address"
              value={sitter.ps_email || "Not set"}
            />
            <DetailItem
              icon={<Phone size={18} />}
              label="Contact Number"
              value={formatContactNumber(sitter.ps_contactno)}
            />
            <PlacePhotoCard
              imageValue={sitter.ps_place}
              sitterName={getFullName(sitter)}
            />
            <div style={styles.fullWidthItem}>
            <DetailItem
              icon={<CalendarPlus size={18} />}
              label="Date Added"
              value={formatDateTime(sitter.created_at)}
            />
          </div>
          </div>
        )}

        <div style={styles.modalFooter}>
          <button
            type="button"
            style={{
              ...styles.deleteModalBtn,
              ...(busy ? styles.disabledAction : {}),
            }}
            disabled={busy}
            onClick={() => onDelete(sitter)}
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete Sitter"}
          </button>

          <div style={styles.modalFooterRight}>
            {isEditing ? (
              <>
                <button
                  type="button"
                  style={{
                    ...styles.cancelEditBtn,
                    ...(busy ? styles.disabledAction : {}),
                  }}
                  disabled={busy}
                  onClick={cancelEditing}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.saveChangesBtn,
                    ...(busy ? styles.disabledAction : {}),
                  }}
                  disabled={busy}
                  onClick={handleSave}
                >
                  <Save size={16} />
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  style={{
                    ...styles.editModalBtn,
                    ...(busy ? styles.disabledAction : {}),
                  }}
                  disabled={busy}
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil size={16} />
                  Edit Details
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.closeModalBtn,
                    ...(busy ? styles.disabledAction : {}),
                  }}
                  disabled={busy}
                  onClick={onClose}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditField({
  icon,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  note = "",
}) {
  return (
    <label style={styles.editField}>
      <div style={styles.detailIcon}>{icon}</div>

      <div style={styles.editFieldContent}>
        <span style={styles.detailLabel}>
          {label}
          {required ? " *" : ""}
        </span>

        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          style={{
            ...styles.editInput,
            ...(disabled ? styles.disabledEditInput : {}),
          }}
        />

        {note && <span style={styles.editFieldNote}>{note}</span>}
      </div>
    </label>
  );
}

function PlacePhotoPreview({ imageValue, sitterName }) {
  const imageUrl = getPlaceImageUrl(imageValue);

  if (!imageUrl) {
    return <span style={styles.mutedCell}>Not set</span>;
  }

  return (
    <a
      href={imageUrl}
      target="_blank"
      rel="noreferrer"
      style={styles.placePreviewLink}
      onClick={(event) => event.stopPropagation()}
      title="Open place photo"
    >
      <img
        src={imageUrl}
        alt={`${sitterName} place`}
        style={styles.placeThumbnail}
      />
      <span>View Image</span>
    </a>
  );
}

function PlacePhotoCard({ imageValue, sitterName, note }) {
  const imageUrl = getPlaceImageUrl(imageValue);

  return (
    <div style={styles.placePhotoCard}>
      <div style={styles.placePhotoHeader}>
        <div style={styles.detailIcon}>
          <ImageIcon size={18} />
        </div>

        <div style={styles.detailText}>
          <p style={styles.detailLabel}>Place Photo</p>
          <h4 style={styles.detailValue}>
            {imageUrl ? "Uploaded by pet sitter" : "Not set"}
          </h4>
        </div>
      </div>

      {imageUrl && (
        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          style={styles.placePhotoLink}
        >
          <img
            src={imageUrl}
            alt={`${sitterName} place`}
            style={styles.placePhotoImage}
          />
          <span style={styles.placePhotoAction}>Open full image</span>
        </a>
      )}

      {note && <p style={styles.placePhotoNote}>{note}</p>}
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div style={styles.detailItem}>
      <div style={styles.detailIcon}>{icon}</div>
      <div style={styles.detailText}>
        <p style={styles.detailLabel}>{label}</p>
        <h4 style={styles.detailValue}>{value}</h4>
      </div>
    </div>
  );
}

function getSitterFormValues(sitter) {
  return {
    ps_fname: String(sitter?.ps_fname || ""),
    ps_lname: String(sitter?.ps_lname || ""),
    ps_username: String(sitter?.ps_username || ""),
    ps_contactno: String(sitter?.ps_contactno || ""),
    ps_email: String(sitter?.ps_email || ""),
  };
}

function getPlaceImageUrl(value) {
  const text = String(value || "").trim();

  if (text.startsWith("http://") || text.startsWith("https://")) {
    return text;
  }

  return "";
}

function splitFullName(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length < 2) {
    return {
      firstName: parts[0] || "",
      lastName: "",
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function getFullName(sitter) {
  const fullName = `${sitter.ps_fname || ""} ${sitter.ps_lname || ""}`.trim();
  return fullName || "Name not set";
}

function formatSitterId(id) {
  if (id === null || id === undefined || id === "") return "N/A";
  return `PS-${String(id).padStart(4, "0")}`;
}

function formatContactNumber(contactNumber) {
  if (contactNumber === null || contactNumber === undefined || contactNumber === "") {
    return "Not set";
  }

  return String(contactNumber);
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

function isSameMonth(dateValue, comparisonDate) {
  if (!dateValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === comparisonDate.getFullYear() &&
    date.getMonth() === comparisonDate.getMonth()
  );
}

function isSameYear(dateValue, comparisonDate) {
  if (!dateValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return false;

  return date.getFullYear() === comparisonDate.getFullYear();
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
    gap: 20,
    marginBottom: 24,
  },

  headerActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 12,
  },

  addSitterBtn: {
    height: 44,
    border: "none",
    borderRadius: 9,
    background: BRAND.pink,
    color: "#FFFFFF",
    padding: "0 17px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 8px 16px rgba(217, 67, 104, 0.20)",
    whiteSpace: "nowrap",
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
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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

  statContent: {
    minWidth: 0,
    flex: 1,
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
    padding: "0 12px 22px",
    gap: 16,
    flexWrap: "wrap",
  },

  searchBox: {
    flex: 1,
    maxWidth: 520,
    minWidth: 280,
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
    padding: "0 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: 1080,
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

  mutedCell: {
    color: BRAND.muted,
    fontSize: 12,
    fontWeight: 700,
  },

  placePreviewLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: BRAND.pink,
    fontSize: 12,
    fontWeight: 900,
    textDecoration: "none",
  },

  placeThumbnail: {
    width: 54,
    height: 42,
    borderRadius: 8,
    objectFit: "cover",
    border: "1px solid #E6D9D7",
    background: "#FFF8F8",
  },

  primaryText: {
    display: "block",
    fontSize: 13,
    color: "#1B1412",
    fontWeight: 800,
  },

  actionCell: {
    padding: 14,
    width: 70,
    whiteSpace: "nowrap",
    position: "relative",
  },

  actionMenuWrap: {
    position: "relative",
    display: "inline-flex",
  },

  actionMenuTrigger: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "1px solid #E6D9D7",
    background: "#FFFFFF",
    color: BRAND.brown,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  actionMenu: {
    position: "fixed",
    width: 180,
    padding: 6,
    borderRadius: 10,
    border: "1px solid #EEE2DF",
    background: "#FFFFFF",
    boxShadow: "0 12px 28px rgba(51, 26, 18, 0.16)",
    zIndex: 1000,
  },

  actionMenuItem: {
    width: "100%",
    minHeight: 38,
    padding: "0 10px",
    border: "none",
    borderRadius: 7,
    background: "transparent",
    color: BRAND.brown,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    fontWeight: 800,
    textAlign: "left",
    cursor: "pointer",
  },

  actionMenuDivider: {
    height: 1,
    margin: "5px 4px",
    background: "#EEE2DF",
  },

  actionMenuDanger: {
    color: "#C42435",
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

  createPanelOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 900,
    padding: 20,
    background: "rgba(35, 20, 16, 0.38)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  createPanel: {
    width: "min(480px, 100%)",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
    borderRadius: 18,
    border: "1px solid #EEE2DF",
    background: "#FFFFFF",
    boxShadow: "0 24px 60px rgba(51, 26, 18, 0.28)",
    padding: 22,
    boxSizing: "border-box",
  },

  createPanelHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    paddingBottom: 17,
    marginBottom: 18,
    borderBottom: "1px solid #EEE2DF",
  },

  createPanelEyebrow: {
    margin: "0 0 5px",
    color: BRAND.pink,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.8px",
  },

  createPanelTitle: {
    margin: 0,
    color: BRAND.brown,
    fontSize: 24,
    fontWeight: 900,
  },

  createPanelSubtitle: {
    margin: "6px 0 0",
    color: BRAND.muted,
    fontSize: 13,
    lineHeight: 1.45,
  },

  createForm: {
    display: "flex",
    flexDirection: "column",
    gap: 15,
  },

  createField: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  createFieldLabel: {
    color: BRAND.brown,
    fontSize: 13,
    fontWeight: 900,
  },

  createInputWrap: {
    height: 46,
    border: "1px solid #E2D5D3",
    borderRadius: 9,
    background: "#FFFFFF",
    color: "#6C5B56",
    padding: "0 13px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxSizing: "border-box",
  },

  createInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: BRAND.text,
    fontFamily: "inherit",
    fontSize: 14,
  },

  readOnlyInput: {
    fontWeight: 900,
    color: BRAND.pink,
  },

  createFieldNote: {
    color: BRAND.muted,
    fontSize: 11,
    lineHeight: 1.45,
  },

  createPanelFooter: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 9,
    marginTop: 9,
    paddingTop: 18,
    borderTop: "1px solid #EEE2DF",
  },

  createCancelBtn: {
    height: 42,
    borderRadius: 9,
    border: "1px solid #E6D9D7",
    background: "#FFFFFF",
    color: BRAND.brown,
    padding: "0 16px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },

  createSubmitBtn: {
    height: 42,
    borderRadius: 9,
    border: "none",
    background: BRAND.pink,
    color: "#FFFFFF",
    padding: "0 17px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
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

  modalSubtitle: {
    margin: "4px 0 0",
    color: BRAND.pink,
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

  modalProfile: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
    padding: 16,
    border: "1px solid #EEE2DF",
    borderRadius: 14,
    background: "#FFF9F8",
  },

  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: BRAND.softPink,
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  modalName: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: BRAND.brown,
  },

  modalUsername: {
    margin: "5px 0 0",
    color: BRAND.muted,
    fontSize: 13,
    fontWeight: 700,
  },

  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

    fullWidthItem: {
    gridColumn: "1 / -1",
  },
  
  placePhotoCard: {
    gridColumn: "span 2",
    border: "1px solid #EEE2DF",
    borderRadius: 12,
    padding: 14,
    background: "#FFFCFB",
    boxSizing: "border-box",
  },

  placePhotoHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },

  placePhotoLink: {
    display: "block",
    marginTop: 12,
    textDecoration: "none",
  },

  placePhotoImage: {
    width: "100%",
    maxHeight: 280,
    borderRadius: 10,
    border: "1px solid #E6D9D7",
    objectFit: "cover",
    background: "#FFF8F8",
  },

  placePhotoAction: {
    display: "inline-block",
    marginTop: 8,
    color: BRAND.pink,
    fontSize: 12,
    fontWeight: 900,
  },

  placePhotoNote: {
    margin: "10px 0 0",
    color: BRAND.muted,
    fontSize: 11,
    lineHeight: 1.5,
  },

  detailItem: {
    border: "1px solid #EEE2DF",
    borderRadius: 12,
    padding: 14,
    background: "#FFFCFB",
    minHeight: 82,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },

  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: BRAND.softPink,
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  detailText: {
    minWidth: 0,
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

  editField: {
    border: "1px solid #EEE2DF",
    borderRadius: 12,
    padding: 14,
    background: "#FFFCFB",
    minHeight: 82,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },

  editFieldContent: {
    minWidth: 0,
    flex: 1,
  },

  editInput: {
    width: "100%",
    height: 36,
    border: "1px solid #E2D5D3",
    borderRadius: 8,
    padding: "0 10px",
    color: BRAND.text,
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: 13,
  },

  disabledEditInput: {
    background: "#F4EFED",
    color: BRAND.muted,
    cursor: "not-allowed",
  },

  editFieldNote: {
    display: "block",
    marginTop: 7,
    color: BRAND.muted,
    fontSize: 10,
    lineHeight: 1.4,
  },

  modalFooter: {
    marginTop: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  modalFooterRight: {
    display: "flex",
    alignItems: "center",
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
    gap: 7,
  },

  editModalBtn: {
    height: 40,
    borderRadius: 9,
    border: "1px solid #E6D9D7",
    background: "#fff",
    color: BRAND.brown,
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  },

  cancelEditBtn: {
    height: 40,
    borderRadius: 9,
    border: "1px solid #E6D9D7",
    background: "#fff",
    color: BRAND.brown,
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },

  saveChangesBtn: {
    height: 40,
    borderRadius: 9,
    border: "none",
    background: BRAND.pink,
    color: "#fff",
    padding: "0 16px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
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

  disabledAction: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
};