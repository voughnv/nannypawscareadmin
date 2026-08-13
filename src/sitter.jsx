import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  Dog,
  Cat,
  PawPrint,
  Clock3,
  MoreHorizontal,
  Eye,
  Pencil,
  Save,
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

const SITTER_FIELDS =
  "petsitter_id, created_at, ps_auth_id, ps_fname, ps_lname, ps_username, ps_contactno, ps_email, ps_place";

const PREFERRED_DAY_OPTIONS = [
  { name: "Monday", short: "Mon", letter: "M" },
  { name: "Tuesday", short: "Tue", letter: "T" },
  { name: "Wednesday", short: "Wed", letter: "W" },
  { name: "Thursday", short: "Thu", letter: "T" },
  { name: "Friday", short: "Fri", letter: "F" },
  { name: "Saturday", short: "Sat", letter: "S" },
  { name: "Sunday", short: "Sun", letter: "S" },
];

const PLACE_BUCKET_CANDIDATES = [
  import.meta.env.VITE_APPLICANT_PLACE_BUCKET,
  "PET_PLACE",
  "PET PLACE",
  "pet-place",
  "pet_place",
  "PLACE",
  "place",
].filter(Boolean);

// Approved applicants will be converted into pet sitter accounts
// from the Applicants page. This page only displays and manages
// the resulting PET SITTER records.

export default function SittersPage() {
  const requestConfirmation = useConfirmation();

  const [sitters, setSitters] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSitter, setSelectedSitter] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [openActionId, setOpenActionId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);
  const [cardFilter, setCardFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [placePreview, setPlacePreview] = useState(null);
  const [openingPlaceId, setOpeningPlaceId] = useState(null);

  useEffect(() => {
    fetchSitters();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, cardFilter]);

  useEffect(() => {
    return () => {
      revokePlacePreviewUrls(placePreview);
    };
  }, [placePreview]);

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
      const [
        sitterResult,
        applicantResult,
        applicationResult,
      ] = await Promise.all([
        supabase
          .from("PET SITTER")
          .select(SITTER_FIELDS)
          .order("created_at", {
            ascending: true,
          }),

        /*
          The accepted Pet Sitter is linked back to the original
          applicant through the same email address. APPLICANT is also
          retained as the fallback source for the complete Pet Place
          photo collection.
        */
        supabase
          .from("APPLICANT")
          .select("*"),

        /*
          Pet preference and availability belong to APPLICATION.
          The Admin Pet Sitter page reads the latest application for
          the matched applicant instead of duplicating those values
          into the PET SITTER table.
        */
        supabase
          .from("APPLICATION")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (sitterResult.error) {
        throw sitterResult.error;
      }

      if (applicantResult.error) {
        throw new Error(
          applicantResult.error?.message ||
            "Unable to load the applicant records linked to Pet Sitters."
        );
      }

      if (applicationResult.error) {
        throw new Error(
          applicationResult.error?.message ||
            "Unable to load Pet Sitter application preferences."
        );
      }

      const applicants =
        applicantResult.data || [];

      const applications =
        applicationResult.data || [];

      const applicantByEmail = new Map(
        applicants
          .map((applicant) => [
            normalizeEmail(
              applicant.a_email
            ),
            applicant,
          ])
          .filter(([email]) =>
            Boolean(email)
          )
      );

      /*
        APPLICATION is ordered newest first. Keep the first record for
        each applicant so the Pet Sitter page reflects the most recent
        submitted application preferences if multiple records exist.
      */
      const latestApplicationByApplicantId =
        new Map();

      for (const application of applications) {
        const applicantId =
          Number(application.a_id);

        if (
          !Number.isFinite(applicantId) ||
          latestApplicationByApplicantId.has(
            applicantId
          )
        ) {
          continue;
        }

        latestApplicationByApplicantId.set(
          applicantId,
          application
        );
      }

      const mergedSitters = (
        sitterResult.data || []
      ).map((sitter) => {
        const applicant =
          applicantByEmail.get(
            normalizeEmail(
              sitter.ps_email
            )
          );

        const application =
          applicant
            ? latestApplicationByApplicantId.get(
                Number(
                  applicant.applicant_id
                )
              )
            : null;

        const sitterImages =
          parsePlaceImages(
            sitter.ps_place
          );

        const applicantImages =
          getApplicantPlaceImages(
            applicant
          );

        /*
          Use the Applicant photo set when it contains more photos.
          This keeps already-accepted Pet Sitters compatible with the
          newer multi-photo application flow.
        */
        const placeImages =
          applicantImages.length >
          sitterImages.length
            ? applicantImages
            : sitterImages;

        return {
          ...sitter,

          applicant_id:
            applicant?.applicant_id ??
            null,

          application_id:
            application?.application_id ??
            null,

          application_status:
            application?.application_status ??
            null,

          preferred_days:
            application?.preferred_days ??
            [],

          preferred_start_time:
            application?.preferred_start_time ??
            null,

          preferred_end_time:
            application?.preferred_end_time ??
            null,

          preferred_pet_type:
            application?.preferred_pet_type ??
            null,

          place_images:
            placeImages,
        };
      });

      setSitters(mergedSitters);

      /*
        Keep an open details modal synchronized after Refresh.
      */
      setSelectedSitter((previous) =>
        previous
          ? mergedSitters.find(
              (item) =>
                item.petsitter_id ===
                previous.petsitter_id
            ) || null
          : null
      );
    } catch (fetchError) {
      console.error(
        "Unable to load pet sitters:",
        fetchError
      );

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

  async function updateSitter(sitter, formValues) {
    const firstName = formValues.ps_fname
      .trim()
      .replace(/\s+/g, " ");

    const lastName = formValues.ps_lname
      .trim()
      .replace(/\s+/g, " ");

    const username = formValues.ps_username.trim();

    const email = formValues.ps_email
      .trim()
      .toLowerCase();

    const contactNumber =
      formValues.ps_contactno.trim();

    if (!firstName) {
      return {
        success: false,
        fieldErrors: {
          ps_fname: "First name is required.",
        },
      };
    }

    if (!lastName) {
      return {
        success: false,
        fieldErrors: {
          ps_lname: "Last name is required.",
        },
      };
    }

    if (!username) {
      return {
        success: false,
        fieldErrors: {
          ps_username: "Username is required.",
        },
      };
    }

    if (!/^[A-Za-z0-9_]{4,20}$/.test(username)) {
      return {
        success: false,
        fieldErrors: {
          ps_username:
            "Username must be 4 to 20 characters using only letters, numbers, and underscores.",
        },
      };
    }

    if (!/^\d{11}$/.test(contactNumber)) {
      return {
        success: false,
        fieldErrors: {
          ps_contactno:
            "Contact number must contain exactly 11 digits.",
        },
      };
    }

    if (!email) {
      return {
        success: false,
        fieldErrors: {
          ps_email: "Email address is required.",
        },
      };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        fieldErrors: {
          ps_email: "Enter a valid email address.",
        },
      };
    }

    if (
      sitter.ps_auth_id &&
      email !==
        String(sitter.ps_email || "")
          .trim()
          .toLowerCase()
    ) {
      return {
        success: false,
        fieldErrors: {
          ps_email:
            "This email is linked to the sitter’s login account and cannot be changed here.",
        },
      };
    }

    const confirmed = await requestConfirmation({
      title: "Save pet sitter changes?",
      message: `Save the changes made to ${getFullName(
        sitter
      )}’s account information?`,
      confirmText: "Save Changes",
      variant: "primary",
    });

    if (!confirmed) {
      return {
        success: false,
        cancelled: true,
      };
    }

    setUpdatingId(sitter.petsitter_id);
    setError("");
    setSuccess("");

    try {
      const { data, error: updateError } =
        await supabase
          .from("PET SITTER")
          .update({
            ps_fname: firstName,
            ps_lname: lastName,
            ps_username: username,
            ps_contactno: contactNumber,
            ps_email: email,
          })
          .eq(
            "petsitter_id",
            sitter.petsitter_id
          )
          .select(SITTER_FIELDS)
          .single();

      if (updateError) throw updateError;

      setSitters((previous) =>
        previous.map((item) =>
          item.petsitter_id ===
          sitter.petsitter_id
            ? {
                ...item,
                ...data,
              }
            : item
        )
      );

      closeSitterModal();

      setSuccess(
        `${getFullName(
          data
        )}’s account information was updated successfully.`
      );

      return { success: true };
    } catch (updateError) {
      console.error(
        "Unable to update pet sitter:",
        updateError
      );

      const message = String(
        updateError?.message || ""
      ).toLowerCase();

      if (
        message.includes("duplicate") ||
        message.includes("unique")
      ) {
        return {
          success: false,
          formError:
            "One or more entered values are already registered. Review the highlighted fields.",
        };
      }

      return {
        success: false,
        formError:
          updateError?.message ||
          "Unable to update the pet sitter. Check the database update policy.",
      };
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

  async function openPlacePreview(
    sitter,
    initialIndex = 0
  ) {
    const images =
      getSitterPlaceImages(sitter);

    if (!images.length) {
      setError(
        "No Pet Place photos are available for this pet sitter."
      );
      return;
    }

    setOpeningPlaceId(
      sitter.petsitter_id
    );
    setError("");

    try {
      const resolved =
        await Promise.all(
          images.map((imageValue) =>
            resolvePlaceImage(
              imageValue
            )
          )
        );

      closePlacePreview();

      setPlacePreview({
        title: `${getFullName(
          sitter
        )} - Pet Place Photos`,

        urls: resolved.map(
          (item) => item.url
        ),

        filenames: images.map(
          getPlaceFileName
        ),

        revokeUrls: resolved
          .filter(
            (item) =>
              item.revokeOnClose
          )
          .map(
            (item) => item.url
          ),

        initialIndex: Math.min(
          Math.max(
            Number(initialIndex) || 0,
            0
          ),
          Math.max(
            resolved.length - 1,
            0
          )
        ),
      });
    } catch (previewError) {
      console.error(
        "Unable to open Pet Place photos:",
        previewError
      );

      setError(
        previewError?.message ||
          "Unable to open the Pet Place photos."
      );
    } finally {
      setOpeningPlaceId(null);
    }
  }

  function closePlacePreview() {
    setPlacePreview(
      (previous) => {
        revokePlacePreviewUrls(
          previous
        );

        return null;
      }
    );
  }

  const filteredSitters = useMemo(() => {
    const now = new Date();

    let records = sitters;

    if (cardFilter === "month") {
      records = records.filter((sitter) =>
        isSameMonth(
          sitter.created_at,
          now
        )
      );
    } else if (
      cardFilter === "dog" ||
      cardFilter === "cat" ||
      cardFilter === "both"
    ) {
      records = records.filter(
        (sitter) =>
          normalizePreferredPetType(
            sitter.preferred_pet_type
          ) === cardFilter
      );
    }

    const keyword = search
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    if (!keyword) return records;

    return records.filter((sitter) => {
      const fullName = `${sitter.ps_fname || ""} ${
        sitter.ps_lname || ""
      }`
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

      const rawSitterId = String(
        sitter.petsitter_id ?? ""
      ).toLowerCase();

      const formattedSitterId = formatSitterId(
        sitter.petsitter_id
      ).toLowerCase();

      const username = String(
        sitter.ps_username || ""
      ).toLowerCase();

      const email = String(
        sitter.ps_email || ""
      ).toLowerCase();

      return (
        fullName.includes(keyword) ||
        rawSitterId.includes(keyword) ||
        formattedSitterId.includes(keyword) ||
        username.includes(keyword) ||
        email.includes(keyword)
      );
    });
  }, [sitters, search, cardFilter]);

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

      newThisMonth:
        sitters.filter((sitter) =>
          isSameMonth(
            sitter.created_at,
            now
          )
        ).length,

      prefDog:
        sitters.filter(
          (sitter) =>
            normalizePreferredPetType(
              sitter.preferred_pet_type
            ) === "dog"
        ).length,

      prefCat:
        sitters.filter(
          (sitter) =>
            normalizePreferredPetType(
              sitter.preferred_pet_type
            ) === "cat"
        ).length,

      prefBoth:
        sitters.filter(
          (sitter) =>
            normalizePreferredPetType(
              sitter.preferred_pet_type
            ) === "both"
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

          <div style={styles.breadcrumb}>
            <span>Dashboard</span>
            <span style={styles.chevron}>›</span>
            <span>Pet Sitters</span>
          </div>
        </header>

        <section style={styles.statsGrid}>
          <StatCard
            icon={<UserRound size={29} />}
            iconStyle={styles.statPink}
            title="Total Pet Sitters"
            value={stats.total}
            desc="All registered sitters"
            active={cardFilter === "all"}
            onClick={() =>
              setCardFilter("all")
            }
          />

          <StatCard
            icon={<CalendarPlus size={29} />}
            iconStyle={styles.statOrange}
            title="New This Month"
            value={stats.newThisMonth}
            desc="Recently added accounts"
            active={cardFilter === "month"}
            onClick={() =>
              setCardFilter("month")
            }
          />

          <StatCard
            icon={<Dog size={29} />}
            iconStyle={styles.statBlue}
            title="Pref Dog"
            value={stats.prefDog}
            desc="Prefer caring for dogs"
            active={cardFilter === "dog"}
            onClick={() =>
              setCardFilter("dog")
            }
          />

          <StatCard
            icon={<Cat size={29} />}
            iconStyle={styles.statPurple}
            title="Pref Cat"
            value={stats.prefCat}
            desc="Prefer caring for cats"
            active={cardFilter === "cat"}
            onClick={() =>
              setCardFilter("cat")
            }
          />

          <StatCard
            icon={<PawPrint size={29} />}
            iconStyle={styles.statGreen}
            title="Both"
            value={stats.prefBoth}
            desc="Prefer dogs and cats"
            active={cardFilter === "both"}
            onClick={() =>
              setCardFilter("both")
            }
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
                placeholder="Search ID, name, username, or email"
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
              <colgroup>
                <col style={{ width: "6%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "3%" }} />
              </colgroup>

              <thead>
                <tr style={styles.tableHeadRow}>
                  <Th>No.</Th>
                  <Th>Full Name</Th>
                  <Th>Username</Th>
                  <Th>Contact Number</Th>
                  <Th>Email Address</Th>
                  <Th>Preferred Schedule</Th>
                  <Th>Preferred Pet</Th>
                  <Th>Pet Place Photos</Th>
                  <Th>Date Added</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={styles.emptyCell}>
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

                      <td style={styles.scheduleCell}>
                        <PreferredScheduleCell
                          sitter={sitter}
                        />
                      </td>

                      <td style={styles.normalCell}>
                        <PreferredPetBadge
                          value={
                            sitter.preferred_pet_type
                          }
                        />
                      </td>

                      <td style={styles.normalCell}>
                        <PlacePhotoPreview
                          images={getSitterPlaceImages(
                            sitter
                          )}
                          sitterName={
                            getFullName(sitter)
                          }
                          opening={
                            openingPlaceId ===
                            sitter.petsitter_id
                          }
                          onOpen={() =>
                            openPlacePreview(
                              sitter
                            )
                          }
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
                    <td colSpan="10" style={styles.emptyCell}>
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

      {selectedSitter && (
        <SitterModal
          sitter={selectedSitter}
          initialEditing={modalMode === "edit"}
          updating={updatingId === selectedSitter.petsitter_id}
          deleting={deletingId === selectedSitter.petsitter_id}
          onClose={closeSitterModal}
          onUpdate={updateSitter}
          onDelete={deleteSitter}
          onOpenPlacePhotos={
            openPlacePreview
          }
          openingPlacePhotos={
            openingPlaceId ===
            selectedSitter.petsitter_id
          }
        />
      )}

      {placePreview && (
        <PlacePhotoCarouselModal
          preview={placePreview}
          onClose={
            closePlacePreview
          }
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
  active = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        ...styles.statCard,
        ...(active ? styles.statCardActive : {}),
      }}
    >
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
    </button>
  );
}

function Th({ children }) {
  return <th style={styles.th}>{children}</th>;
}

function SitterModal({
  sitter,
  initialEditing,
  updating,
  deleting,
  onClose,
  onUpdate,
  onDelete,
  onOpenPlacePhotos,
  openingPlacePhotos,
}) {
  const [isEditing, setIsEditing] =
    useState(initialEditing);

  const [formValues, setFormValues] = useState(
    () => getSitterFormValues(sitter)
  );

  const [fieldErrors, setFieldErrors] =
    useState({
      ps_fname: "",
      ps_lname: "",
      ps_username: "",
      ps_contactno: "",
      ps_email: "",
    });

  const [formError, setFormError] =
    useState("");

  const [
    checkingDuplicates,
    setCheckingDuplicates,
  ] = useState(false);

  useEffect(() => {
    setIsEditing(initialEditing);
    setFormValues(
      getSitterFormValues(sitter)
    );

    setFieldErrors({
      ps_fname: "",
      ps_lname: "",
      ps_username: "",
      ps_contactno: "",
      ps_email: "",
    });

    setFormError("");
  }, [sitter, initialEditing]);

  function updateField(field, value) {
    let nextValue = value;

    if (field === "ps_contactno") {
      nextValue = String(value || "")
        .replace(/\D/g, "")
        .slice(0, 11);
    }

    if (field === "ps_username") {
      nextValue = String(value || "")
        .slice(0, 20);
    }

    if (field === "ps_email") {
      nextValue = String(value || "")
        .toLowerCase();
    }

    setFormValues((previous) => ({
      ...previous,
      [field]: nextValue,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [field]: "",
    }));

    if (
      field === "ps_fname" ||
      field === "ps_lname"
    ) {
      setFieldErrors((previous) => ({
        ...previous,
        ps_fname:
          field === "ps_fname"
            ? ""
            : previous.ps_fname,
        ps_lname:
          field === "ps_lname"
            ? ""
            : previous.ps_lname,
      }));
    }

    setFormError("");
  }

  function validateEditForm() {
    const nextErrors = {
      ps_fname: "",
      ps_lname: "",
      ps_username: "",
      ps_contactno: "",
      ps_email: "",
    };

    const firstName = formValues.ps_fname
      .trim()
      .replace(/\s+/g, " ");

    const lastName = formValues.ps_lname
      .trim()
      .replace(/\s+/g, " ");

    const username =
      formValues.ps_username.trim();

    const contactNumber =
      formValues.ps_contactno.trim();

    const email = formValues.ps_email
      .trim()
      .toLowerCase();

    const validNamePattern =
      /^[A-Za-zÀ-ÖØ-öø-ÿ'’.-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'’.-]+)*$/;

    if (!firstName) {
      nextErrors.ps_fname =
        "First name is required.";
    } else if (
      !validNamePattern.test(firstName)
    ) {
      nextErrors.ps_fname =
        "Enter a valid first name.";
    }

    if (!lastName) {
      nextErrors.ps_lname =
        "Last name is required.";
    } else if (
      !validNamePattern.test(lastName)
    ) {
      nextErrors.ps_lname =
        "Enter a valid last name.";
    }

    if (!username) {
      nextErrors.ps_username =
        "Username is required.";
    } else if (username.length < 4) {
      nextErrors.ps_username =
        "Username must contain at least 4 characters.";
    } else if (username.length > 20) {
      nextErrors.ps_username =
        "Username cannot exceed 20 characters.";
    } else if (
      !/^[A-Za-z0-9_]+$/.test(username)
    ) {
      nextErrors.ps_username =
        "Username may contain only letters, numbers, and underscores.";
    }

    if (!contactNumber) {
      nextErrors.ps_contactno =
        "Contact number is required.";
    } else if (
      contactNumber.length !== 11
    ) {
      nextErrors.ps_contactno =
        "Contact number must contain exactly 11 digits.";
    }

    if (!email) {
      nextErrors.ps_email =
        "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      nextErrors.ps_email =
        "Enter a valid email address.";
    }

    setFieldErrors(nextErrors);

    return !Object.values(
      nextErrors
    ).some(Boolean);
  }

  async function checkEditDuplicates() {
    const firstName = formValues.ps_fname
      .trim()
      .replace(/\s+/g, " ");

    const lastName = formValues.ps_lname
      .trim()
      .replace(/\s+/g, " ");

    const username =
      formValues.ps_username.trim();

    const contactNumber =
      formValues.ps_contactno.trim();

    const email = formValues.ps_email
      .trim()
      .toLowerCase();

    setCheckingDuplicates(true);
    setFormError("");

    try {
      const [
        fullNameResult,
        usernameResult,
        contactResult,
        emailResult,
      ] = await Promise.all([
        supabase
          .from("PET SITTER")
          .select("petsitter_id")
          .ilike("ps_fname", firstName)
          .ilike("ps_lname", lastName)
          .neq(
            "petsitter_id",
            sitter.petsitter_id
          )
          .limit(1)
          .maybeSingle(),

        supabase
          .from("PET SITTER")
          .select("petsitter_id")
          .ilike("ps_username", username)
          .neq(
            "petsitter_id",
            sitter.petsitter_id
          )
          .limit(1)
          .maybeSingle(),

        supabase
          .from("PET SITTER")
          .select("petsitter_id")
          .eq(
            "ps_contactno",
            contactNumber
          )
          .neq(
            "petsitter_id",
            sitter.petsitter_id
          )
          .limit(1)
          .maybeSingle(),

        supabase
          .from("PET SITTER")
          .select("petsitter_id")
          .ilike("ps_email", email)
          .neq(
            "petsitter_id",
            sitter.petsitter_id
          )
          .limit(1)
          .maybeSingle(),
      ]);

      const duplicateCheckError =
        fullNameResult.error ||
        usernameResult.error ||
        contactResult.error ||
        emailResult.error;

      if (duplicateCheckError) {
        throw duplicateCheckError;
      }

      const duplicateErrors = {
        ps_fname: fullNameResult.data
          ? "A pet sitter with this full name already exists."
          : "",

        ps_lname: "",

        ps_username: usernameResult.data
          ? "This username is already in use."
          : "",

        ps_contactno: contactResult.data
          ? "This contact number is already registered."
          : "",

        ps_email: emailResult.data
          ? "This email address is already registered."
          : "",
      };

      setFieldErrors((previous) => ({
        ...previous,
        ...duplicateErrors,
      }));

      return !Object.values(
        duplicateErrors
      ).some(Boolean);
    } catch (duplicateError) {
      console.error(
        "Unable to check duplicate sitter information:",
        duplicateError
      );

      setFormError(
        duplicateError?.message ||
          "Unable to check whether the entered information is already registered."
      );

      return false;
    } finally {
      setCheckingDuplicates(false);
    }
  }

  function beginEditing() {
    setFormValues(
      getSitterFormValues(sitter)
    );

    setFieldErrors({
      ps_fname: "",
      ps_lname: "",
      ps_username: "",
      ps_contactno: "",
      ps_email: "",
    });

    setFormError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setFormValues(
      getSitterFormValues(sitter)
    );

    setFieldErrors({
      ps_fname: "",
      ps_lname: "",
      ps_username: "",
      ps_contactno: "",
      ps_email: "",
    });

    setFormError("");
    setIsEditing(false);
  }

  async function handleSave() {
    setFormError("");

    if (!validateEditForm()) return;

    const hasNoDuplicates =
      await checkEditDuplicates();

    if (!hasNoDuplicates) return;

    const result = await onUpdate(
      sitter,
      {
        ps_fname: formValues.ps_fname
          .trim()
          .replace(/\s+/g, " "),

        ps_lname: formValues.ps_lname
          .trim()
          .replace(/\s+/g, " "),

        ps_username:
          formValues.ps_username.trim(),

        ps_contactno:
          formValues.ps_contactno.trim(),

        ps_email: formValues.ps_email
          .trim()
          .toLowerCase(),
      }
    );

    if (result?.fieldErrors) {
      setFieldErrors((previous) => ({
        ...previous,
        ...result.fieldErrors,
      }));
    }

    if (result?.formError) {
      setFormError(result.formError);
    }

    if (result?.success) {
      setIsEditing(false);
    }
  }

  const busy =
    updating ||
    deleting ||
    checkingDuplicates;

  return (
    <div
      style={styles.modalOverlay}
      onClick={busy ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sitter-modal-title"
        style={styles.modal}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div style={styles.modalHeader}>
          <div>
            <h2
              id="sitter-modal-title"
              style={styles.modalTitle}
            >
              {isEditing
                ? "Edit Pet Sitter Details"
                : "Pet Sitter Details"}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close sitter details"
            style={{
              ...styles.closeBtn,
              ...(busy
                ? styles.disabledAction
                : {}),
            }}
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.modalProfile}>
            <div style={styles.modalAvatar}>
              <UserRound size={32} />
            </div>

            <div>
              <h3 style={styles.modalName}>
                {getFullName(sitter)}
              </h3>

              <p style={styles.modalUsername}>
                @{sitter.ps_username ||
                  "no-username"}
              </p>
            </div>
          </div>

          {isEditing && formError && (
            <div
              style={{
                ...styles.createFormError,
                marginBottom: 12,
              }}
            >
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          {isEditing ? (
            <div style={styles.modalGrid}>
              <DetailItem
                icon={
                  <UserRound size={18} />
                }
                label="Pet Sitter ID"
                value={formatSitterId(
                  sitter.petsitter_id
                )}
              />

              <DetailItem
                icon={
                  <CalendarPlus size={18} />
                }
                label="Account Created"
                value={formatDateTime(
                  sitter.created_at
                )}
              />

              <EditField
                icon={<User size={18} />}
                label="First Name"
                value={formValues.ps_fname}
                onChange={(value) =>
                  updateField(
                    "ps_fname",
                    value
                  )
                }
                required
                error={
                  fieldErrors.ps_fname
                }
              />

              <EditField
                icon={<User size={18} />}
                label="Last Name"
                value={formValues.ps_lname}
                onChange={(value) =>
                  updateField(
                    "ps_lname",
                    value
                  )
                }
                required
                error={
                  fieldErrors.ps_lname
                }
              />

              <EditField
                icon={<AtSign size={18} />}
                label="Username"
                value={
                  formValues.ps_username
                }
                onChange={(value) =>
                  updateField(
                    "ps_username",
                    value
                  )
                }
                required
                maxLength={20}
                autoComplete="username"
                error={
                  fieldErrors.ps_username
                }
              />

              <EditField
                icon={<Mail size={18} />}
                label="Email Address"
                type="email"
                value={formValues.ps_email}
                onChange={(value) =>
                  updateField(
                    "ps_email",
                    value
                  )
                }
                required
                autoComplete="email"
                disabled={Boolean(
                  sitter.ps_auth_id
                )}
                note={
                  sitter.ps_auth_id
                    ? "This email is linked to the sitter’s login account and cannot be changed here."
                    : ""
                }
                error={
                  fieldErrors.ps_email
                }
              />

              <div
                style={
                  styles.fullWidthItem
                }
              >
                <EditField
                  icon={<Phone size={18} />}
                  label="Contact Number"
                  value={
                    formValues.ps_contactno
                  }
                  onChange={(value) =>
                    updateField(
                      "ps_contactno",
                      value
                    )
                  }
                  required
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={11}
                  error={
                    fieldErrors.ps_contactno
                  }
                />
              </div>

              <SitterPreferenceCard
                sitter={sitter}
                note="These preferences came from the accepted application and are view-only on the Admin Pet Sitter page."
              />

              <SitterPreferenceCard
                sitter={sitter}
                note="These preferences came from the accepted application and are view-only on the Admin Pet Sitter page."
              />

              <PlacePhotoCard
                images={
                  getSitterPlaceImages(
                    sitter
                  )
                }
                sitterName={
                  getFullName(sitter)
                }
                opening={
                  openingPlacePhotos
                }
                onOpen={() =>
                  onOpenPlacePhotos(
                    sitter
                  )
                }
                note="Pet Place photos are managed from the pet sitter account and cannot be changed from the Admin website."
              />
            </div>
          ) : (
            <div style={styles.modalGrid}>
              <DetailItem
                icon={
                  <UserRound size={18} />
                }
                label="Pet Sitter ID"
                value={formatSitterId(
                  sitter.petsitter_id
                )}
              />

              <DetailItem
                icon={<User size={18} />}
                label="First Name"
                value={
                  sitter.ps_fname ||
                  "Not set"
                }
              />

              <DetailItem
                icon={<User size={18} />}
                label="Last Name"
                value={
                  sitter.ps_lname ||
                  "Not set"
                }
              />

              <DetailItem
                icon={<AtSign size={18} />}
                label="Username"
                value={
                  sitter.ps_username ||
                  "Not set"
                }
              />

              <DetailItem
                icon={<Mail size={18} />}
                label="Email Address"
                value={
                  sitter.ps_email ||
                  "Not set"
                }
              />

              <DetailItem
                icon={<Phone size={18} />}
                label="Contact Number"
                value={formatContactNumber(
                  sitter.ps_contactno
                )}
              />

              <PlacePhotoCard
                images={
                  getSitterPlaceImages(
                    sitter
                  )
                }
                sitterName={
                  getFullName(sitter)
                }
                opening={
                  openingPlacePhotos
                }
                onOpen={() =>
                  onOpenPlacePhotos(
                    sitter
                  )
                }
              />

              <div
                style={
                  styles.fullWidthItem
                }
              >
                <DetailItem
                  icon={
                    <CalendarPlus
                      size={18}
                    />
                  }
                  label="Date Added"
                  value={formatDateTime(
                    sitter.created_at
                  )}
                />
              </div>
            </div>
          )}
        </div>

        <div style={styles.modalFooter}>
          <button
            type="button"
            style={{
              ...styles.deleteModalBtn,
              ...(busy
                ? styles.disabledAction
                : {}),
            }}
            disabled={busy}
            onClick={() =>
              onDelete(sitter)
            }
          >
            <Trash2 size={16} />

            {deleting
              ? "Deleting..."
              : "Delete Sitter"}
          </button>

          <div
            style={styles.modalFooterRight}
          >
            {isEditing ? (
              <>
                <button
                  type="button"
                  style={{
                    ...styles.cancelEditBtn,
                    ...(busy
                      ? styles.disabledAction
                      : {}),
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
                    ...(busy
                      ? styles.disabledAction
                      : {}),
                  }}
                  disabled={busy}
                  onClick={handleSave}
                >
                  <Save size={16} />

                  {checkingDuplicates
                    ? "Checking..."
                    : updating
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  style={{
                    ...styles.editModalBtn,
                    ...(busy
                      ? styles.disabledAction
                      : {}),
                  }}
                  disabled={busy}
                  onClick={beginEditing}
                >
                  <Pencil size={16} />
                  Edit Details
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.closeModalBtn,
                    ...(busy
                      ? styles.disabledAction
                      : {}),
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
  inputMode,
  autoComplete,
  maxLength,
  error = "",
}) {
  return (
    <label
      style={{
        ...styles.editField,
        ...(error
          ? styles.editFieldError
          : {}),
      }}
    >
      <div style={styles.detailIcon}>
        {icon}
      </div>

      <div style={styles.editFieldContent}>
        <span style={styles.detailLabel}>
          {label}
          {required ? " *" : ""}
        </span>

        <input
          type={type}
          value={value}
          disabled={disabled}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          onChange={(event) =>
            onChange(event.target.value)
          }
          style={{
            ...styles.editInput,
            ...(disabled
              ? styles.disabledEditInput
              : {}),
            ...(error
              ? styles.editInputError
              : {}),
          }}
        />

        {error ? (
          <span style={styles.editFieldErrorText}>
            {error}
          </span>
        ) : note ? (
          <span style={styles.editFieldNote}>
            {note}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function PreferredScheduleCell({
  sitter,
}) {
  const days =
    formatPreferredDays(sitter);

  const timeRange =
    formatPreferredTimeRange(
      sitter
    );

  return (
    <div
      style={
        styles.scheduleSummary
      }
    >
      <strong
        style={
          styles.schedulePrimary
        }
      >
        {days}
      </strong>

      <span
        style={
          styles.scheduleSecondary
        }
      >
        {timeRange}
      </span>
    </div>
  );
}

function PreferredPetBadge({
  value,
}) {
  const normalized =
    normalizePreferredPetType(
      value
    );

  const badgeStyle =
    normalized === "dog"
      ? styles.petBadgeDog
      : normalized === "cat"
      ? styles.petBadgeCat
      : normalized === "both"
      ? styles.petBadgeBoth
      : styles.petBadgeUnset;

  return (
    <span
      style={{
        ...styles.petBadge,
        ...badgeStyle,
      }}
    >
      {formatPreferredPetType(
        value
      )}
    </span>
  );
}

function SitterPreferenceCard({
  sitter,
  note = "",
}) {
  const selectedDays =
    getPreferredDays(sitter);

  const selectedSet =
    new Set(selectedDays);

  return (
    <div
      style={
        styles.preferenceCard
      }
    >
      <div
        style={
          styles.preferenceHeader
        }
      >
        <div
          style={
            styles.detailIcon
          }
        >
          <PawPrint size={18} />
        </div>

        <div>
          <p
            style={
              styles.detailLabel
            }
          >
            Application Preferences
          </p>

          <h4
            style={
              styles.detailValue
            }
          >
            Preferred Pet Sitting
          </h4>
        </div>
      </div>

      <div
        style={
          styles.preferenceGrid
        }
      >
        <div
          style={
            styles.preferenceSection
          }
        >
          <span
            style={
              styles.preferenceSectionLabel
            }
          >
            Preferred Pet
          </span>

          <PreferredPetBadge
            value={
              sitter.preferred_pet_type
            }
          />
        </div>

        <div
          style={
            styles.preferenceSection
          }
        >
          <span
            style={
              styles.preferenceSectionLabel
            }
          >
            Preferred Time
          </span>

          <strong
            style={
              styles.preferenceValue
            }
          >
            {formatPreferredTimeRange(
              sitter
            )}
          </strong>
        </div>
      </div>

      <div
        style={
          styles.preferenceDaysSection
        }
      >
        <span
          style={
            styles.preferenceSectionLabel
          }
        >
          Preferred Days
        </span>

        <div
          style={
            styles.preferredDaysRow
          }
        >
          {PREFERRED_DAY_OPTIONS.map(
            (day) => {
              const selected =
                selectedSet.has(
                  day.name
                );

              return (
                <div
                  key={
                    day.name
                  }
                  title={
                    day.name
                  }
                  style={{
                    ...styles.preferredDayCircle,
                    ...(selected
                      ? styles.preferredDayCircleSelected
                      : {}),
                  }}
                >
                  {day.letter}
                </div>
              );
            }
          )}
        </div>

        <span
          style={
            styles.preferenceDaysText
          }
        >
          {selectedDays.length
            ? selectedDays
                .map(
                  (dayName) =>
                    PREFERRED_DAY_OPTIONS.find(
                      (option) =>
                        option.name ===
                        dayName
                    )?.short ||
                    dayName
                )
                .join(", ")
            : "No preferred days selected"}
        </span>
      </div>

      {note ? (
        <p
          style={
            styles.preferenceNote
          }
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}

function PlacePhotoPreview({
  images,
  sitterName,
  opening,
  onOpen,
}) {
  const photoList =
    Array.isArray(images)
      ? images
      : [];

  if (!photoList.length) {
    return (
      <span style={styles.mutedCell}>
        No photos
      </span>
    );
  }

  const firstPhoto =
    photoList[0];

  return (
    <button
      type="button"
      style={
        styles.placePreviewButton
      }
      disabled={opening}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      title="View Pet Place photos"
    >
      {isHttpUrl(firstPhoto) ? (
        <img
          src={firstPhoto}
          alt={`${sitterName} Pet Place`}
          style={
            styles.placeThumbnail
          }
          onError={(event) => {
            event.currentTarget.style.display =
              "none";
          }}
        />
      ) : (
        <ImageIcon size={16} />
      )}

      <span>
        {opening
          ? "Opening..."
          : "View Photos"}
      </span>
    </button>
  );
}

function PlacePhotoCard({
  images,
  sitterName,
  opening,
  onOpen,
  note,
}) {
  const photoList =
    Array.isArray(images)
      ? images
      : [];

  const firstPhoto =
    photoList[0] || "";

  return (
    <div
      style={
        styles.placePhotoCard
      }
    >
      <div
        style={
          styles.placePhotoHeader
        }
      >
        <div
          style={
            styles.detailIcon
          }
        >
          <ImageIcon size={18} />
        </div>

        <div
          style={
            styles.detailText
          }
        >
          <p
            style={
              styles.detailLabel
            }
          >
            Pet Place Photos
          </p>

          <h4
            style={
              styles.detailValue
            }
          >
            {photoList.length
              ? "Photos available"
              : "No photos available"}
          </h4>
        </div>
      </div>

      {photoList.length > 0 && (
        <button
          type="button"
          style={
            styles.placePhotoButton
          }
          disabled={opening}
          onClick={onOpen}
        >
          {isHttpUrl(
            firstPhoto
          ) ? (
            <img
              src={firstPhoto}
              alt={`${sitterName} Pet Place`}
              style={
                styles.placePhotoImage
              }
            />
          ) : (
            <div
              style={
                styles.placePhotoPlaceholder
              }
            >
              <ImageIcon
                size={32}
              />
            </div>
          )}

          <span
            style={
              styles.placePhotoAction
            }
          >
            <Eye size={14} />

            {opening
              ? "Opening..."
              : "View Pet Place Photos"}
          </span>
        </button>
      )}

      {note && (
        <p
          style={
            styles.placePhotoNote
          }
        >
          {note}
        </p>
      )}
    </div>
  );
}

function PlacePhotoCarouselModal({
  preview,
  onClose,
}) {
  const urls =
    Array.isArray(
      preview?.urls
    )
      ? preview.urls
      : [];

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(
    Math.min(
      Math.max(
        Number(
          preview?.initialIndex
        ) || 0,
        0
      ),
      Math.max(
        urls.length - 1,
        0
      )
    )
  );

  useEffect(() => {
    setActiveIndex(
      Math.min(
        Math.max(
          Number(
            preview?.initialIndex
          ) || 0,
          0
        ),
        Math.max(
          urls.length - 1,
          0
        )
      )
    );
  }, [
    preview,
    urls.length,
  ]);

  if (!urls.length) {
    return null;
  }

  function previousPhoto() {
    setActiveIndex(
      (current) =>
        current <= 0
          ? urls.length - 1
          : current - 1
    );
  }

  function nextPhoto() {
    setActiveIndex(
      (current) =>
        current >=
        urls.length - 1
          ? 0
          : current + 1
    );
  }

  return createPortal(
    <div
      style={
        styles.placeCarouselOverlay
      }
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={
          preview.title
        }
        style={
          styles.placeCarouselModal
        }
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div
          style={
            styles.placeCarouselHeader
          }
        >
          <div>
            <h3
              style={
                styles.placeCarouselTitle
              }
            >
              {preview.title}
            </h3>

            <p
              style={
                styles.placeCarouselCounter
              }
            >
              Photo{" "}
              {activeIndex + 1} of{" "}
              {urls.length}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close photo viewer"
            style={
              styles.placeCarouselClose
            }
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={
            styles.placeCarouselStage
          }
        >
          {urls.length > 1 && (
            <button
              type="button"
              aria-label="Previous photo"
              style={{
                ...styles.placeCarouselArrow,
                left: 16,
              }}
              onClick={
                previousPhoto
              }
            >
              <ChevronLeft
                size={26}
              />
            </button>
          )}

          <img
            src={
              urls[activeIndex]
            }
            alt={
              preview.filenames?.[
                activeIndex
              ] ||
              `Pet Place photo ${
                activeIndex + 1
              }`
            }
            style={
              styles.placeCarouselImage
            }
          />

          {urls.length > 1 && (
            <button
              type="button"
              aria-label="Next photo"
              style={{
                ...styles.placeCarouselArrow,
                right: 16,
              }}
              onClick={
                nextPhoto
              }
            >
              <ChevronRight
                size={26}
              />
            </button>
          )}
        </div>

        {urls.length > 1 && (
          <div
            style={
              styles.placeCarouselDots
            }
          >
            {urls.map(
              (_, index) => (
                <button
                  type="button"
                  key={index}
                  aria-label={`View photo ${
                    index + 1
                  }`}
                  style={{
                    ...styles.placeCarouselDot,
                    ...(activeIndex ===
                    index
                      ? styles.placeCarouselDotActive
                      : {}),
                  }}
                  onClick={() =>
                    setActiveIndex(
                      index
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
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

function normalizePreferredDay(
  value
) {
  const text = String(
    value || ""
  )
    .trim()
    .toLowerCase();

  const mapping = {
    m: "Monday",
    mon: "Monday",
    monday: "Monday",
    tu: "Tuesday",
    tue: "Tuesday",
    tues: "Tuesday",
    tuesday: "Tuesday",
    w: "Wednesday",
    wed: "Wednesday",
    wednesday: "Wednesday",
    th: "Thursday",
    thu: "Thursday",
    thur: "Thursday",
    thurs: "Thursday",
    thursday: "Thursday",
    f: "Friday",
    fri: "Friday",
    friday: "Friday",
    sa: "Saturday",
    sat: "Saturday",
    saturday: "Saturday",
    su: "Sunday",
    sun: "Sunday",
    sunday: "Sunday",
  };

  return mapping[text] || "";
}

function parsePreferredDays(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(
      parsePreferredDays
    );
  }

  if (
    typeof value === "object"
  ) {
    for (const key of [
      "days",
      "selectedDays",
      "preferred_days",
      "values",
    ]) {
      if (value[key]) {
        return parsePreferredDays(
          value[key]
        );
      }
    }

    return [];
  }

  const text =
    String(value).trim();

  if (!text) {
    return [];
  }

  if (
    (text.startsWith("[") &&
      text.endsWith("]")) ||
    (text.startsWith("{") &&
      text.endsWith("}"))
  ) {
    try {
      return parsePreferredDays(
        JSON.parse(text)
      );
    } catch {
      /*
        PostgreSQL text[] values normally arrive as JavaScript arrays
        through Supabase. Keep a text fallback for older records.
      */
    }
  }

  return text
    .replace(/[{}[\]"]/g, "")
    .split(/[,|;]/)
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}

function getPreferredDays(
  record
) {
  const parsed =
    parsePreferredDays(
      record?.preferred_days
    );

  const normalized =
    parsed
      .map(
        normalizePreferredDay
      )
      .filter(Boolean);

  return PREFERRED_DAY_OPTIONS
    .map(
      (day) =>
        day.name
    )
    .filter(
      (dayName) =>
        normalized.includes(
          dayName
        )
    );
}

function formatPreferredDays(
  record
) {
  const days =
    getPreferredDays(record);

  if (!days.length) {
    return "Days not set";
  }

  return days
    .map(
      (dayName) =>
        PREFERRED_DAY_OPTIONS.find(
          (day) =>
            day.name ===
            dayName
        )?.short ||
        dayName
    )
    .join(", ");
}

function formatTimeOnly(
  value
) {
  if (!value) {
    return "Not set";
  }

  const text =
    String(value).trim();

  const match =
    text.match(
      /^(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return text;
  }

  const hour =
    Number(match[1]);

  const minute =
    match[2];

  if (
    Number.isNaN(hour) ||
    hour < 0 ||
    hour > 23
  ) {
    return text;
  }

  const suffix =
    hour >= 12
      ? "PM"
      : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

function formatPreferredTimeRange(
  record
) {
  const start =
    record?.preferred_start_time;

  const end =
    record?.preferred_end_time;

  if (!start && !end) {
    return "Time not set";
  }

  if (!start) {
    return `Until ${formatTimeOnly(
      end
    )}`;
  }

  if (!end) {
    return `From ${formatTimeOnly(
      start
    )}`;
  }

  return `${formatTimeOnly(
    start
  )} - ${formatTimeOnly(end)}`;
}

function normalizePreferredPetType(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const raw = Array.isArray(value)
    ? value.join(" and ")
    : String(value);

  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ");

  const hasDog =
    /\bdogs?\b/.test(
      normalized
    );

  const hasCat =
    /\bcats?\b/.test(
      normalized
    );

  if (
    normalized === "both" ||
    (hasDog && hasCat)
  ) {
    return "both";
  }

  if (hasDog) {
    return "dog";
  }

  if (hasCat) {
    return "cat";
  }

  return "";
}

function formatPreferredPetType(
  value
) {
  const normalized =
    normalizePreferredPetType(
      value
    );

  if (normalized === "dog") {
    return "Dog";
  }

  if (normalized === "cat") {
    return "Cat";
  }

  if (normalized === "both") {
    return "Dog and Cat";
  }

  return "Not set";
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

function normalizeEmail(value) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

function isHttpUrl(value) {
  const text = String(
    value || ""
  ).trim();

  return (
    text.startsWith(
      "http://"
    ) ||
    text.startsWith(
      "https://"
    )
  );
}

function parsePlaceImages(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(
      parsePlaceImages
    );
  }

  if (
    typeof value ===
    "object"
  ) {
    if (
      value.url ||
      value.path ||
      value.uri ||
      value.file
    ) {
      return [
        value.url ||
          value.path ||
          value.uri ||
          value.file,
      ];
    }

    for (
      const key of [
        "urls",
        "images",
        "photos",
        "files",
      ]
    ) {
      if (value[key]) {
        return parsePlaceImages(
          value[key]
        );
      }
    }

    return [];
  }

  const text =
    String(value).trim();

  if (!text) {
    return [];
  }

  if (
    (text.startsWith("[") &&
      text.endsWith("]")) ||
    (text.startsWith("{") &&
      text.endsWith("}"))
  ) {
    try {
      return parsePlaceImages(
        JSON.parse(text)
      );
    } catch {
      // Continue below.
    }
  }

  if (
    text.includes("|") ||
    text.includes(";") ||
    (text.includes(",") &&
      !isHttpUrl(text))
  ) {
    return text
      .split(/[|;,]/)
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);
  }

  return [text];
}

function getApplicantPlaceImages(
  applicant
) {
  if (!applicant) {
    return [];
  }

  const candidates = [
    applicant
      .pet_place_photos,
    applicant
      .pet_place_images,
    applicant
      .pet_place_urls,
    applicant
      .place_photos,
    applicant
      .place_images,
    applicant
      .pet_place_files,
    applicant.pet_place,
  ];

  for (
    const candidate of
    candidates
  ) {
    const images =
      parsePlaceImages(
        candidate
      );

    if (images.length) {
      return Array.from(
        new Set(images)
      );
    }
  }

  return [];
}

function getSitterPlaceImages(
  sitter
) {
  const fromMerged =
    parsePlaceImages(
      sitter?.place_images
    );

  if (fromMerged.length) {
    return Array.from(
      new Set(fromMerged)
    );
  }

  return Array.from(
    new Set(
      parsePlaceImages(
        sitter?.ps_place
      )
    )
  );
}

function getPlaceFileName(value) {
  const text = String(
    value || ""
  ).trim();

  if (!text) {
    return "";
  }

  try {
    const cleanText =
      isHttpUrl(text)
        ? new URL(text)
            .pathname
        : text.split("?")[0];

    return decodeURIComponent(
      cleanText
        .split("/")
        .filter(Boolean)
        .pop() ||
        "Pet Place Photo"
    );
  } catch {
    return (
      text
        .split("/")
        .filter(Boolean)
        .pop() ||
      "Pet Place Photo"
    );
  }
}

function getStoragePath(
  value,
  bucketName
) {
  const text = String(
    value || ""
  ).trim();

  if (!text) {
    return "";
  }

  if (isHttpUrl(text)) {
    for (
      const marker of [
        `/storage/v1/object/public/${bucketName}/`,
        `/storage/v1/object/sign/${bucketName}/`,
        `/storage/v1/object/authenticated/${bucketName}/`,
      ]
    ) {
      const index =
        text.indexOf(
          marker
        );

      if (index !== -1) {
        return decodeURIComponent(
          text
            .slice(
              index +
                marker.length
            )
            .split("?")[0]
        );
      }
    }

    return "";
  }

  const normalized =
    text.replace(
      /^\/+/,
      ""
    );

  const prefix =
    `${bucketName}/`;

  return normalized.startsWith(
    prefix
  )
    ? normalized.slice(
        prefix.length
      )
    : normalized;
}

async function resolvePlaceImage(
  value
) {
  const text = String(
    value || ""
  ).trim();

  if (!text) {
    throw new Error(
      "No Pet Place photo was provided."
    );
  }

  /*
    HTTP images are displayed directly inside the current-page modal.
    No new browser tab is opened.
  */
  if (isHttpUrl(text)) {
    return {
      url: text,
      revokeOnClose: false,
    };
  }

  let lastError = null;

  for (
    const bucketName of
    PLACE_BUCKET_CANDIDATES
  ) {
    try {
      const storagePath =
        getStoragePath(
          text,
          bucketName
        );

      if (!storagePath) {
        continue;
      }

      const {
        data,
        error,
      } =
        await supabase.storage
          .from(
            bucketName
          )
          .download(
            storagePath
          );

      if (error) {
        lastError = error;
        continue;
      }

      const objectUrl =
        URL.createObjectURL(
          data
        );

      return {
        url: objectUrl,
        revokeOnClose: true,
      };
    } catch (
      candidateError
    ) {
      lastError =
        candidateError;
    }
  }

  throw (
    lastError ||
    new Error(
      "Unable to retrieve the Pet Place photo."
    )
  );
}

function revokePlacePreviewUrls(
  preview
) {
  const urls =
    Array.isArray(
      preview?.revokeUrls
    )
      ? preview.revokeUrls
      : [];

  Array.from(
    new Set(urls)
  ).forEach((url) => {
    try {
      URL.revokeObjectURL(
        url
      );
    } catch {
      // Ignore cleanup errors.
    }
  });
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
    gap: 14,
    marginBottom: 24,
  },

  statCard: {
    width: "100%",
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
    fontFamily: "inherit",
    textAlign: "left",
    cursor: "pointer",
    transition:
      "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
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

  statOrange: {
    background: "#FCEBDD",
    color: "#F16C08",
  },

  statBlue: {
    background: "#E4EFFB",
    color: "#2E6EAE",
  },

  statPurple: {
    background: "#EFE5F8",
    color: "#7A4BA3",
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
    minWidth: 1540,
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
    verticalAlign: "middle",
  },

  scheduleCell: {
    padding: 14,
    fontSize: 13,
    color: "#1F1714",
    verticalAlign: "middle",
  },

  scheduleSummary: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 118,
  },

  schedulePrimary: {
    color: BRAND.brown,
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1.35,
  },

  scheduleSecondary: {
    color: BRAND.muted,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  petBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 28,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: "nowrap",
    border: "1px solid transparent",
  },

  petBadgeDog: {
    background: "#EAF3FC",
    color: "#285F95",
    borderColor: "#CADFF3",
  },

  petBadgeCat: {
    background: "#F3EAF9",
    color: "#714493",
    borderColor: "#DFCDED",
  },

  petBadgeBoth: {
    background: "#E8F6EE",
    color: "#187341",
    borderColor: "#CAE8D6",
  },

  petBadgeUnset: {
    background: "#F5F1F0",
    color: BRAND.muted,
    borderColor: "#E7DDDA",
  },

  mutedCell: {
    color: BRAND.muted,
    fontSize: 12,
    fontWeight: 700,
  },

  placePreviewButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: BRAND.pink,
    fontSize: 12,
    fontWeight: 900,
    fontFamily: "inherit",
    cursor: "pointer",
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
    padding: "18px 22px",
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
  
  preferenceCard: {
    gridColumn: "1 / -1",
    border: "1px solid #EEE2DF",
    borderRadius: 12,
    padding: 14,
    background: "#FFFCFB",
    boxSizing: "border-box",
  },

  preferenceHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },

  preferenceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 12,
  },

  preferenceSection: {
    minHeight: 66,
    padding: 12,
    borderRadius: 10,
    border: "1px solid #F0E5E2",
    background: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 7,
    boxSizing: "border-box",
  },

  preferenceSectionLabel: {
    color: BRAND.muted,
    fontSize: 11,
    fontWeight: 900,
  },

  preferenceValue: {
    color: BRAND.brown,
    fontSize: 13,
    fontWeight: 900,
  },

  preferenceDaysSection: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #F0E5E2",
    background: "#FFFFFF",
  },

  preferredDaysRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 9,
    marginBottom: 8,
  },

  preferredDayCircle: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "1px solid #E5D9D6",
    background: "#FAF6F5",
    color: "#9B8B86",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 900,
  },

  preferredDayCircleSelected: {
    borderColor: BRAND.pink,
    background: BRAND.softPink,
    color: BRAND.pink,
  },

  preferenceDaysText: {
    display: "block",
    color: BRAND.brown,
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.4,
  },

  preferenceNote: {
    margin: "10px 0 0",
    color: BRAND.muted,
    fontSize: 11,
    lineHeight: 1.5,
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

  placePhotoButton: {
    width: "100%",
    display: "block",
    marginTop: 12,
    padding: 0,
    border: "none",
    background: "transparent",
    textDecoration: "none",
    textAlign: "left",
    fontFamily: "inherit",
    cursor: "pointer",
  },

  placePhotoPlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    border: "1px solid #E6D9D7",
    background: "#FFF8F8",
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
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

  placeCarouselOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2000,
    background: "rgba(26, 17, 14, 0.76)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    boxSizing: "border-box",
  },

  placeCarouselModal: {
    width: "min(900px, 100%)",
    maxHeight: "92vh",
    background: "#FFFFFF",
    borderRadius: 18,
    border: "1px solid #EEE2DF",
    boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },

  placeCarouselHeader: {
    minHeight: 72,
    padding: "16px 18px",
    borderBottom: "1px solid #EEE2DF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    boxSizing: "border-box",
  },

  placeCarouselTitle: {
    margin: 0,
    color: BRAND.brown,
    fontSize: 18,
    fontWeight: 900,
  },

  placeCarouselCounter: {
    margin: "4px 0 0",
    color: BRAND.muted,
    fontSize: 12,
    fontWeight: 700,
  },

  placeCarouselClose: {
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: 9,
    border: "1px solid #E6D9D7",
    background: "#FFFFFF",
    color: BRAND.brown,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  placeCarouselStage: {
    position: "relative",
    minHeight: 420,
    maxHeight: "68vh",
    background: "#1D1715",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  placeCarouselImage: {
    display: "block",
    maxWidth: "100%",
    maxHeight: "68vh",
    width: "auto",
    height: "auto",
    objectFit: "contain",
  },

  placeCarouselArrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 3,
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.94)",
    color: BRAND.brown,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
  },

  placeCarouselFilename: {
    margin: 0,
    padding: "12px 18px 4px",
    color: BRAND.muted,
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    overflowWrap: "anywhere",
  },

  placeCarouselDots: {
    minHeight: 38,
    padding: "10px 16px 14px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },

  placeCarouselDot: {
    width: 9,
    height: 9,
    padding: 0,
    border: "none",
    borderRadius: "50%",
    background: "#D9CCCA",
    cursor: "pointer",
  },

  placeCarouselDotActive: {
    background: BRAND.pink,
    transform: "scale(1.2)",
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

  editFieldError: {
    borderColor: "#D98E94",
    background: "#FFF7F7",
  },

  editFieldErrorText: {
    display: "block",
    marginTop: 7,
    color: "#B3404A",
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.4,
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

  editInputError: {
    borderColor: "#D98E94",
    background: "#FFFFFF",
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