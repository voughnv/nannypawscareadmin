import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
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
  Image as ImageIcon,
  Eye,
  Mail,
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

const APPLICANT_INTERACTION_CSS = `
  .applicant-interactive {
    transition:
      transform 0.14s ease,
      box-shadow 0.18s ease,
      filter 0.18s ease,
      border-color 0.18s ease,
      background-color 0.18s ease,
      color 0.18s ease !important;
    transform-origin: center;
  }

  .applicant-interactive:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 7px 16px rgba(58, 30, 20, 0.12);
    filter: brightness(1.015);
  }

  .applicant-interactive:not(:disabled):active {
    transform: translateY(0) scale(0.975);
    box-shadow: 0 3px 8px rgba(58, 30, 20, 0.10);
  }

  .applicant-interactive:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.52);
    outline-offset: 2px;
  }

  .applicant-stat-card:not(:disabled):hover {
    transform: translateY(-4px) !important;
    border-color: rgba(217, 67, 104, 0.55) !important;
    box-shadow:
      0 12px 24px rgba(58, 30, 20, 0.12),
      0 0 0 2px rgba(217, 67, 104, 0.07) !important;
  }

  .applicant-stat-card:not(:disabled):active {
    transform: translateY(-1px) scale(0.985) !important;
  }

  .applicant-search-box {
    transition:
      transform 0.16s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease,
      background-color 0.18s ease;
  }

  .applicant-search-box:hover {
    border-color: rgba(217, 67, 104, 0.38) !important;
    box-shadow: 0 5px 14px rgba(58, 30, 20, 0.08);
  }

  .applicant-search-box:focus-within {
    border-color: rgba(217, 67, 104, 0.72) !important;
    box-shadow:
      0 0 0 3px var(--app-focus-ring),
      0 6px 16px rgba(58, 30, 20, 0.08);
    transform: translateY(-1px);
  }

  .applicant-search-box.has-value {
    box-shadow: inset 0 0 0 1px rgba(217, 67, 104, 0.16);
  }

  .applicant-input-interactive {
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      background-color 0.18s ease;
  }

  .applicant-input-interactive:not(:disabled):not([readonly]):hover {
    border-color: rgba(217, 67, 104, 0.42) !important;
  }

  .applicant-input-interactive:not(:disabled):not([readonly]):focus {
    outline: none;
    border-color: rgba(217, 67, 104, 0.74) !important;
    box-shadow: 0 0 0 3px var(--app-focus-ring);
  }

  .applicant-table-row {
    transition:
      background-color 0.16s ease,
      box-shadow 0.16s ease,
      filter 0.16s ease;
  }

  .applicant-table-row:hover {
    background: var(--app-hover) !important;
    box-shadow: inset 3px 0 0 #D94368;
  }

  .applicant-table-row:active {
    background: var(--app-hover-strong) !important;
    filter: brightness(0.995);
  }

  .applicant-table-row:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.48);
    outline-offset: -2px;
    background: var(--app-hover) !important;
  }

  .applicant-file-button:not(:disabled):hover {
    color: #D94368 !important;
    filter: brightness(1.04);
  }

  .applicant-file-button img {
    transition:
      transform 0.20s ease,
      box-shadow 0.20s ease,
      border-color 0.20s ease;
  }

  .applicant-file-button:not(:disabled):hover img {
    transform: scale(1.04);
    border-color: rgba(217, 67, 104, 0.50) !important;
    box-shadow: 0 6px 14px rgba(58, 30, 20, 0.12);
  }

  .applicant-media-button:not(:disabled):hover {
    transform: translateY(-2px);
  }

  .applicant-media-button img {
    transition:
      transform 0.22s ease,
      box-shadow 0.22s ease,
      border-color 0.22s ease;
  }

  .applicant-media-button:not(:disabled):hover img {
    transform: scale(1.012);
    border-color: rgba(217, 67, 104, 0.50) !important;
    box-shadow: 0 9px 22px rgba(58, 30, 20, 0.12);
  }

  .applicant-close-button:not(:disabled):hover {
    color: #D94368 !important;
    border-color: rgba(217, 67, 104, 0.48) !important;
    background: var(--app-hover) !important;
  }

  .applicant-toggle:not(:disabled):hover {
    border-color: rgba(217, 67, 104, 0.52) !important;
    background: var(--app-hover) !important;
  }

  .applicant-danger:not(:disabled):hover {
    filter: brightness(0.98);
    box-shadow: 0 7px 16px rgba(225, 29, 72, 0.15);
  }

  .applicant-success:not(:disabled):hover {
    filter: brightness(1.04);
    box-shadow: 0 7px 16px rgba(217, 67, 104, 0.20);
  }

  .applicant-carousel-dot:not(:disabled):hover {
    transform: scale(1.35);
    box-shadow: none;
  }
`;

const ROWS_PER_PAGE = 6;

const RESUME_BUCKET = "RESUME";

const PLACE_BUCKET_CANDIDATES = [
  import.meta.env.VITE_APPLICANT_PLACE_BUCKET,
  "PET_PLACE",
  "PET PLACE",
  "pet-place",
  "pet_place",
  "PLACE",
  "place",
].filter(Boolean);

const DEFAULT_SITTER_PASSWORD = "NannyPaws@123";

const SITTER_EMAIL_REDIRECT_URL =
  import.meta.env.VITE_SITTER_EMAIL_REDIRECT_URL ||
  (typeof window !== "undefined"
    ? window.location.origin
    : undefined);

/*
  A separate non-persistent Auth client is used so creating a
  Pet Sitter Auth account does not affect any other session
  being used by the Admin website.
*/
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

export default function ApplicantPage() {
  const requestConfirmation = useConfirmation();
  const { settings, fontScale } = useAdminSettings();
  const darkMode = Boolean(settings?.darkMode);

  /*
    Keep this page synchronized with the Admin Settings page.
    The entire Applicant workspace scales using the saved fontScale,
    while all neutral colors below use these page-level theme variables.
  */
  const pageThemeStyle = useMemo(
    () => ({
      "--admin-font-scale": String(fontScale || 1),
      "--app-page": darkMode ? "#171311" : "#FFF9F8",
      "--app-card": darkMode ? "#241D1A" : "#FFFFFF",
      "--app-card-soft": darkMode ? "#2B2320" : "#FFFCFB",
      "--app-table-head": darkMode ? "#2B2320" : "#FFFBFA",
      "--app-input": darkMode ? "#2B2320" : "#FFFFFF",
      "--app-readonly": darkMode ? "#312824" : "#F8F3F2",
      "--app-soft": darkMode ? "#302622" : "#FFF8F8",
      "--app-text": darkMode ? "#FFF7F4" : "#1F1714",
      "--app-strong": darkMode ? "#FFF7F4" : "#3A1E14",
      "--app-muted": darkMode ? "#CFC2BE" : "#6D5F5B",
      "--app-border": darkMode ? "#443934" : "#EEE2DF",
      "--app-border-strong": darkMode ? "#5A4B45" : "#E2D5D3",
      "--app-hover": darkMode ? "#34282C" : "#FFF7F9",
      "--app-hover-strong": darkMode ? "#412E35" : "#FDEBED",
      "--app-focus-ring": "rgba(217, 67, 104, 0.12)",
      "--app-shadow": darkMode
        ? "0 8px 18px rgba(0,0,0,0.24)"
        : "0 8px 18px rgba(51,26,18,0.07)",
      width: "100%",
      minHeight: "100%",

      /*
        Reliable Admin font-size scaling.
        The previous CSS calc(Npx * variable) syntax is not consistently
        supported by browsers. Scaling the Applicant workspace here makes
        every text element visibly respond to Settings > Font Size.

        Default = 1, so the current clean layout is unchanged.
        Large = 1.08, so the page can naturally become wider and use the
        horizontal scrollbar instead of squeezing or clipping text.
      */
      zoom: Number(fontScale || 1),

      color: "var(--app-text)",
      background: "var(--app-page)",
      transition: "background 0.2s ease, color 0.2s ease",
    }),
    [darkMode, fontScale]
  );

  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");

  /*
    Status is now controlled by the clickable dashboard cards.
    The old status dropdown has been removed.
  */
  const [statusFilter, setStatusFilter] =
    useState("All Status");

  /*
    Accepted applicants are hidden from the table by default.
    They can be shown using the toggle or by clicking the
    Accepted dashboard card.

    acceptedToggleSource tracks whether the toggle was enabled
    automatically by the Accepted card or manually by the Admin.
  */
  const [showAcceptedApplicants, setShowAcceptedApplicants] =
    useState(false);

  const [acceptedToggleSource, setAcceptedToggleSource] =
    useState(null);

  const [showDateFilter, setShowDateFilter] =
    useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const [mediaPreview, setMediaPreview] =
    useState(null);

  const [openingResumeId, setOpeningResumeId] =
    useState(null);

  const [openingImageId, setOpeningImageId] =
    useState(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    fetchApplicantRecords();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    showAcceptedApplicants,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    return () => {
      revokePreviewObjectUrls(
        mediaPreview
      );
    };
  }, [mediaPreview]);

  async function fetchApplicantRecords() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const [
        applicantResult,
        applicationResult,
      ] = await Promise.all([
        supabase
          .from("APPLICANT")
          .select("*")
          .order("created_at", {
            ascending: true,
          }),

        supabase
          .from("APPLICATION")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (applicantResult.error) {
        throw applicantResult.error;
      }

      if (applicationResult.error) {
        throw applicationResult.error;
      }

      const applicationMap = new Map(
        (applicationResult.data || []).map(
          (item) => [
            Number(item.a_id),
            item,
          ]
        )
      );

      const merged = (
        applicantResult.data || []
      ).map((applicant) => {
        const application =
          applicationMap.get(
            Number(applicant.applicant_id)
          );

        return {
          ...applicant,

          application_id:
            application?.application_id ??
            null,

          application_created_at:
            application?.created_at ??
            null,

          review_remarks:
            application?.review_remarks ??
            "",

          review_date:
            application?.review_date ??
            null,

          application_status:
            application?.application_status ??
            "Pending",

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

          has_application_record:
            Boolean(application),
        };
      });

      setRecords(merged);

      setSelectedRecord((previous) =>
        previous
          ? merged.find(
              (item) =>
                item.applicant_id ===
                previous.applicant_id
            ) || null
          : null
      );
    } catch (fetchError) {
      console.error(
        "Unable to load applicants:",
        fetchError
      );

      setError(
        fetchError?.message ||
          "Unable to load applicant and application records."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CLICKABLE DASHBOARD CARDS
  |--------------------------------------------------------------------------
  */
  function applyCardFilter(nextStatus) {
    setStatusFilter(nextStatus);
    setCurrentPage(1);

    /*
      Clicking Accepted temporarily turns the accepted-applicant
      toggle on so the filtered records are visible.
    */
    if (nextStatus === "Accepted") {
      if (!showAcceptedApplicants) {
        setShowAcceptedApplicants(true);
        setAcceptedToggleSource("auto");
      }

      return;
    }

    /*
      When the Admin leaves the Accepted card, turn the toggle back
      off only when it was enabled automatically. A manually enabled
      toggle stays on until the Admin switches it off.
    */
    if (acceptedToggleSource === "auto") {
      setShowAcceptedApplicants(false);
      setAcceptedToggleSource(null);
    }
  }

  function toggleAcceptedApplicants() {
    const nextValue = !showAcceptedApplicants;

    setShowAcceptedApplicants(nextValue);
    setAcceptedToggleSource(nextValue ? "manual" : null);

    /*
      Hiding accepted applicants while the Accepted card is active
      returns the table to the normal All Status view.
    */
    if (!nextValue && statusFilter === "Accepted") {
      setStatusFilter("All Status");
    }

    setCurrentPage(1);
  }

  /*
  |--------------------------------------------------------------------------
  | APPLICATION REVIEW
  |--------------------------------------------------------------------------
  */
  async function updateReview(
    record,
    status,
    remarks
  ) {
    const isAccepting =
      status === "Accepted";

    const isRejecting =
      status === "Rejected";

    if (isAccepting) {
      const validationError =
        validateApplicantForAcceptance(
          record
        );

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const confirmed =
      await requestConfirmation({
        title: isRejecting
          ? "Reject application?"
          : "Accept application?",

        message: isRejecting
          ? `Reject ${getFullName(
              record
            )}'s application? This review cannot be changed afterward.`
          : `Accept ${getFullName(
              record
            )}'s application? A Pet Sitter account will be created automatically and a verification email will be sent.`,

        confirmText: isRejecting
          ? "Reject Application"
          : "Accept & Create Sitter",

        variant: isRejecting
          ? "danger"
          : "success",
      });

    if (!confirmed) return;

    setUpdatingId(
      record.applicant_id
    );

    setError("");
    setSuccess("");

    try {
      /*
        On acceptance, create/match the Pet Sitter account first.
        This automatically moves the accepted applicant into
        the PET SITTER table.
      */
      let sitterAccountResult = null;

      if (isAccepting) {
        sitterAccountResult =
          await ensurePetSitterAccount(
            record
          );
      }

      /*
        Keep the Admin interface terminology as "Accepted", while
        storing the database-compatible value "Approved".

        The existing APPLICATION.application_status check constraint
        still uses the older Approved/Rejected/Pending values.
        normalizeStatus() already converts "Approved" back to
        "Accepted" for display throughout the Admin page.
      */
      const databaseStatus =
        isAccepting ? "Approved" : status;

      const payload = {
        application_status:
          databaseStatus,

        review_remarks:
          remarks.trim() || null,

        review_date: [
          getPhilippineDateOnly(),
        ],

        preferred_days:
          getPreferredDays(record),

        preferred_start_time:
          record.preferred_start_time,

        preferred_end_time:
          record.preferred_end_time,

        preferred_pet_type:
          record.preferred_pet_type || null,
      };

      let result;

      if (record.has_application_record) {
        result = await supabase
          .from("APPLICATION")
          .update(payload)
          .eq(
            "application_id",
            record.application_id
          )
          .select(
            `
              application_id,
              created_at,
              review_remarks,
              review_date,
              application_status,
              preferred_days,
              preferred_start_time,
              preferred_end_time,
              preferred_pet_type,
              a_id
            `
          )
          .single();
      } else {
        result = await supabase
          .from("APPLICATION")
          .insert({
            a_id:
              record.applicant_id,
            ...payload,
          })
          .select(
            `
              application_id,
              created_at,
              review_remarks,
              review_date,
              application_status,
              preferred_days,
              preferred_start_time,
              preferred_end_time,
              preferred_pet_type,
              a_id
            `
          )
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      const updated = {
        ...record,

        application_id:
          result.data.application_id,

        a_id:
          result.data.a_id ??
          record.applicant_id,

        application_created_at:
          result.data.created_at,

        review_remarks:
          result.data.review_remarks ||
          "",

        review_date:
          result.data.review_date,

        application_status:
          result.data.application_status,

        preferred_days:
          result.data
            .preferred_days ?? [],

        preferred_start_time:
          result.data
            .preferred_start_time,

        preferred_end_time:
          result.data
            .preferred_end_time,

        preferred_pet_type:
          result.data
            .preferred_pet_type ??
          record.preferred_pet_type ??
          null,

        has_application_record: true,
      };

      setRecords((previous) =>
        previous.map((item) =>
          item.applicant_id ===
          record.applicant_id
            ? updated
            : item
        )
      );

      /*
        Accepted applicants disappear from the normal Applicant
        table immediately. They remain available through the
        Show Accepted Applicants toggle.
      */
      if (isAccepting) {
        setSelectedRecord(null);

        setSuccess(
          sitterAccountResult
            ?.alreadyExisting
            ? `${getFullName(
                record
              )} was accepted and is already listed as a Pet Sitter.`
            : `${getFullName(
                record
              )} was accepted, moved to Pet Sitters, and sent an email verification link.`
        );
      } else {
        setSelectedRecord(updated);

        setSuccess(
          `${getFullName(
            record
          )}'s application was rejected.`
        );
      }
    } catch (updateError) {
      console.error(
        "Unable to update application review:",
        updateError
      );

      setError(
        updateError?.message ||
          "Unable to update application review."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | AUTOMATIC PET SITTER ACCOUNT CREATION
  |--------------------------------------------------------------------------
  */
  async function ensurePetSitterAccount(
    record
  ) {
    const email = String(
      record.a_email || ""
    )
      .trim()
      .toLowerCase();

    const username =
      buildSitterUsername(record);

    /*
      If this applicant was already converted previously,
      do not create a duplicate sitter.
    */
    const {
      data: existingByEmail,
      error: existingEmailError,
    } = await supabase
      .from("PET SITTER")
      .select(
        `
          petsitter_id,
          ps_auth_id,
          ps_email,
          ps_username
        `
      )
      .ilike("ps_email", email)
      .limit(1)
      .maybeSingle();

    if (existingEmailError) {
      throw existingEmailError;
    }

    if (existingByEmail) {
      return {
        sitter: existingByEmail,
        alreadyExisting: true,
      };
    }

    const {
      data: usernameMatch,
      error: usernameError,
    } = await supabase
      .from("PET SITTER")
      .select("petsitter_id")
      .ilike(
        "ps_username",
        username
      )
      .limit(1)
      .maybeSingle();

    if (usernameError) {
      throw usernameError;
    }

    if (usernameMatch) {
      throw new Error(
        `The generated username "${username}" is already being used by another Pet Sitter.`
      );
    }

    const {
      data: authData,
      error: authError,
    } =
      await sitterAuthClient.auth.signUp({
        email,

        password:
          DEFAULT_SITTER_PASSWORD,

        options: {
          emailRedirectTo:
            SITTER_EMAIL_REDIRECT_URL,

          data: {
            role: "pet_sitter",

            first_name:
              String(
                record.a_fname || ""
              ).trim(),

            last_name:
              String(
                record.a_lname || ""
              ).trim(),

            username,
          },
        },
      });

    if (authError) {
      throw authError;
    }

    const authUser =
      authData?.user;

    if (!authUser?.id) {
      throw new Error(
        "Supabase Auth did not return a user ID for the accepted applicant."
      );
    }

    /*
      When email confirmation is enabled, Supabase may return a user
      object with no identities if that email already belongs to an
      existing Auth account.
    */
    if (
      Array.isArray(
        authUser.identities
      ) &&
      authUser.identities.length === 0
    ) {
      throw new Error(
        `An authentication account already exists for ${email}.`
      );
    }

    const sitterPayload = {
      ps_auth_id: authUser.id,

      ps_fname:
        String(
          record.a_fname || ""
        ).trim(),

      ps_lname:
        String(
          record.a_lname || ""
        ).trim(),

      ps_username: username,

      ps_contactno:
        String(
          record.a_contactno || ""
        ).trim(),

      ps_email: email,

      /*
        Transfer the applicant's submitted place image into
        the Pet Sitter profile instead of discarding it.
      */
      ps_place:
        getPetPlaceImages(
          record
        )[0] || null,

      ps_password:
        DEFAULT_SITTER_PASSWORD,
    };

    const {
      data: sitter,
      error: sitterError,
    } = await supabase
      .from("PET SITTER")
      .insert(sitterPayload)
      .select(
        `
          petsitter_id,
          created_at,
          ps_auth_id,
          ps_fname,
          ps_lname,
          ps_username,
          ps_contactno,
          ps_email,
          ps_place
        `
      )
      .single();

    if (sitterError) {
      throw sitterError;
    }

    return {
      sitter,
      alreadyExisting: false,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | MEDIA PREVIEW
  |--------------------------------------------------------------------------
  */
  async function openPetPlacePreview(
    record,
    initialIndex = 0
  ) {
    const petPlaceImages =
      getPetPlaceImages(record);

    if (!petPlaceImages.length) {
      setError(
        "No pet place images are stored for this applicant."
      );
      return;
    }

    setOpeningImageId(
      record.applicant_id
    );

    setError("");

    try {
      const resolvedImages =
        await Promise.all(
          petPlaceImages.map(
            (imageValue) =>
              resolvePreviewFile(
                imageValue,
                PLACE_BUCKET_CANDIDATES,
                "image"
              )
          )
        );

      closeMediaPreview();

      setMediaPreview({
        type: "image-carousel",
        title: `${getFullName(
          record
        )} - Pet Place`,
        urls: resolvedImages.map(
          (item) => item.url
        ),
        filenames:
          petPlaceImages.map(
            (item) =>
              getFileName(item)
          ),
        revokeUrls:
          resolvedImages
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
            resolvedImages.length - 1,
            0
          )
        ),
      });
    } catch (previewError) {
      console.error(
        "Unable to preview pet place images:",
        previewError
      );

      setError(
        previewError?.message ||
          "Unable to open the pet place images."
      );
    } finally {
      setOpeningImageId(null);
    }
  }

  async function openResumePreview(
    record
  ) {
    if (!record?.resume_file) {
      setError(
        "No resume file is stored for this applicant."
      );
      return;
    }

    setOpeningResumeId(
      record.applicant_id
    );

    setError("");

    try {
      const resolved =
        await resolvePreviewFile(
          record.resume_file,
          [RESUME_BUCKET],
          "pdf"
        );

      closeMediaPreview();

      setMediaPreview({
        type: "pdf",
        title: `${getFullName(
          record
        )} - Resume`,
        url: resolved.url,
        revokeOnClose:
          resolved.revokeOnClose,
      });
    } catch (previewError) {
      console.error(
        "Unable to preview resume:",
        previewError
      );

      setError(
        previewError?.message ||
          `Unable to preview the resume from the "${RESUME_BUCKET}" Storage bucket.`
      );
    } finally {
      setOpeningResumeId(null);
    }
  }

  function closeMediaPreview() {
    setMediaPreview(
      (previous) => {
        revokePreviewObjectUrls(
          previous
        );
        return null;
      }
    );
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All Status");
    setShowAcceptedApplicants(false);
    setAcceptedToggleSource(null);
    setDateFrom("");
    setDateTo("");
    setShowDateFilter(false);
    setCurrentPage(1);
  }

  const normalizedRecords =
    useMemo(
      () =>
        records.map((record) => ({
          ...record,

          normalizedStatus:
            normalizeStatus(
              record.application_status
            ),
        })),
      [records]
    );

  const filteredRecords =
    useMemo(() => {
      const keyword = search
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

      return normalizedRecords.filter(
        (record) => {
          /*
            Accepted applicants are hidden by default.
          */
          if (
            record.normalizedStatus ===
              "Accepted" &&
            !showAcceptedApplicants
          ) {
            return false;
          }

          const applicantName =
            getFullName(record)
              .replace(/\s+/g, " ")
              .toLowerCase();

          const rawApplicantId =
            String(
              record.applicant_id ??
                ""
            ).toLowerCase();

          const formattedApplicantId =
            formatApplicantId(
              record.applicant_id
            ).toLowerCase();

          const matchesSearch =
            !keyword ||
            applicantName.includes(
              keyword
            ) ||
            rawApplicantId.includes(
              keyword
            ) ||
            formattedApplicantId.includes(
              keyword
            );

          const matchesStatus =
            statusFilter ===
              "All Status" ||
            record.normalizedStatus ===
              statusFilter;

          /*
            Filter applicants by Submitted On.

            Using the applicant's created_at date allows Pending,
            Accepted, and Rejected applicants to all be filtered,
            even when a review_date does not exist yet.
          */
          const submittedDate =
            getDateOnlyValue(
              record.created_at
            );

          const matchesDateFrom =
            !dateFrom ||
            (submittedDate &&
              submittedDate >= dateFrom);

          const matchesDateTo =
            !dateTo ||
            (submittedDate &&
              submittedDate <= dateTo);

          return (
            matchesSearch &&
            matchesStatus &&
            matchesDateFrom &&
            matchesDateTo
          );
        }
      );
    }, [
      normalizedRecords,
      search,
      statusFilter,
      showAcceptedApplicants,
      dateFrom,
      dateTo,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRecords.length /
        ROWS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRecords =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ROWS_PER_PAGE;

      return filteredRecords.slice(
        start,
        start + ROWS_PER_PAGE
      );
    }, [
      filteredRecords,
      currentPage,
    ]);

  const stats = useMemo(
    () => ({
      total: records.length,

      pending:
        normalizedRecords.filter(
          (item) =>
            item.normalizedStatus ===
            "Pending"
        ).length,

      accepted:
        normalizedRecords.filter(
          (item) =>
            item.normalizedStatus ===
            "Accepted"
        ).length,

      rejected:
        normalizedRecords.filter(
          (item) =>
            item.normalizedStatus ===
            "Rejected"
        ).length,
    }),
    [
      records,
      normalizedRecords,
    ]
  );

  const firstVisible =
    filteredRecords.length
      ? (currentPage - 1) *
          ROWS_PER_PAGE +
        1
      : 0;

  const lastVisible = Math.min(
    currentPage * ROWS_PER_PAGE,
    filteredRecords.length
  );

  return (
    <div style={pageThemeStyle}>
      <style>{APPLICANT_INTERACTION_CSS}</style>

      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Applicants
          </h1>

          <p style={styles.subtitle}>
            Manage applicant information and application reviews.
          </p>
        </div>

        <div style={styles.breadcrumb}>
          <span>Dashboard</span>

          <span
            style={styles.chevron}
          >
            ›
          </span>

          <span>Applicants</span>
        </div>
      </header>

      {/* CLICKABLE DASHBOARD CARDS */}
      <section style={styles.statsGrid}>
        <StatCard
          icon={
            <Users size={30} />
          }
          iconStyle={styles.statPink}
          title="Total Applicants"
          value={stats.total}
          desc="All applicant records"
          active={
            statusFilter ===
            "All Status"
          }
          onClick={() =>
            applyCardFilter(
              "All Status"
            )
          }
        />

        <StatCard
          icon={
            <Clock3 size={30} />
          }
          iconStyle={
            styles.statOrange
          }
          title="Pending Review"
          value={stats.pending}
          desc="Awaiting review"
          active={
            statusFilter === "Pending"
          }
          onClick={() =>
            applyCardFilter("Pending")
          }
        />

        <StatCard
          icon={
            <CheckCircle2
              size={32}
            />
          }
          iconStyle={styles.statGreen}
          title="Accepted"
          value={stats.accepted}
          desc="Accepted applications"
          active={
            statusFilter ===
            "Accepted"
          }
          onClick={() =>
            applyCardFilter(
              "Accepted"
            )
          }
        />

        <StatCard
          icon={
            <XCircle size={32} />
          }
          iconStyle={styles.statRed}
          title="Rejected"
          value={stats.rejected}
          desc="Rejected applications"
          active={
            statusFilter ===
            "Rejected"
          }
          onClick={() =>
            applyCardFilter(
              "Rejected"
            )
          }
        />
      </section>

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={20} />

          <span
            style={styles.errorText}
          >
            {error}
          </span>

          <button className="applicant-interactive"
            style={styles.errorClose}
            onClick={() =>
              setError("")
            }
          >
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div
          style={styles.successBox}
        >
          <CheckCircle2 size={20} />

          <span
            style={styles.successText}
          >
            {success}
          </span>

          <button className="applicant-interactive"
            style={
              styles.successClose
            }
            onClick={() =>
              setSuccess("")
            }
          >
            <X size={18} />
          </button>
        </div>
      )}

      <section
        style={styles.tableCard}
      >
        <div style={styles.filters}>
          {/* Search + Date Range */}
          <div
            style={
              styles.leftFilters
            }
          >
            <div
              className={`applicant-search-box${search ? " has-value" : ""}`}
              style={styles.searchBox}
            >
              <Search
                size={22}
                color="#5E4B45"
              />

              <input className="applicant-input-interactive"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search Applicant ID or name"
                style={
                  styles.searchInput
                }
              />
            </div>

            <button className="applicant-interactive"
              type="button"
              style={styles.dateBtn}
              onClick={() =>
                setShowDateFilter(
                  (previous) =>
                    !previous
                )
              }
            >
              <Calendar size={20} />

              <span>
                {showDateFilter
                  ? "Hide date range"
                  : "Select date range"}
              </span>
            </button>
          </div>

          {/* Accepted Toggle + Refresh at far right */}
          <div
            style={
              styles.filterActions
            }
          >
            <button className="applicant-interactive applicant-toggle"
              type="button"
              aria-pressed={
                showAcceptedApplicants
              }
              style={{
                ...styles.toggleButton,

                ...(showAcceptedApplicants
                  ? styles.toggleButtonActive
                  : {}),
              }}
              onClick={
                toggleAcceptedApplicants
              }
            >
              <span
                style={{
                  ...styles.toggleTrack,

                  ...(showAcceptedApplicants
                    ? styles.toggleTrackActive
                    : {}),
                }}
              >
                <span
                  style={{
                    ...styles.toggleKnob,

                    ...(showAcceptedApplicants
                      ? styles.toggleKnobActive
                      : {}),
                  }}
                />
              </span>

              <span>
                Show Accepted Applicants
              </span>
            </button>

            <button className="applicant-interactive"
              type="button"
              style={
                styles.refreshBtn
              }
              onClick={
                fetchApplicantRecords
              }
              disabled={loading}
              title="Refresh applicants"
            >
              <RefreshCw
                size={19}
              />

              <span>
                {loading
                  ? "Loading..."
                  : "Refresh"}
              </span>
            </button>
          </div>
        </div>

        {showDateFilter && (
          <div
            style={styles.datePanel}
          >
            <label
              style={styles.dateLabel}
            >
              From

              <input className="applicant-input-interactive"
                type="date"
                value={dateFrom}
                min="0001-01-01"
                max={
                  dateTo ||
                  "9999-12-31"
                }
                onInput={(event) => {
                  const nextValue =
                    sanitizeDateInput(
                      event
                        .currentTarget
                        .value
                    );

                  if (
                    event
                      .currentTarget
                      .value !==
                    nextValue
                  ) {
                    event.currentTarget.value =
                      nextValue;
                  }
                }}
                onChange={(event) => {
                  const nextFrom =
                    sanitizeDateInput(
                      event.target.value
                    );

                  setDateFrom(
                    nextFrom
                  );

                  if (
                    dateTo &&
                    nextFrom &&
                    nextFrom > dateTo
                  ) {
                    setDateTo(
                      nextFrom
                    );
                  }
                }}
                style={
                  styles.dateInput
                }
              />
            </label>

            <label
              style={styles.dateLabel}
            >
              To

              <input className="applicant-input-interactive"
                type="date"
                value={dateTo}
                min={
                  dateFrom ||
                  "0001-01-01"
                }
                max="9999-12-31"
                onInput={(event) => {
                  const nextValue =
                    sanitizeDateInput(
                      event
                        .currentTarget
                        .value
                    );

                  if (
                    event
                      .currentTarget
                      .value !==
                    nextValue
                  ) {
                    event.currentTarget.value =
                      nextValue;
                  }
                }}
                onChange={(event) =>
                  setDateTo(
                    sanitizeDateInput(
                      event.target.value
                    )
                  )
                }
                style={
                  styles.dateInput
                }
              />
            </label>

            <button className="applicant-interactive"
              type="button"
              style={styles.clearBtn}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        <div
          style={styles.tableWrapper}
        >
          <table
            style={styles.table}
          >
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>

            <thead>
              <tr
                style={
                  styles.tableHeadRow
                }
              >
                <Th>No.</Th>
                <Th>Applicant</Th>
                <Th>
                  Contact Number
                </Th>
                <Th>
                  Specific Address
                </Th>
                <Th>
                  Preferred Schedule
                </Th>
                <Th>
                  Preferred Pet
                </Th>
                <Th>Pet Place</Th>
                <Th>Resume</Th>
                <Th>Status</Th>
                <Th>
                  Submitted On
                </Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    style={
                      styles.emptyCell
                    }
                  >
                    <div
                      style={
                        styles.loadingContent
                      }
                    >
                      <RefreshCw
                        size={22}
                      />

                      <span>
                        Loading applicant records...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length ? (
                paginatedRecords.map(
                  (
                    record,
                    index
                  ) => (
                    <tr
                      key={
                        record.applicant_id
                      }
                      className="applicant-table-row"
                      role="button"
                      tabIndex={0}
                      style={{
                        ...styles.tableRow,
                        cursor:
                          "pointer",
                      }}
                      onClick={() =>
                        setSelectedRecord(
                          record
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          setSelectedRecord(
                            record
                          );
                        }
                      }}
                    >
                      <td
                        style={
                          styles.numberCell
                        }
                      >
                        {(currentPage -
                          1) *
                          ROWS_PER_PAGE +
                          index +
                          1}
                      </td>

                      <td
                        style={
                          styles.normalCell
                        }
                      >
                        <strong
                          style={
                            styles.primaryText
                          }
                        >
                          {getFullName(
                            record
                          )}
                        </strong>
                      </td>

                      <td
                        style={
                          styles.normalCell
                        }
                      >
                        {formatContactNumber(
                          record.a_contactno
                        )}
                      </td>

                      <td
                        style={
                          styles.addressCell
                        }
                      >
                        {record.a_address ||
                          "Not set"}
                      </td>

                      <td
                        style={
                          styles.scheduleCell
                        }
                      >
                        <div>
                          {formatPreferredSchedule(
                            record
                          )}

                          <span
                            style={
                              styles.scheduleDaysText
                            }
                          >
                            {formatPreferredDays(
                              record
                            )}
                          </span>
                        </div>
                      </td>

                      <td
                        style={
                          styles.normalCell
                        }
                      >
                        <span
                          style={
                            styles.preferredPetText
                          }
                        >
                          {formatPreferredPetType(
                            record.preferred_pet_type
                          )}
                        </span>
                      </td>

                      <td
                        style={
                          styles.normalCell
                        }
                      >
                        {getPetPlaceImages(
                          record
                        ).length ? (
                          <button className="applicant-interactive applicant-file-button"
                            type="button"
                            style={
                              styles.fileCellButton
                            }
                            disabled={
                              openingImageId ===
                              record.applicant_id
                            }
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              openPetPlacePreview(
                                record
                              );
                            }}
                            title="View pet place photos"
                          >
                            {isHttpUrl(
                              getPetPlaceImages(
                                record
                              )[0]
                            ) ? (
                              <img
                                src={
                                  getPetPlaceImages(
                                    record
                                  )[0]
                                }
                                alt={`${getFullName(
                                  record
                                )} pet place`}
                                style={
                                  styles.petPlaceThumbnail
                                }
                                onError={(
                                  event
                                ) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <ImageIcon
                                size={16}
                              />
                            )}

                            <span>
                              {openingImageId ===
                              record.applicant_id
                                ? "Opening..."
                                : "View Photos"}
                            </span>
                          </button>
                        ) : (
                          <span
                            style={
                              styles.mutedCell
                            }
                          >
                            No image
                          </span>
                        )}
                      </td>

                      <td
                        style={
                          styles.normalCell
                        }
                      >
                        {record.resume_file ? (
                          <button className="applicant-interactive applicant-file-button"
                            type="button"
                            style={
                              styles.fileCellButton
                            }
                            disabled={
                              openingResumeId ===
                              record.applicant_id
                            }
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              openResumePreview(
                                record
                              );
                            }}
                          >
                            <FileText
                              size={15}
                            />

                            <span
                              style={
                                styles.resumeFileName
                              }
                              title={getFileName(
                                record.resume_file
                              )}
                            >
                              {openingResumeId ===
                              record.applicant_id
                                ? "Opening..."
                                : "View Resume"}
                            </span>
                          </button>
                        ) : (
                          <span
                            style={
                              styles.mutedCell
                            }
                          >
                            No resume
                          </span>
                        )}
                      </td>

                      <td
                        style={
                          styles.normalCell
                        }
                      >
                        <StatusBadge
                          status={
                            record.application_status
                          }
                        />
                      </td>

                      <td
                        style={
                          styles.normalCell
                        }
                      >
                        {formatDateTime(
                          record.created_at
                        )}
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan="10"
                    style={
                      styles.emptyCell
                    }
                  >
                    No applicants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={styles.pagination}
        >
          <p style={styles.pageText}>
            Showing {firstVisible} to{" "}
            {lastVisible} of{" "}
            {filteredRecords.length}{" "}
            applicants
          </p>

          <div
            style={styles.pages}
          >
            <button className="applicant-interactive"
              style={{
                ...styles.pageBtn,

                ...(currentPage === 1
                  ? styles.disabledBtn
                  : {}),
              }}
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      page - 1,
                      1
                    )
                )
              }
              disabled={
                currentPage === 1
              }
            >
              <ChevronLeft
                size={17}
              />
            </button>

            {Array.from(
              {
                length:
                  totalPages,
              },
              (_, index) =>
                index + 1
            ).map((page) => (
              <button className="applicant-interactive"
                key={page}
                onClick={() =>
                  setCurrentPage(
                    page
                  )
                }
                style={
                  currentPage ===
                  page
                    ? {
                        ...styles.pageBtn,
                        ...styles.activePage,
                      }
                    : styles.pageBtn
                }
              >
                {page}
              </button>
            ))}

            <button className="applicant-interactive"
              style={{
                ...styles.pageBtn,

                ...(currentPage ===
                totalPages
                  ? styles.disabledBtn
                  : {}),
              }}
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      page + 1,
                      totalPages
                    )
                )
              }
              disabled={
                currentPage ===
                totalPages
              }
            >
              <ChevronRight
                size={17}
              />
            </button>
          </div>
        </div>
      </section>

      {selectedRecord && (
        <ApplicantModal
          record={selectedRecord}
          updating={
            updatingId ===
            selectedRecord.applicant_id
          }
          openingResume={
            openingResumeId ===
            selectedRecord.applicant_id
          }
          openingImage={
            openingImageId ===
            selectedRecord.applicant_id
          }
          onClose={() =>
            setSelectedRecord(null)
          }
          onUpdate={updateReview}
          onPreviewResume={
            openResumePreview
          }
          onPreviewImage={
            openPetPlacePreview
          }
        />
      )}

      {mediaPreview && (
        <MediaPreviewModal
          preview={mediaPreview}
          onClose={
            closeMediaPreview
          }
        />
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENTS
|--------------------------------------------------------------------------
*/
function StatCard({
  icon,
  iconStyle,
  title,
  value,
  desc,
  active = false,
  onClick,
}) {
  return (
    <button
      className="applicant-interactive applicant-stat-card"
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        ...styles.statCard,

        ...(active
          ? styles.statCardActive
          : {}),
      }}
    >
      <div
        style={{
          ...styles.statIcon,
          ...iconStyle,
        }}
      >
        {icon}
      </div>

      <div>
        <p
          style={styles.statTitle}
        >
          {title}
        </p>

        <h2
          style={styles.statValue}
        >
          {value}
        </h2>

        <p
          style={styles.statDesc}
        >
          {desc}
        </p>
      </div>
    </button>
  );
}

function Th({ children }) {
  return (
    <th style={styles.th}>
      {children}
    </th>
  );
}

function StatusBadge({ status }) {
  const normalized =
    normalizeStatus(status);

  const badgeStyle =
    normalized === "Pending"
      ? styles.statusPending
      : normalized ===
        "Accepted"
      ? styles.statusAccepted
      : normalized ===
        "Rejected"
      ? styles.statusRejected
      : styles.statusDefault;

  return (
    <span
      style={{
        ...styles.badge,
        ...badgeStyle,
      }}
    >
      {normalized}
    </span>
  );
}

function PreferredDaysDisplay({
  record,
}) {
  const selectedDays =
    getPreferredDays(record);

  const selectedSet =
    new Set(selectedDays);

  return (
    <div
      style={
        styles.preferredDaysWrap
      }
    >
      <div
        style={
          styles.preferredDaysRow
        }
      >
        {PREFERRED_DAY_OPTIONS.map(
          (day) => {
            const isSelected =
              selectedSet.has(
                day.name
              );

            return (
              <div
                key={day.name}
                title={day.name}
                style={{
                  ...styles.preferredDayCircle,
                  ...(isSelected
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

      <p
        style={
          styles.selectedDaysText
        }
      >
        {selectedDays.length
          ? `Selected Days: ${selectedDays
              .map(
                (dayName) =>
                  PREFERRED_DAY_OPTIONS.find(
                    (day) =>
                      day.name ===
                      dayName
                  )?.short ||
                  dayName
              )
              .join(", ")}`
          : "No preferred days selected"}
      </p>
    </div>
  );
}

function ApplicantModal({
  record,
  updating,
  openingResume,
  openingImage,
  onClose,
  onUpdate,
  onPreviewResume,
  onPreviewImage,
}) {
  const [remarks, setRemarks] =
    useState(
      record.review_remarks || ""
    );

  const normalizedStatus =
    normalizeStatus(
      record.application_status
    );

  const reviewCompleted =
    normalizedStatus ===
      "Accepted" ||
    normalizedStatus ===
      "Rejected";

  useEffect(() => {
    setRemarks(
      record.review_remarks || ""
    );
  }, [record]);

  return (
    <div
      style={styles.modalOverlay}
      onClick={
        updating
          ? undefined
          : onClose
      }
    >
      <div
        style={styles.modal}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div
          style={styles.modalHeader}
        >
          <div>
            <h2
              style={
                styles.modalTitle
              }
            >
              Applicant Details
            </h2>

            <p
              style={
                styles.modalSubtitle
              }
            >
              Review the complete application before making a decision.
            </p>
          </div>

          <button className="applicant-interactive applicant-close-button"
            type="button"
            style={
              styles.modalCloseBtn
            }
            disabled={updating}
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>

        <div
          style={styles.modalBody}
        >
          <div
            style={styles.profileTop}
          >
            <div
              style={styles.bigAvatar}
            >
              <UserRound
                size={34}
              />
            </div>

            <div>
              <h3
                style={
                  styles.detailsName
                }
              >
                {getFullName(
                  record
                )}
              </h3>

              <p
                style={
                  styles.detailsLocation
                }
              >
                <MapPin
                  size={13}
                />

                {record.a_address ||
                  "Address not set"}
              </p>

              <StatusBadge
                status={
                  record.application_status
                }
              />
            </div>
          </div>

          <div
            style={styles.detailsGrid}
          >
            <DetailItem
              icon={
                <FileText
                  size={16}
                />
              }
              label="Application Form ID"
              value={formatApplicationId(
                record.application_id
              )}
            />

            <DetailItem
              icon={
                <UserRound
                  size={16}
                />
              }
              label="Applicant ID"
              value={formatApplicantId(
                record.applicant_id
              )}
            />

            <DetailItem
              icon={
                <UserRound
                  size={16}
                />
              }
              label="First Name"
              value={
                record.a_fname ||
                "Not set"
              }
            />

            <DetailItem
              icon={
                <UserRound
                  size={16}
                />
              }
              label="Last Name"
              value={
                record.a_lname ||
                "Not set"
              }
            />

            <DetailItem
              icon={
                <Phone size={16} />
              }
              label="Contact Number"
              value={formatContactNumber(
                record.a_contactno
              )}
            />

            <DetailItem
              icon={
                <Mail size={16} />
              }
              label="Email Address"
              value={
                record.a_email ||
                "Not set"
              }
            />

            <div
              style={
                styles.wideDetailItem
              }
            >
              <div
                style={
                  styles.detailIcon
                }
              >
                <MapPin
                  size={16}
                />
              </div>

              <div>
                <p
                  style={
                    styles.detailLabel
                  }
                >
                  Specific Address
                </p>

                <h4
                  style={
                    styles.detailValue
                  }
                >
                  {record.a_address ||
                    "Not set"}
                </h4>

                {!isSpecificAddress(
                  record.a_address
                ) && (
                  <p
                    style={
                      styles.validationHint
                    }
                  >
                    Please provide enough location details to identify the applicant's residence.
                  </p>
                )}
              </div>
            </div>

            <div
              style={
                styles.wideDetailItem
              }
            >
              <div
                style={
                  styles.detailIcon
                }
              >
                <Calendar
                  size={16}
                />
              </div>

              <div>
                <p
                  style={
                    styles.detailLabel
                  }
                >
                  Preferred Pet Sitting Schedule
                </p>

                <h4
                  style={
                    styles.detailValue
                  }
                >
                  {formatPreferredSchedule(
                    record
                  )}
                </h4>

                <PreferredDaysDisplay
                  record={record}
                />

                {!hasCompletePreferredSchedule(
                  record
                ) && (
                  <p
                    style={
                      styles.validationHint
                    }
                  >
                    Preferred days, start time, and end time are required before acceptance.
                  </p>
                )}
              </div>
            </div>

            <div
              style={
                styles.wideDetailItem
              }
            >
              <div
                style={
                  styles.detailIcon
                }
              >
                <UserRound
                  size={16}
                />
              </div>

              <div>
                <p
                  style={
                    styles.detailLabel
                  }
                >
                  Preferred Pet
                </p>

                <h4
                  style={
                    styles.detailValue
                  }
                >
                  {formatPreferredPetType(
                    record.preferred_pet_type
                  )}
                </h4>
              </div>
            </div>

            <div
              style={styles.mediaCard}
            >
              <div
                style={
                  styles.mediaHeader
                }
              >
                <div
                  style={
                    styles.detailIcon
                  }
                >
                  <ImageIcon
                    size={16}
                  />
                </div>

                <div>
                  <p
                    style={
                      styles.detailLabel
                    }
                  >
                    Pet Place
                  </p>

                  <h4
                    style={
                      styles.detailValue
                    }
                  >
                    {getPetPlaceImages(
                      record
                    ).length
                      ? `Pet Place Photos (${getPetPlaceImages(
                          record
                        ).length})`
                      : "No photos available"}
                  </h4>
                </div>
              </div>

              {getPetPlaceImages(
                record
              ).length > 0 && (
                <button className="applicant-interactive applicant-media-button"
                  type="button"
                  style={
                    styles.mediaPreviewButton
                  }
                  disabled={
                    openingImage
                  }
                  onClick={() =>
                    onPreviewImage(
                      record
                    )
                  }
                >
                  {isHttpUrl(
                    getPetPlaceImages(
                      record
                    )[0]
                  ) ? (
                    <img
                      src={
                        getPetPlaceImages(
                          record
                        )[0]
                      }
                      alt={`${getFullName(
                        record
                      )} pet place`}
                      style={
                        styles.petPlaceImage
                      }
                    />
                  ) : (
                    <div
                      style={
                        styles.filePreviewPlaceholder
                      }
                    >
                      <ImageIcon
                        size={30}
                      />
                    </div>
                  )}

                  <span
                    style={
                      styles.mediaActionText
                    }
                  >
                    <Eye size={14} />

                    {openingImage
                      ? "Opening..."
                      : "View Pet Place Photos"}
                  </span>
                </button>
              )}
            </div>

            <DetailItem
              icon={
                <Calendar
                  size={16}
                />
              }
              label="Date of Birth"
              value={formatDate(
                record.a_dob,
                "Not set"
              )}
            />

            <DetailItem
              icon={
                <Calendar
                  size={16}
                />
              }
              label="Submitted On"
              value={formatDateTime(
                record.created_at
              )}
            />

            <DetailItem
              icon={
                <Calendar
                  size={16}
                />
              }
              label="Reviewed On"
              value={formatDate(
                record.review_date
              )}
            />

            <div
              style={styles.resumeCard}
            >
              <div
                style={
                  styles.detailIcon
                }
              >
                <FileText
                  size={16}
                />
              </div>

              <div
                style={
                  styles.resumeCardContent
                }
              >
                <p
                  style={
                    styles.detailLabel
                  }
                >
                  Resume File
                </p>

                <h4
                  style={
                    styles.detailValue
                  }
                >
                  {record.resume_file
                    ? getFileName(record.resume_file)
                    : "No resume uploaded"}
                </h4>

                {record.resume_file && (
                  <button className="applicant-interactive applicant-file-button"
                    type="button"
                    style={
                      styles.modalFileButton
                    }
                    disabled={
                      openingResume
                    }
                    onClick={() =>
                      onPreviewResume(
                        record
                      )
                    }
                  >
                    <Eye size={15} />

                    {openingResume
                      ? "Opening..."
                      : "View Resume"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            style={styles.remarksBox}
          >
            <p
              style={
                styles.detailLabel
              }
            >
              Review Remarks
            </p>

            <textarea className="applicant-input-interactive"
              value={remarks}
              onChange={(event) =>
                setRemarks(
                  event.target.value
                )
              }
              placeholder="Enter review remarks..."
              readOnly={
                reviewCompleted
              }
              style={
                reviewCompleted
                  ? {
                      ...styles.remarksInput,
                      ...styles.readOnlyRemarks,
                    }
                  : styles.remarksInput
              }
            />
          </div>
        </div>

        {!reviewCompleted && (
          <div
            style={styles.modalActions}
          >
            <button className="applicant-interactive applicant-danger"
              type="button"
              style={
                styles.rejectModalBtn
              }
              disabled={updating}
              onClick={() =>
                onUpdate(
                  record,
                  "Rejected",
                  remarks
                )
              }
            >
              Reject
            </button>

            <button className="applicant-interactive applicant-success"
              type="button"
              style={
                styles.acceptModalBtn
              }
              disabled={updating}
              onClick={() =>
                onUpdate(
                  record,
                  "Accepted",
                  remarks
                )
              }
            >
              {updating
                ? "Processing..."
                : "Accept"}
            </button>
          </div>
        )}

        {reviewCompleted && (
          <div
            style={
              styles.reviewCompleteNotice
            }
          >
            This application review is complete and can no longer be changed.
          </div>
        )}
      </div>
    </div>
  );
}

function MediaPreviewModal({
  preview,
  onClose,
}) {
  const imageUrls =
    preview.type === "image-carousel"
      ? preview.urls || []
      : [];

  const [currentIndex, setCurrentIndex] =
    useState(
      preview.initialIndex || 0
    );

  useEffect(() => {
    setCurrentIndex(
      preview.initialIndex || 0
    );
  }, [preview]);

  const hasMultipleImages =
    imageUrls.length > 1;

  const currentImage =
    imageUrls[currentIndex] || "";

  function showPreviousImage() {
    if (!imageUrls.length) return;

    setCurrentIndex(
      (previous) =>
        (previous -
          1 +
          imageUrls.length) %
        imageUrls.length
    );
  }

  function showNextImage() {
    if (!imageUrls.length) return;

    setCurrentIndex(
      (previous) =>
        (previous + 1) %
        imageUrls.length
    );
  }

  return (
    <div
      style={
        styles.previewOverlay
      }
      onClick={onClose}
    >
      <div
        style={
          styles.previewModal
        }
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div
          style={
            styles.previewHeader
          }
        >
          <div>
            <p
              style={
                styles.previewEyebrow
              }
            >
              {preview.type === "pdf"
                ? "RESUME PREVIEW"
                : "PET PLACE PHOTOS"}
            </p>

            <h3
              style={
                styles.previewTitle
              }
            >
              {preview.title}
            </h3>

            {preview.type ===
              "image-carousel" &&
              imageUrls.length > 0 && (
                <p
                  style={
                    styles.carouselCounter
                  }
                >
                  Photo{" "}
                  {currentIndex + 1} of{" "}
                  {imageUrls.length}
                </p>
              )}
          </div>

          <button className="applicant-interactive applicant-close-button"
            type="button"
            aria-label="Close preview"
            style={
              styles.previewClose
            }
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>

        <div
          style={
            styles.previewBody
          }
        >
          {preview.type ===
          "pdf" ? (
            <iframe
              title={preview.title}
              src={preview.url}
              style={
                styles.pdfFrame
              }
            />
          ) : (
            <div
              style={
                styles.carouselStage
              }
            >
              {hasMultipleImages && (
                <button className="applicant-interactive"
                  type="button"
                  aria-label="Previous photo"
                  style={{
                    ...styles.carouselArrow,
                    ...styles.carouselArrowLeft,
                  }}
                  onClick={
                    showPreviousImage
                  }
                >
                  <ChevronLeft
                    size={26}
                  />
                </button>
              )}

              <img
                src={currentImage}
                alt={`${preview.title} photo ${
                  currentIndex + 1
                }`}
                style={
                  styles.fullPreviewImage
                }
              />

              {hasMultipleImages && (
                <button className="applicant-interactive"
                  type="button"
                  aria-label="Next photo"
                  style={{
                    ...styles.carouselArrow,
                    ...styles.carouselArrowRight,
                  }}
                  onClick={
                    showNextImage
                  }
                >
                  <ChevronRight
                    size={26}
                  />
                </button>
              )}

              {hasMultipleImages && (
                <div
                  style={
                    styles.carouselDots
                  }
                >
                  {imageUrls.map(
                    (_, index) => (
                      <button className="applicant-interactive applicant-carousel-dot"
                        key={index}
                        type="button"
                        aria-label={`View photo ${
                          index + 1
                        }`}
                        onClick={() =>
                          setCurrentIndex(
                            index
                          )
                        }
                        style={{
                          ...styles.carouselDot,
                          ...(index ===
                          currentIndex
                            ? styles.carouselDotActive
                            : {}),
                        }}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}) {
  return (
    <div
      style={styles.detailItem}
    >
      <div
        style={styles.detailIcon}
      >
        {icon}
      </div>

      <div>
        <p
          style={styles.detailLabel}
        >
          {label}
        </p>

        <h4
          style={styles.detailValue}
        >
          {value}
        </h4>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/
const PREFERRED_DAY_OPTIONS = [
  {
    name: "Monday",
    short: "Mon",
    letter: "M",
  },
  {
    name: "Tuesday",
    short: "Tue",
    letter: "T",
  },
  {
    name: "Wednesday",
    short: "Wed",
    letter: "W",
  },
  {
    name: "Thursday",
    short: "Thu",
    letter: "T",
  },
  {
    name: "Friday",
    short: "Fri",
    letter: "F",
  },
  {
    name: "Saturday",
    short: "Sat",
    letter: "S",
  },
  {
    name: "Sunday",
    short: "Sun",
    letter: "S",
  },
];

function flattenFlexibleValues(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(
      flattenFlexibleValues
    );
  }

  if (typeof value === "object") {
    if (Array.isArray(value.urls)) {
      return value.urls.flatMap(
        flattenFlexibleValues
      );
    }

    if (Array.isArray(value.images)) {
      return value.images.flatMap(
        flattenFlexibleValues
      );
    }

    if (Array.isArray(value.photos)) {
      return value.photos.flatMap(
        flattenFlexibleValues
      );
    }

    if (Array.isArray(value.days)) {
      return value.days.flatMap(
        flattenFlexibleValues
      );
    }

    return Object.entries(value)
      .filter(
        ([, enabled]) =>
          Boolean(enabled)
      )
      .map(([key]) => key);
  }

  const text = String(value).trim();

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
      return flattenFlexibleValues(
        JSON.parse(text)
      );
    } catch {
      // Fall back to delimiter parsing below.
    }
  }

  if (
    text.includes("|") ||
    text.includes(";") ||
    text.includes(",")
  ) {
    return text
      .split(/[|;,]/)
      .map(
        (item) => item.trim()
      )
      .filter(Boolean);
  }

  return [text];
}

function parsePetPlaceImageValues(
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
      parsePetPlaceImageValues
    );
  }

  if (typeof value === "object") {
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

    for (const key of [
      "urls",
      "images",
      "photos",
      "files",
    ]) {
      if (value[key]) {
        return parsePetPlaceImageValues(
          value[key]
        );
      }
    }

    return [];
  }

  const text = String(value).trim();

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
      return parsePetPlaceImageValues(
        JSON.parse(text)
      );
    } catch {
      // Fall through to plain string handling.
    }
  }

  /*
    Multiple mobile uploads are expected to arrive as an array/JSON
    value. "|" and ";" are also supported for older text payloads.
    Do not split plain URLs on commas because commas may legally
    appear inside a URL.
  */
  if (
    text.includes("|") ||
    text.includes(";") ||
    (text.includes(",") &&
      !isHttpUrl(text))
  ) {
    return text
      .split(/[|;,]/)
      .map(
        (item) => item.trim()
      )
      .filter(Boolean);
  }

  return [text];
}

function getPetPlaceImages(record) {
  const candidates = [
    record?.pet_place_photos,
    record?.pet_place_images,
    record?.pet_place_urls,
    record?.place_photos,
    record?.place_images,
    record?.pet_place_files,
    record?.pet_place,
  ];

  const firstPopulated =
    candidates.find(
      (value) =>
        parsePetPlaceImageValues(
          value
        ).length
    );

  return Array.from(
    new Set(
      parsePetPlaceImageValues(
        firstPopulated
      )
        .map(
          (item) =>
            String(
              item || ""
            ).trim()
        )
        .filter(Boolean)
    )
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

  const aliases = {
    m: "Monday",
    mon: "Monday",
    monday: "Monday",
    t: "Tuesday",
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

  return aliases[text] || "";
}

function getPreferredDays(record) {
  /*
    preferred_days is now the official APPLICATION column.
    The fallback aliases are kept only for compatibility with
    older/mobile test records.
  */
  const candidates = [
    record?.preferred_days,
    record?.preferred_pet_sitting_days,
    record?.preferred_weekdays,
    record?.preferred_day,
    record?.selected_days,
    record?.availability_days,
    record?.available_days,
  ];

  const firstPopulated =
    candidates.find((value) =>
      flattenFlexibleValues(
        value
      ).length
    );

  const normalized =
    flattenFlexibleValues(
      firstPopulated
    )
      .map(normalizePreferredDay)
      .filter(Boolean);

  const selectedSet =
    new Set(normalized);

  return PREFERRED_DAY_OPTIONS
    .map((day) => day.name)
    .filter((dayName) =>
      selectedSet.has(dayName)
    );
}

function formatPreferredPetType(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not set";
  }

  const values = Array.isArray(value)
    ? value
    : String(value)
        .split(/[,|;]/)
        .map((item) => item.trim())
        .filter(Boolean);

  if (!values.length) {
    return "Not set";
  }

  return values
    .map((item) => {
      const normalized = String(item)
        .trim()
        .toLowerCase();

      if (
        normalized === "dog" ||
        normalized === "dogs" ||
        normalized === "canine"
      ) {
        return "Dog";
      }

      if (
        normalized === "cat" ||
        normalized === "cats" ||
        normalized === "feline"
      ) {
        return "Cat";
      }

      if (
        normalized === "both" ||
        normalized === "cat and dog" ||
        normalized === "dog and cat" ||
        normalized === "cats and dogs" ||
        normalized === "dogs and cats"
      ) {
        return "Dog and Cat";
      }

      return String(item)
        .trim()
        .replace(
          /\w/g,
          (letter) =>
            letter.toUpperCase()
        );
    })
    .join(", ");
}

function formatPreferredDays(
  record
) {
  const days =
    getPreferredDays(record);

  if (!days.length) {
    return "Days: Not set";
  }

  return `Days: ${days
    .map(
      (dayName) =>
        PREFERRED_DAY_OPTIONS.find(
          (day) =>
            day.name === dayName
        )?.short || dayName
    )
    .join(", ")}`;
}

function revokePreviewObjectUrls(
  preview
) {
  if (!preview) return;

  const urlsToRevoke = [
    ...(Array.isArray(
      preview.revokeUrls
    )
      ? preview.revokeUrls
      : []),
  ];

  if (
    preview.revokeOnClose &&
    preview.url
  ) {
    urlsToRevoke.push(
      preview.url
    );
  }

  Array.from(
    new Set(urlsToRevoke)
  ).forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore cleanup failures.
    }
  });
}

function normalizeStatus(status) {
  const value = String(
    status || "Pending"
  )
    .trim()
    .toLowerCase();

  /*
    Keep backward compatibility with older records that were saved
    using the previous "Approved" term, but display/use Accepted
    everywhere in the Admin interface.
  */
  if (
    value === "approved" ||
    value === "accepted"
  ) {
    return "Accepted";
  }

  if (
    value === "rejected" ||
    value === "declined"
  ) {
    return "Rejected";
  }

  return "Pending";
}

function getFullName(record) {
  return `${record.a_fname || ""} ${
    record.a_lname || ""
  }`.trim() || "Name not set";
}

function formatApplicationId(id) {
  return id === null ||
    id === undefined ||
    id === ""
    ? "Not assigned"
    : `APP-${String(id).padStart(
        4,
        "0"
      )}`;
}

function formatApplicantId(id) {
  return id === null ||
    id === undefined ||
    id === ""
    ? "N/A"
    : `AP-${String(id).padStart(
        4,
        "0"
      )}`;
}

function formatContactNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not set";
  }

  let text = String(value)
    .trim()
    .replace(/\D/g, "");

  /*
    Preserve Philippine mobile numbers that were previously
    stored as numeric values and lost the leading zero.
  */
  if (
    text.length === 10 &&
    text.startsWith("9")
  ) {
    text = `0${text}`;
  }

  return text || "Not set";
}

function buildSitterUsername(
  record
) {
  const firstName = String(
    record.a_fname || "sitter"
  )
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const lastName = String(
    record.a_lname || "user"
  )
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const idPart = String(
    record.applicant_id || ""
  ).replace(/\D/g, "");

  const suffix = idPart
    ? `_${idPart}`
    : "";

  const maximumBaseLength =
    Math.max(
      4,
      20 - suffix.length
    );

  let base =
    `${firstName}_${lastName}`
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(
        0,
        maximumBaseLength
      );

  if (base.length < 4) {
    base = `${base}sitter`
      .slice(
        0,
        maximumBaseLength
      );
  }

  return `${base}${suffix}`.slice(
    0,
    20
  );
}

function validateApplicantForAcceptance(
  record
) {
  const email = String(
    record.a_email || ""
  )
    .trim()
    .toLowerCase();

  if (!email) {
    return "The applicant must have an email address before acceptance so the Pet Sitter verification email can be sent.";
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    return "The applicant email address is invalid.";
  }

  if (
    !isSpecificAddress(
      record.a_address
    )
  ) {
    return "The applicant must provide a complete address before acceptance.";
  }

  if (
    !hasCompletePreferredSchedule(
      record
    )
  ) {
    return "The applicant must select at least one preferred day and provide a preferred start time and end time before acceptance.";
  }

  return "";
}

function isSpecificAddress(value) {
  const text = String(
    value || ""
  )
    .trim()
    .replace(/\s+/g, " ");

  /*
    The address no longer requires a strict comma-separated format.
    A reasonably descriptive residence/address is enough, such as:
    "Aldea Homes Block 5 Lot 3 Cangmating Sibulan".
  */
  if (text.length < 12) {
    return false;
  }

  const words = text
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);

  return words.length >= 3;
}

function hasCompletePreferredSchedule(
  record
) {
  return Boolean(
    getPreferredDays(record).length &&
      record.preferred_start_time &&
      record.preferred_end_time
  );
}

function formatPreferredSchedule(
  record
) {
  const startTime = formatTime(
    record.preferred_start_time
  );

  const endTime = formatTime(
    record.preferred_end_time
  );

  if (
    !record.preferred_start_time &&
    !record.preferred_end_time
  ) {
    return "Time not set";
  }

  if (
    !record.preferred_start_time
  ) {
    return `Starts: Not set • Ends: ${endTime}`;
  }

  if (
    !record.preferred_end_time
  ) {
    return `Starts: ${startTime} • Ends: Not set`;
  }

  return `${startTime} - ${endTime}`;
}

function formatTime(value) {
  if (!value) {
    return "Not set";
  }

  const text = String(value)
    .trim()
    .slice(0, 5);

  const match = text.match(
    /^(\d{2}):(\d{2})$/
  );

  if (!match) {
    return text;
  }

  let hour = Number(match[1]);
  const minute = match[2];

  const period =
    hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
}

function getFileName(value) {
  if (!value) {
    return "No resume";
  }

  try {
    const decoded =
      decodeURIComponent(
        String(value)
      );

    const cleanValue =
      decoded.split("?")[0];

    const parts =
      cleanValue.split("/");

    return (
      parts[
        parts.length - 1
      ] || decoded
    );
  } catch {
    const parts = String(
      value
    ).split("/");

    return (
      parts[
        parts.length - 1
      ] || String(value)
    );
  }
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

function getStoragePath(
  value,
  bucketName
) {
  const text = String(
    value || ""
  ).trim();

  if (!text) return "";

  if (isHttpUrl(text)) {
    const publicMarker =
      `/storage/v1/object/public/${bucketName}/`;

    const signedMarker =
      `/storage/v1/object/sign/${bucketName}/`;

    const authenticatedMarker =
      `/storage/v1/object/authenticated/${bucketName}/`;

    for (const marker of [
      publicMarker,
      signedMarker,
      authenticatedMarker,
    ]) {
      const markerIndex =
        text.indexOf(marker);

      if (markerIndex !== -1) {
        return decodeURIComponent(
          text
            .slice(
              markerIndex +
                marker.length
            )
            .split("?")[0]
        );
      }
    }

    try {
      const url =
        new URL(text);

      return decodeURIComponent(
        url.pathname
          .split("/")
          .pop() || ""
      );
    } catch {
      return "";
    }
  }

  const normalized =
    text.replace(/^\/+/, "");

  const bucketPrefix =
    `${bucketName}/`;

  return normalized.startsWith(
    bucketPrefix
  )
    ? normalized.slice(
        bucketPrefix.length
      )
    : normalized;
}

async function resolvePreviewFile(
  value,
  bucketCandidates,
  expectedType
) {
  const text = String(
    value || ""
  ).trim();

  if (!text) {
    throw new Error(
      "No file was provided."
    );
  }

  /*
    For HTTP images, the existing URL can be shown directly
    without redirecting the browser.
  */
  if (
    expectedType === "image" &&
    isHttpUrl(text)
  ) {
    return {
      url: text,
      revokeOnClose: false,
    };
  }

  /*
    For PDF HTTP URLs, fetch the file into a Blob so it opens
    inside our iframe rather than triggering a download.
  */
  if (
    expectedType === "pdf" &&
    isHttpUrl(text)
  ) {
    const response =
      await fetch(text);

    if (!response.ok) {
      throw new Error(
        "Unable to retrieve the resume file."
      );
    }

    const blob =
      await response.blob();

    const objectUrl =
      URL.createObjectURL(blob);

    return {
      url: objectUrl,
      revokeOnClose: true,
    };
  }

  let lastError = null;

  for (
    const bucketName of bucketCandidates
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
      } = await supabase.storage
        .from(bucketName)
        .download(storagePath);

      if (error) {
        lastError = error;
        continue;
      }

      const objectUrl =
        URL.createObjectURL(data);

      return {
        url: objectUrl,
        revokeOnClose: true,
      };
    } catch (candidateError) {
      lastError =
        candidateError;
    }
  }

  throw (
    lastError ||
    new Error(
      "Unable to retrieve the uploaded file."
    )
  );
}

function sanitizeDateInput(value) {
  const text = String(
    value || ""
  ).trim();

  if (!text) return "";

  const match = text.match(
    /^(\d{1,})-(\d{1,2})-(\d{1,2})$/
  );

  if (!match) return text;

  const year =
    match[1].slice(0, 4);

  const month =
    match[2]
      .padStart(2, "0")
      .slice(0, 2);

  const day =
    match[3]
      .padStart(2, "0")
      .slice(0, 2);

  if (year.length < 4) {
    return "";
  }

  const normalized =
    `${year}-${month}-${day}`;

  return normalized >
    "9999-12-31"
    ? "9999-12-31"
    : normalized;
}

function getDateOnlyValue(
  dateValue
) {
  if (!dateValue) return "";

  const rawValue =
    Array.isArray(dateValue)
      ? dateValue[0]
      : dateValue;

  const text = String(
    rawValue || ""
  ).trim();

  if (!text) return "";

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return text;
  }

  const date =
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(date);

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

function getPhilippineDateOnly() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value;

  return `${year}-${month}-${day}`;
}

function formatDate(
  value,
  fallback = "Not reviewed"
) {
  if (!value) {
    return fallback;
  }

  const raw =
    Array.isArray(value)
      ? value[0]
      : value;

  if (!raw) {
    return fallback;
  }

  const date =
    new Date(
      `${String(raw).slice(
        0,
        10
      )}T00:00:00`
    );

  return Number.isNaN(
    date.getTime()
  )
    ? String(raw)
    : new Intl.DateTimeFormat(
        "en-PH",
        {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }
      ).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "Not set";
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? String(value)
    : new Intl.DateTimeFormat(
        "en-PH",
        {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone:
            "Asia/Manila",
        }
      ).format(date);
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/
const styles = {
  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    marginBottom: 24,
  },

  title: {
    margin: 0,
    color: "var(--app-strong)",
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "var(--app-muted)",
    fontSize: 15,
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    color: "var(--app-strong)",
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  chevron: {
    color: "var(--app-muted)",
    fontSize: 22,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: 18,
    marginBottom: 24,
  },

  statCard: {
    width: "100%",
    height: 118,
    background: "var(--app-card)",
    borderRadius: 16,
    border:
      "1px solid var(--app-border)",
    boxShadow: "var(--app-shadow)",
    padding: 18,
    display: "flex",
    alignItems: "center",
    gap: 16,
    boxSizing: "border-box",
    textAlign: "left",
    fontFamily: "inherit",
    cursor: "pointer",
    transition:
      "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
  },

  statCardActive: {
    borderColor:
      BRAND.pink,
    boxShadow:
      "0 8px 18px rgba(217,67,104,0.12), 0 0 0 2px rgba(217,67,104,0.08)",
    transform:
      "translateY(-1px)",
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

  statRed: {
    background: "#FCE2E8",
    color: "#E11D48",
  },

  statTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    color: "var(--app-text)",
  },

  statValue: {
    margin: "4px 0 2px",
    fontSize: 28,
    fontWeight: 900,
    color: "var(--app-strong)",
  },

  statDesc: {
    margin: 0,
    fontSize: 12,
    color: "var(--app-muted)",
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    marginBottom: 18,
    borderRadius: 10,
    border:
      "1px solid #F1BFC5",
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
    background:
      "transparent",
    color: "#B42335",
    cursor: "pointer",
  },

  successBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    marginBottom: 18,
    borderRadius: 10,
    border:
      "1px solid #B7E2C9",
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
    background:
      "transparent",
    color: "#08783C",
    cursor: "pointer",
    display: "flex",
    padding: 0,
  },

  tableCard: {
    width: "100%",
    background: "var(--app-card)",
    borderRadius: 16,
    border:
      "1px solid var(--app-border)",
    boxShadow: "var(--app-shadow)",
    padding:
      "22px 14px 16px",
    boxSizing: "border-box",
  },

  filters: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    padding:
      "0 12px 22px",
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
    border:
      "1px solid var(--app-border-strong)",
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    background: "var(--app-card)",
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
    color: "var(--app-text)",
    background:
      "transparent",
    minWidth: 0,
  },

  filterActions: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "flex-end",
    gap: 10,
  },

  refreshBtn: {
    height: 48,
    border:
      "1px solid var(--app-border-strong)",
    borderRadius: 7,
    background: "var(--app-card)",
    color: "var(--app-strong)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease",
  },

  dateBtn: {
    width: 210,
    height: 48,
    border:
      "1px solid var(--app-border-strong)",
    borderRadius: 7,
    background: "var(--app-card)",
    color: "var(--app-muted)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 16px",
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease",
  },

  toggleButton: {
    height: 48,
    border:
      "1px solid var(--app-border-strong)",
    borderRadius: 7,
    background: "var(--app-card)",
    color: "var(--app-strong)",
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    padding: "0 12px",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease",
  },

  toggleButtonActive: {
    borderColor:
      "#D9A4B1",
    background: "#FFF7F9",
  },

  toggleTrack: {
    width: 34,
    height: 20,
    padding: 2,
    borderRadius: 999,
    background: "#D8CFCD",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    transition:
      "background 0.18s ease",
  },

  toggleTrackActive: {
    background:
      BRAND.pink,
  },

  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#FFFFFF",
    transform:
      "translateX(0)",
    transition:
      "transform 0.18s ease",
    boxShadow:
      "0 1px 4px rgba(0,0,0,0.2)",
  },

  toggleKnobActive: {
    transform:
      "translateX(14px)",
  },

  datePanel: {
    margin:
      "0 12px 18px",
    padding: 14,
    border:
      "1px solid var(--app-border)",
    borderRadius: 10,
    background: "var(--app-table-head)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  datePanelTitle: {
    fontSize: 12,
    fontWeight: 900,
    color: BRAND.pink,
    textTransform:
      "uppercase",
    letterSpacing: "0.4px",
  },

  dateLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
    color: "var(--app-strong)",
  },

  dateInput: {
    height: 38,
    background: "var(--app-input)",
    border:
      "1px solid var(--app-border-strong)",
    borderRadius: 7,
    padding: "0 10px",
    color: "var(--app-text)",
    outline: "none",
    transition:
      "border-color 0.18s ease, box-shadow 0.18s ease",
  },

  clearBtn: {
    height: 38,
    border:
      "1px solid var(--app-border-strong)",
    borderRadius: 7,
    background: "var(--app-card)",
    color: "var(--app-strong)",
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
    minWidth: 1320,
    borderCollapse:
      "collapse",
    tableLayout: "fixed",
  },

  tableHeadRow: {
    background: "var(--app-table-head)",
    borderTop:
      "1px solid var(--app-border)",
    borderBottom:
      "1px solid var(--app-border)",
  },

  th: {
    textAlign: "left",
    padding: "13px 10px",
    color: "var(--app-text)",
    fontSize: 12.5,
    fontWeight: 900,
    whiteSpace: "normal",
    lineHeight: 1.25,
  },

  tableRow: {
    borderBottom:
      "1px solid var(--app-border)",
    transition:
      "background 0.16s ease, box-shadow 0.16s ease",
  },

  numberCell: {
    padding: "13px 10px",
    color: "var(--app-muted)",
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
    textAlign: "center",
  },

  normalCell: {
    padding: "13px 10px",
    fontSize: 12.5,
    color: "var(--app-text)",
    whiteSpace: "normal",
    lineHeight: 1.4,
    overflowWrap: "anywhere",
    verticalAlign: "middle",
  },

  addressCell: {
    padding: "13px 10px",
    fontSize: 12.5,
    color: "var(--app-text)",
    minWidth: 0,
    whiteSpace: "normal",
    lineHeight: 1.4,
    overflowWrap: "anywhere",
    verticalAlign: "middle",
  },

  scheduleCell: {
    padding: "13px 10px",
    fontSize: 12,
    color: "var(--app-text)",
    minWidth: 0,
    whiteSpace: "normal",
    lineHeight: 1.4,
    fontWeight: 700,
    overflowWrap: "anywhere",
    verticalAlign: "middle",
  },

  preferredPetText: {
    display: "inline-block",
    color: "var(--app-strong)",
    fontSize: 12.5,
    fontWeight: 800,
    lineHeight: 1.4,
  },

  scheduleDaysText: {
    display: "block",
    marginTop: 5,
    color: BRAND.pink,
    fontSize: 11,
    fontWeight: 800,
    lineHeight: 1.35,
  },

  primaryText: {
    display: "block",
    fontSize: 13,
    color: "var(--app-text)",
    fontWeight: 800,
  },

  fileCellButton: {
    width: "100%",
    maxWidth: "100%",
    border: "none",
    background:
      "transparent",
    padding: 0,
    display:
      "inline-flex",
    alignItems: "center",
    gap: 6,
    color: BRAND.pink,
    fontSize: 11.5,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    overflow: "hidden",
    textAlign: "left",
  },

  petPlaceThumbnail: {
    width: 48,
    minWidth: 48,
    maxWidth: 48,
    height: 38,
    minHeight: 38,
    maxHeight: 38,
    flex: "0 0 48px",
    display: "block",
    borderRadius: 8,
    objectFit: "cover",
    objectPosition: "center",
    border:
      "1px solid var(--app-border-strong)",
    background: "var(--app-soft)",
    boxSizing: "border-box",
  },

  resumeFileName: {
    display: "block",
    minWidth: 0,
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },

  mutedCell: {
    color: "var(--app-muted)",
    fontSize: 12,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 76,
    height: 26,
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 800,
  },

  statusPending: {
    background: "#FDEADB",
    color: "#F2650C",
  },

  statusAccepted: {
    background: "#DDF4E7",
    color: "#0B8F45",
  },

  statusRejected: {
    background: "#FCE2E8",
    color: "#E11D48",
  },

  statusDefault: {
    background: "#EEE9E7",
    color: "var(--app-muted)",
  },

  emptyCell: {
    padding: 28,
    textAlign: "center",
    color: "var(--app-muted)",
    fontSize: 14,
    fontWeight: 700,
  },

  loadingContent: {
    display:
      "inline-flex",
    alignItems: "center",
    gap: 10,
  },

  pagination: {
    padding:
      "14px 12px 0",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: 16,
  },

  pageText: {
    margin: 0,
    fontSize: 13,
    color: "var(--app-text)",
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
    border:
      "1px solid var(--app-border-strong)",
    background: "var(--app-card)",
    color: "var(--app-text)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display:
      "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease",
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

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(35, 20, 16, 0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 20,
  },

  modal: {
    width:
      "min(820px, 100%)",
    maxHeight: "90vh",
    background: "var(--app-card)",
    borderRadius: 18,
    border:
      "1px solid var(--app-border)",
    boxShadow:
      "0 22px 50px rgba(51,26,18,0.22)",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  modalHeader: {
    display: "flex",
    alignItems:
      "flex-start",
    justifyContent:
      "space-between",
    gap: 16,
    borderBottom:
      "1px solid var(--app-border)",
    padding:
      "22px 22px 16px",
    flexShrink: 0,
  },

  modalBody: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding:
      "18px 22px 22px",
  },

  modalTitle: {
    margin: 0,
    color: "var(--app-strong)",
    fontSize: 24,
    fontWeight: 900,
  },

  modalSubtitle: {
    margin: "4px 0 0",
    color: BRAND.pink,
    fontSize: 13,
    fontWeight: 800,
  },

  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    border:
      "1px solid var(--app-border-strong)",
    background: "var(--app-card)",
    color: "var(--app-strong)",
    cursor: "pointer",
    display:
      "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, color 0.18s ease",
  },

  profileTop: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    paddingBottom: 18,
    borderBottom:
      "1px solid var(--app-border)",
    marginBottom: 18,
  },

  bigAvatar: {
    width: 74,
    height: 74,
    borderRadius: "50%",
    background: BRAND.softPink,
    color: BRAND.pink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  detailsName: {
    margin: 0,
    color: "var(--app-strong)",
    fontSize: 22,
    fontWeight: 900,
  },

  detailsLocation: {
    margin:
      "5px 0 10px",
    color: "var(--app-muted)",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 5,
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  detailItem: {
    border:
      "1px solid var(--app-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--app-card-soft)",
    display: "flex",
    gap: 10,
    alignItems:
      "flex-start",
    minHeight: 82,
    boxSizing: "border-box",
  },

  wideDetailItem: {
    gridColumn: "span 2",
    border:
      "1px solid var(--app-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--app-card-soft)",
    display: "flex",
    gap: 10,
    alignItems:
      "flex-start",
    minHeight: 82,
    boxSizing: "border-box",
  },

  detailIcon: {
    width: 34,
    height: 34,
    minWidth: 34,
    borderRadius: 8,
    background: "#F9DCE5",
    color: "#D94D72",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  detailLabel: {
    margin: "0 0 7px",
    color: "var(--app-muted)",
    fontSize: 12,
    fontWeight: 900,
  },

  detailValue: {
    margin: 0,
    color: "var(--app-text)",
    fontSize: 14,
    fontWeight: 900,
    overflowWrap:
      "anywhere",
  },

  validationHint: {
    margin: "8px 0 0",
    color: "#B45309",
    fontSize: 11,
    lineHeight: 1.45,
    fontWeight: 700,
  },

  preferredDaysWrap: {
    marginTop: 14,
  },

  preferredDaysRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  preferredDayCircle: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--app-readonly)",
    color: "var(--app-muted)",
    border: "1px solid var(--app-border)",
    fontSize: 12,
    fontWeight: 900,
    boxSizing: "border-box",
  },

  preferredDayCircleSelected: {
    background: BRAND.pink,
    color: "#FFFFFF",
    borderColor: BRAND.pink,
    boxShadow:
      "0 4px 10px rgba(217,67,104,0.18)",
  },

  selectedDaysText: {
    margin: "9px 0 0",
    color: "var(--app-muted)",
    fontSize: 11.5,
    fontWeight: 700,
  },

  mediaCard: {
    gridColumn: "span 2",
    border:
      "1px solid var(--app-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--app-card-soft)",
    boxSizing: "border-box",
  },

  mediaHeader: {
    display: "flex",
    alignItems:
      "flex-start",
    gap: 10,
    marginBottom: 12,
  },

  mediaPreviewButton: {
    width: "100%",
    border: "none",
    background:
      "transparent",
    padding: 0,
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  petPlaceImage: {
    width: "100%",
    maxHeight: 280,
    objectFit: "cover",
    borderRadius: 10,
    border:
      "1px solid var(--app-border-strong)",
    background: "var(--app-soft)",
  },

  filePreviewPlaceholder: {
    height: 120,
    borderRadius: 10,
    border:
      "1px dashed var(--app-border-strong)",
    background: "var(--app-soft)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: BRAND.pink,
  },

  mediaActionText: {
    marginTop: 8,
    color: BRAND.pink,
    fontSize: 12,
    fontWeight: 800,
    display:
      "inline-flex",
    alignItems: "center",
    gap: 5,
  },

  resumeCard: {
    border:
      "1px solid var(--app-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--app-card-soft)",
    display: "flex",
    gap: 10,
    alignItems:
      "flex-start",
    minHeight: 82,
    boxSizing: "border-box",
  },

  resumeCardContent: {
    minWidth: 0,
  },

  modalFileButton: {
    marginTop: 10,
    border: "none",
    background:
      "transparent",
    padding: 0,
    display:
      "inline-flex",
    alignItems: "center",
    gap: 6,
    color: BRAND.pink,
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  remarksBox: {
    marginTop: 14,
    border:
      "1px solid var(--app-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--app-card-soft)",
  },

  remarksInput: {
    width: "100%",
    background: "var(--app-input)",
    color: "var(--app-text)",
    minHeight: 100,
    resize: "vertical",
    border:
      "1px solid var(--app-border-strong)",
    borderRadius: 9,
    padding: 12,
    fontFamily: "inherit",
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
    transition:
      "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
  },

  readOnlyRemarks: {
    background: "var(--app-readonly)",
    color: "var(--app-muted)",
    cursor: "not-allowed",
  },

  modalActions: {
    minHeight: 72,
    padding: "14px 22px",
    borderTop:
      "1px solid var(--app-border)",
    background: "var(--app-card)",
    display: "flex",
    justifyContent:
      "flex-end",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flexShrink: 0,
    boxSizing: "border-box",
    boxShadow:
      "0 -8px 18px rgba(51, 26, 18, 0.06)",
    zIndex: 5,
  },

  reviewCompleteNotice: {
    flexShrink: 0,
    padding: "15px 22px",
    borderTop:
      "1px solid var(--app-border-strong)",
    background: "var(--app-readonly)",
    color: "var(--app-muted)",
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
  },

  rejectModalBtn: {
    height: 40,
    borderRadius: 9,
    border: "none",
    background: "#FCE2E8",
    color: "#E11D48",
    padding: "0 14px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },

  acceptModalBtn: {
    height: 40,
    borderRadius: 9,
    border: "none",
    background: BRAND.pink,
    color: "#fff",
    padding: "0 16px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },

  previewOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 300,
    padding: 22,
    background:
      "rgba(35,20,16,0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },

  previewModal: {
    width:
      "min(1000px, 100%)",
    height:
      "min(88vh, 820px)",
    background: "var(--app-card)",
    borderRadius: 16,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow:
      "0 26px 70px rgba(0,0,0,0.3)",
  },

  previewHeader: {
    minHeight: 68,
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: 14,
    borderBottom:
      "1px solid var(--app-border)",
    boxSizing: "border-box",
  },

  previewEyebrow: {
    margin: 0,
    color: BRAND.pink,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.8px",
  },

  previewTitle: {
    margin: "3px 0 0",
    color: "var(--app-strong)",
    fontSize: 17,
    fontWeight: 900,
  },

  previewClose: {
    width: 38,
    height: 38,
    borderRadius: 9,
    border:
      "1px solid var(--app-border-strong)",
    background: "var(--app-card)",
    color: "var(--app-strong)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition:
      "transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease, color 0.18s ease",
  },

  previewBody: {
    flex: 1,
    minHeight: 0,
    padding: 14,
    background: "var(--app-readonly)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },

  carouselCounter: {
    margin: "5px 0 0",
    color: "var(--app-muted)",
    fontSize: 11,
    fontWeight: 800,
  },

  carouselStage: {
    width: "100%",
    height: "100%",
    minHeight: 0,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  carouselArrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: "50%",
    border:
      "1px solid var(--app-border-strong)",
    background:
      "rgba(255,255,255,0.92)",
    color: BRAND.brown,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 6px 18px rgba(0,0,0,0.16)",
  },

  carouselArrowLeft: {
    left: 14,
  },

  carouselArrowRight: {
    right: 14,
  },

  carouselDots: {
    position: "absolute",
    left: "50%",
    bottom: 12,
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 10px",
    borderRadius: 999,
    background:
      "rgba(35,20,16,0.52)",
    zIndex: 2,
  },

  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    border: "none",
    padding: 0,
    background:
      "rgba(255,255,255,0.55)",
    cursor: "pointer",
  },

  carouselDotActive: {
    width: 10,
    height: 10,
    background: "#FFFFFF",
  },

  pdfFrame: {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: 8,
    background: "#FFFFFF",
  },

  fullPreviewImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    borderRadius: 8,
  },
};