import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Cat,
  CheckCircle2,
  Coins,
  Dog,
  Info,
  Pencil,
  RefreshCw,
  Save,
  Search,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { useConfirmation } from "./context/ConfirmationProvider";
import {
  adminScaledFontSize,
  useAdminSettings,
} from "./context/AdminSettingsContext";

const BRAND = {
  brown: "#3A1E14",
  pink: "#D94368",
  softPink: "#FDEBED",
  border: "#EEE2E0",
  text: "#2E1B16",
  muted: "#6F625F",
};

const SERVICE_TABLE = "SERVICE_CATALOG";
const PET_SITTER_TABLE = "PET SITTER";

const MAINTENANCE_CSS = `
  .maintenance-page * {
    box-sizing: border-box;
  }

  .maintenance-page button,
  .maintenance-page input,
  .maintenance-page select {
    font-family: inherit;
  }

  .maintenance-page button:not(:disabled) {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease,
      background-color 160ms ease,
      color 160ms ease,
      filter 160ms ease;
  }

  .maintenance-page button:not(:disabled):hover {
    transform: translateY(-1px);
  }

  .maintenance-page button:not(:disabled):active {
    transform: translateY(0) scale(0.98);
  }

  .maintenance-page button:focus-visible,
  .maintenance-page input:focus-visible,
  .maintenance-page select:focus-visible {
    outline: 2px solid rgba(217, 67, 104, 0.42);
    outline-offset: 2px;
  }

  .maintenance-page .maintenance-card {
    background: var(--maint-card);
    border: 1px solid var(--maint-border);
    border-radius: 16px;
    box-shadow: var(--maint-shadow);
  }

  .maintenance-page .maintenance-stat-card {
    width: 100%;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease;
  }

  .maintenance-page .maintenance-stat-card:hover {
    transform: translateY(-3px);
    border-color: rgba(217, 67, 104, 0.42);
    box-shadow: 0 12px 24px rgba(58, 30, 20, 0.10);
  }

  .maintenance-page .maintenance-stat-card.is-active {
    border-color: ${BRAND.pink};
    box-shadow:
      0 8px 18px rgba(217, 67, 104, 0.12),
      0 0 0 2px rgba(217, 67, 104, 0.08);
    transform: translateY(-1px);
  }

  .maintenance-page .maintenance-stat-card:disabled {
    cursor: default;
    opacity: 0.78;
  }

  .maintenance-page .maintenance-row td {
    transition: background-color 150ms ease, box-shadow 150ms ease;
  }

  .maintenance-page .maintenance-row:hover td {
    background: var(--maint-hover);
  }

  .maintenance-page .maintenance-row:hover td:first-child {
    box-shadow: inset 3px 0 0 ${BRAND.pink};
  }

  .maintenance-page .maintenance-search-shell:focus-within {
    border-color: ${BRAND.pink};
    box-shadow: 0 0 0 3px rgba(217, 67, 104, 0.10);
  }

  .maintenance-page .maintenance-price-input:focus,
  .maintenance-page .maintenance-select:focus {
    border-color: ${BRAND.pink};
    box-shadow: 0 0 0 3px rgba(217, 67, 104, 0.10);
    outline: none;
  }

  .maintenance-modal-backdrop {
    position: fixed;
    inset: 0;
    /* Keep this editor below the app-wide ConfirmationProvider. */
    z-index: 1200;
    background: rgba(31, 17, 13, 0.46);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 22px;
    backdrop-filter: blur(2px);
  }

  .maintenance-modal {
    width: min(560px, 100%);
    max-height: calc(100vh - 44px);
    overflow-y: auto;
    border-radius: 18px;
    background: var(--maint-card);
    color: var(--maint-text);
    border: 1px solid var(--maint-border);
    box-shadow: 0 24px 70px rgba(31, 17, 13, 0.24);
  }

  .maintenance-spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(217, 67, 104, 0.22);
    border-top-color: ${BRAND.pink};
    animation: maintenance-spin 0.75s linear infinite;
  }

  @keyframes maintenance-spin {
    to { transform: rotate(360deg); }
  }

  .maintenance-spinner-icon {
    animation: maintenance-spin 0.75s linear infinite;
  }

  @media (max-width: 1100px) {
    .maintenance-page .maintenance-stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .maintenance-page .maintenance-revenue-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 700px) {
    .maintenance-page .maintenance-header {
      flex-direction: column;
      gap: 14px;
    }

    .maintenance-page .maintenance-stats-grid {
      grid-template-columns: 1fr !important;
    }

    .maintenance-page .maintenance-toolbar {
      flex-direction: column;
      align-items: stretch !important;
    }

    .maintenance-page .maintenance-search-shell {
      width: 100% !important;
    }
  }
`;

export default function MaintenancePage() {
  const requestConfirmation = useConfirmation();
  const { settings } = useAdminSettings();
  const darkMode = Boolean(settings?.darkMode);

  const themeStyle = useMemo(
    () => ({
      "--maint-page": darkMode ? "#171311" : "#FFF9F8",
      "--maint-card": darkMode ? "#241D1A" : "#FFFFFF",
      "--maint-card-soft": darkMode ? "#2B2320" : "#FFFCFB",
      "--maint-head": darkMode ? "#2B2320" : "#FFFBFA",
      "--maint-input": darkMode ? "#2B2320" : "#FFFFFF",
      "--maint-text": darkMode ? "#FFF7F4" : "#1F1714",
      "--maint-strong": darkMode ? "#FFF7F4" : BRAND.brown,
      "--maint-muted": darkMode ? "#CFC2BE" : "#6D5F5B",
      "--maint-border": darkMode ? "#443934" : "#EEE2DF",
      "--maint-border-strong": darkMode ? "#5A4B45" : "#E2D5D3",
      "--maint-hover": darkMode ? "#34282C" : "#FFF7F9",
      "--maint-success-bg": darkMode ? "#173326" : "#EDF9F1",
      "--maint-success-border": darkMode ? "#285B40" : "#CDEBD6",
      "--maint-success-text": darkMode ? "#A8E8BD" : "#187A3D",
      "--maint-error-bg": darkMode ? "#3A2024" : "#FFF0F2",
      "--maint-error-border": darkMode ? "#6A343B" : "#F3C5CC",
      "--maint-error-text": darkMode ? "#FFB8C2" : "#B42336",
      "--maint-warning-bg": darkMode ? "#352D1A" : "#FFF8E7",
      "--maint-warning-border": darkMode ? "#66572C" : "#F0DCA3",
      "--maint-warning-text": darkMode ? "#F3D987" : "#7A5A00",
      "--maint-shadow": darkMode
        ? "0 8px 18px rgba(0,0,0,0.24)"
        : "0 8px 18px rgba(51,26,18,0.07)",
      width: "100%",
      color: "var(--maint-text)",
    }),
    [darkMode]
  );

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [cardFilter, setCardFilter] = useState("All");

  const [selectedService, setSelectedService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    service_name: "",
    description: "",
    base_price: "",
    medium_price: "",
    large_price: "",
  });
  const [savingService, setSavingService] = useState(false);
  const [serviceModalError, setServiceModalError] = useState("");
  const [serviceConfirmationOpen, setServiceConfirmationOpen] = useState(false);

  const [sitters, setSitters] = useState([]);
  const [sitterRevenueLoading, setSitterRevenueLoading] = useState(true);
  const [sitterRevenueError, setSitterRevenueError] = useState("");
  const [sitterSearch, setSitterSearch] = useState("");
  const [selectedRevenueSitter, setSelectedRevenueSitter] = useState(null);
  const [sitterRevenueForm, setSitterRevenueForm] = useState({
    pet_sitter_percentage: "60",
    business_owner_percentage: "40",
  });
  const [savingSitterRevenue, setSavingSitterRevenue] = useState(false);
  const [sitterRevenueModalError, setSitterRevenueModalError] = useState("");
  const [sitterRevenueConfirmationOpen, setSitterRevenueConfirmationOpen] = useState(false);

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  useEffect(() => {
    const serviceChannel = supabase
      .channel("admin-maintenance-service-catalog")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: SERVICE_TABLE },
        () => fetchServices(false)
      )
      .subscribe();

    const sitterChannel = supabase
      .channel("admin-maintenance-pet-sitter-revenue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: PET_SITTER_TABLE },
        () => fetchSitterRevenueShares(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(serviceChannel);
      supabase.removeChannel(sitterChannel);
    };
  }, []);

  async function fetchMaintenanceData() {
    setLoading(true);
    setSitterRevenueLoading(true);
    setServiceError("");
    setSitterRevenueError("");

    await Promise.all([
      fetchServices(false),
      fetchSitterRevenueShares(false),
    ]);

    setLoading(false);
    setSitterRevenueLoading(false);
  }

  async function fetchServices(showBusyState = true) {
    if (showBusyState) {
      setRefreshing(true);
    }

    setServiceError("");

    try {
      const { data, error } = await supabase
        .from(SERVICE_TABLE)
        .select(
          "service_id, service_name, pet_type, description, base_price, medium_price, large_price, weight_based, note, created_at, updated_at"
        )
        .order("service_id", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Unable to load service catalog:", error);
      setServiceError(
        "The service catalog could not be loaded. Please refresh the page and try again."
      );
    } finally {
      if (showBusyState) {
        setRefreshing(false);
      }
    }
  }

  async function fetchSitterRevenueShares(showBusyState = true) {
    if (showBusyState) {
      setSitterRevenueLoading(true);
    }

    setSitterRevenueError("");

    try {
      const { data, error } = await supabase
        .from(PET_SITTER_TABLE)
        .select(
          "petsitter_id, ps_fname, ps_lname, ps_email, ps_photo_url, pet_sitter_percentage, business_owner_percentage"
        )
        .order("petsitter_id", { ascending: true });

      if (error) throw error;
      setSitters(data || []);
    } catch (error) {
      console.error("Unable to load Pet Sitter revenue sharing:", error);

      const errorText = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
      const missingColumns =
        errorText.includes("pet_sitter_percentage") ||
        errorText.includes("business_owner_percentage");

      setSitterRevenueError(
        missingColumns
          ? "Per-sitter revenue sharing is not configured yet. Run the provided database setup SQL, then refresh this page."
          : "Pet Sitter revenue-sharing settings could not be loaded. Please refresh the page and try again."
      );
    } finally {
      if (showBusyState) {
        setSitterRevenueLoading(false);
      }
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setSitterRevenueLoading(true);
    setSuccess("");

    await Promise.all([
      fetchServices(false),
      fetchSitterRevenueShares(false),
    ]);

    setRefreshing(false);
    setSitterRevenueLoading(false);
  }

  function openServiceEditor(service) {
    setSelectedService(service);
    setServiceModalError("");
    setServiceForm({
      service_name: String(service.service_name || ""),
      description: String(service.description || ""),
      base_price: formatEditableNumber(service.base_price),
      medium_price: formatEditableNumber(service.medium_price),
      large_price: formatEditableNumber(service.large_price),
    });
  }

  function closeServiceEditor() {
    if (savingService) return;
    setSelectedService(null);
    setServiceModalError("");
  }

  function showSuccessNearCards(message) {
    setSuccess(message);

    if (typeof document !== "undefined") {
      window.requestAnimationFrame(() => {
        document.querySelector(".maintenance-page")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }

  function updateServiceForm(field, value) {
    const priceFields = new Set(["base_price", "medium_price", "large_price"]);

    if (priceFields.has(field) && !isValidCurrencyTyping(value)) return;

    setServiceForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setServiceModalError("");
  }

  async function saveServicePrice(event) {
    event.preventDefault();
    if (!selectedService) return;

    setServiceModalError("");
    setSuccess("");

    const serviceName = String(serviceForm.service_name || "")
      .trim()
      .replace(/\s+/g, " ");

    const description = String(serviceForm.description || "").trim();

    const basePrice = parseRequiredMoney(serviceForm.base_price);
    const usesTierPrices = serviceUsesTierPrices(selectedService);
    const mediumPrice = usesTierPrices
      ? parseOptionalMoney(serviceForm.medium_price)
      : selectedService.medium_price;
    const largePrice = usesTierPrices
      ? parseOptionalMoney(serviceForm.large_price)
      : selectedService.large_price;

    if (!serviceName) {
      setServiceModalError("Service name is required.");
      return;
    }

    if (basePrice === null) {
      setServiceModalError("Enter a valid base price of ₱0.00 or more.");
      return;
    }

    if (
      usesTierPrices &&
      ((serviceForm.medium_price.trim() !== "" && mediumPrice === null) ||
        (serviceForm.large_price.trim() !== "" && largePrice === null))
    ) {
      setServiceModalError(
        "Enter valid Medium and Large prices, or leave an optional field blank."
      );
      return;
    }

    const currentServiceName = String(selectedService.service_name || "")
      .trim()
      .replace(/\s+/g, " ");

    const currentDescription = String(selectedService.description || "").trim();

    const nameChanged = serviceName !== currentServiceName;
    const descriptionChanged = description !== currentDescription;
    const baseChanged = !moneyValuesEqual(selectedService.base_price, basePrice);
    const mediumChanged =
      usesTierPrices &&
      !moneyValuesEqual(selectedService.medium_price, mediumPrice);
    const largeChanged =
      usesTierPrices &&
      !moneyValuesEqual(selectedService.large_price, largePrice);

    const priceChanged = baseChanged || mediumChanged || largeChanged;

    if (
      !nameChanged &&
      !descriptionChanged &&
      !baseChanged &&
      !mediumChanged &&
      !largeChanged
    ) {
      setSelectedService(null);
      showSuccessNearCards("No service changes were detected.");
      return;
    }

    if (nameChanged) {
      const { data: duplicateService, error: duplicateError } = await supabase
        .from(SERVICE_TABLE)
        .select("service_id")
        .ilike("service_name", serviceName)
        .neq("service_id", selectedService.service_id)
        .limit(1)
        .maybeSingle();

      if (duplicateError) {
        console.error("Unable to validate service name:", duplicateError);
        setServiceModalError(
          "The service name could not be validated. Please try again."
        );
        return;
      }

      if (duplicateService) {
        setServiceModalError(
          "A service with this name already exists. Enter a different service name."
        );
        return;
      }
    }

    const changes = [];

    if (nameChanged) {
      changes.push(`Service Name: ${currentServiceName || "Unnamed Service"} → ${serviceName}`);
    }

    if (descriptionChanged) {
      changes.push("Description: updated");
    }

    if (baseChanged) {
      changes.push(
        `Base Price: ${formatPeso(selectedService.base_price)} → ${formatPeso(basePrice)}`
      );
    }

    if (mediumChanged) {
      changes.push(
        `Medium Price: ${formatPeso(selectedService.medium_price)} → ${formatPeso(
          mediumPrice
        )}`
      );
    }

    if (largeChanged) {
      changes.push(
        `Large Price: ${formatPeso(selectedService.large_price)} → ${formatPeso(
          largePrice
        )}`
      );
    }

    // Temporarily hide the service editor while the shared confirmation dialog is open.
    // This guarantees the confirmation dialog remains above the editor while preserving
    // all entered values if the Admin cancels.
    setServiceConfirmationOpen(true);

    const confirmed = await requestConfirmation({
      title: "Confirm service update",
      message: `Please review the following changes for ${
        currentServiceName || "this service"
      }: ${changes.join(" • ")}`,
      confirmText: "Save Changes",
      cancelText: "Cancel",
      variant: "primary",
    });

    if (!confirmed) {
      setServiceConfirmationOpen(false);
      return;
    }

    setSavingService(true);

    let renamedBookingIds = [];

    try {
      /*
        SERVICE_CATALOG currently uses the service name while BOOKING stores
        that service in BOOKING.service_type. When a service is renamed,
        synchronize only bookings that may still proceed to payment.

        Completed + Paid and Cancelled bookings are intentionally left unchanged
        so historical booking and earnings records keep their original service name.
      */
      if (nameChanged && currentServiceName) {
        const { data: linkedBookings, error: bookingLookupError } = await supabase
          .from("BOOKING")
          .select("booking_id, booking_status, payment_status")
          .eq("service_type", currentServiceName);

        if (bookingLookupError) throw bookingLookupError;

        renamedBookingIds = (linkedBookings || [])
          .filter((booking) => {
            const status = String(booking.booking_status || "")
              .trim()
              .toLowerCase();

            const paymentStatus = String(booking.payment_status || "")
              .trim()
              .toLowerCase();

            const isHistoricalPaid =
              status === "completed" && paymentStatus === "paid";

            const isCancelled = status === "cancelled";

            return !isHistoricalPaid && !isCancelled;
          })
          .map((booking) => booking.booking_id);

        if (renamedBookingIds.length > 0) {
          const { error: bookingRenameError } = await supabase
            .from("BOOKING")
            .update({ service_type: serviceName })
            .in("booking_id", renamedBookingIds);

          if (bookingRenameError) throw bookingRenameError;
        }
      }

      const updatePayload = {};

      if (nameChanged) {
        updatePayload.service_name = serviceName;
      }

      if (descriptionChanged) {
        updatePayload.description = description || null;
      }

      if (baseChanged) {
        updatePayload.base_price = basePrice;
      }

      if (usesTierPrices && mediumChanged) {
        updatePayload.medium_price = mediumPrice;
      }

      if (usesTierPrices && largeChanged) {
        updatePayload.large_price = largePrice;
      }

      // "Price Updated" must change only when an actual price changes.
      // Editing the service name or description alone does not touch updated_at.
      if (priceChanged) {
        updatePayload.updated_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from(SERVICE_TABLE)
        .update(updatePayload)
        .eq("service_id", selectedService.service_id)
        .select(
          "service_id, service_name, pet_type, description, base_price, medium_price, large_price, weight_based, note, created_at, updated_at"
        )
        .single();

      if (error) {
        // Best-effort rollback if linked active bookings were renamed first.
        if (nameChanged && renamedBookingIds.length > 0) {
          const { error: rollbackError } = await supabase
            .from("BOOKING")
            .update({ service_type: currentServiceName })
            .in("booking_id", renamedBookingIds);

          if (rollbackError) {
            console.error(
              "Unable to restore linked booking service names after a failed service update:",
              rollbackError
            );
          }
        }

        throw error;
      }

      setServices((previous) =>
        previous.map((service) =>
          service.service_id === data.service_id ? data : service
        )
      );

      setSelectedService(null);

      if (priceChanged && (nameChanged || descriptionChanged)) {
        showSuccessNearCards(
          "Service information and pricing updated successfully."
        );
      } else if (priceChanged) {
        showSuccessNearCards("Service pricing updated successfully.");
      } else {
        showSuccessNearCards("Service information updated successfully.");
      }
    } catch (error) {
      console.error("Unable to update service:", error);

      setServiceConfirmationOpen(false);

      const errorText = String(error?.message || "").toLowerCase();

      setServiceModalError(
        errorText.includes("booking") ||
          errorText.includes("service_type") ||
          errorText.includes("row-level security")
          ? "The service name could not be updated because linked active bookings could not be synchronized. Please try again."
          : "The service changes could not be saved. Please try again."
      );
    } finally {
      setSavingService(false);
      setServiceConfirmationOpen(false);
    }
  }

  function getSitterDisplayName(sitter) {
    const fullName = [sitter?.ps_fname, sitter?.ps_lname]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" ");

    return fullName || `Pet Sitter ${sitter?.petsitter_id || ""}`.trim();
  }

  function openSitterRevenueEditor(sitter) {
    setSelectedRevenueSitter(sitter);
    setSitterRevenueModalError("");
    setSitterRevenueForm({
      pet_sitter_percentage: formatEditableNumber(
        Number.isFinite(Number(sitter?.pet_sitter_percentage))
          ? Number(sitter.pet_sitter_percentage)
          : 60
      ),
      business_owner_percentage: formatEditableNumber(
        Number.isFinite(Number(sitter?.business_owner_percentage))
          ? Number(sitter.business_owner_percentage)
          : 40
      ),
    });
  }

  function closeSitterRevenueEditor() {
    if (savingSitterRevenue) return;
    setSelectedRevenueSitter(null);
    setSitterRevenueModalError("");
  }

  function updateSitterRevenueField(field, value) {
    if (!isValidPercentageTyping(value)) return;

    setSitterRevenueForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setSitterRevenueModalError("");
  }

  async function saveSitterRevenueShare(event) {
    event.preventDefault();
    if (!selectedRevenueSitter) return;

    setSitterRevenueModalError("");
    setSuccess("");

    const sitterPercentage = Number(sitterRevenueForm.pet_sitter_percentage);
    const ownerPercentage = Number(sitterRevenueForm.business_owner_percentage);

    if (
      !Number.isFinite(sitterPercentage) ||
      !Number.isFinite(ownerPercentage) ||
      sitterPercentage < 0 ||
      sitterPercentage > 100 ||
      ownerPercentage < 0 ||
      ownerPercentage > 100
    ) {
      setSitterRevenueModalError(
        "Enter a percentage from 0% to 100% for each revenue share."
      );
      return;
    }

    if (!percentagesEqual100(sitterPercentage, ownerPercentage)) {
      setSitterRevenueModalError(
        "The Pet Sitter and Business Owner revenue shares must total exactly 100%."
      );
      return;
    }

    const normalizedSitterPercentage = roundTwoDecimals(sitterPercentage);
    const normalizedOwnerPercentage = roundTwoDecimals(ownerPercentage);
    const currentSitterPercentage = Number(selectedRevenueSitter.pet_sitter_percentage);
    const currentOwnerPercentage = Number(selectedRevenueSitter.business_owner_percentage);

    const alreadyMatches =
      Number.isFinite(currentSitterPercentage) &&
      Number.isFinite(currentOwnerPercentage) &&
      Math.abs(currentSitterPercentage - normalizedSitterPercentage) < 0.005 &&
      Math.abs(currentOwnerPercentage - normalizedOwnerPercentage) < 0.005;

    if (alreadyMatches) {
      setSelectedRevenueSitter(null);
      showSuccessNearCards(
        `${getSitterDisplayName(selectedRevenueSitter)} already has this revenue-sharing allocation.`
      );
      return;
    }

    const sitterName = getSitterDisplayName(selectedRevenueSitter);
    const currentSplitText =
      Number.isFinite(currentSitterPercentage) &&
      Number.isFinite(currentOwnerPercentage)
        ? `Current: ${formatPercentage(currentSitterPercentage)} Pet Sitter / ${formatPercentage(currentOwnerPercentage)} Business Owner. `
        : "";

    setSitterRevenueConfirmationOpen(true);

    const confirmed = await requestConfirmation({
      title: "Confirm Pet Sitter revenue share",
      message: `${currentSplitText}New for ${sitterName}: ${formatPercentage(
        normalizedSitterPercentage
      )} Pet Sitter / ${formatPercentage(
        normalizedOwnerPercentage
      )} Business Owner. This change applies to bookings for this Pet Sitter that are finalized as Completed and Paid after the update. Existing earnings records remain unchanged.`,
      confirmText: "Save Revenue Share",
      cancelText: "Cancel",
      variant: "primary",
    });

    if (!confirmed) {
      setSitterRevenueConfirmationOpen(false);
      return;
    }

    setSavingSitterRevenue(true);

    try {
      const { data, error } = await supabase
        .from(PET_SITTER_TABLE)
        .update({
          pet_sitter_percentage: normalizedSitterPercentage,
          business_owner_percentage: normalizedOwnerPercentage,
        })
        .eq("petsitter_id", selectedRevenueSitter.petsitter_id)
        .select(
          "petsitter_id, ps_fname, ps_lname, ps_email, ps_photo_url, pet_sitter_percentage, business_owner_percentage"
        )
        .single();

      if (error) throw error;

      setSitters((previous) =>
        previous.map((sitter) =>
          sitter.petsitter_id === data.petsitter_id
            ? { ...sitter, ...data }
            : sitter
        )
      );

      setSelectedRevenueSitter(null);
      setSitterRevenueError("");
      showSuccessNearCards(
        `${getSitterDisplayName(data)}'s revenue-sharing allocation was updated successfully.`
      );
    } catch (error) {
      console.error("Unable to update Pet Sitter revenue sharing:", error);
      setSitterRevenueConfirmationOpen(false);
      setSitterRevenueModalError(getSitterRevenueSaveMessage(error));
    } finally {
      setSavingSitterRevenue(false);
      setSitterRevenueConfirmationOpen(false);
    }
  }

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      const servicePetType = String(service.pet_type || "").toLowerCase();

      const matchesCard =
        cardFilter === "All" ||
        (cardFilter === "Dog" && servicePetType === "dog") ||
        (cardFilter === "Cat" && servicePetType === "cat");

      if (!matchesCard) return false;
      if (!query) return true;

      return [
        service.service_id,
        service.service_name,
        service.pet_type,
        service.description,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [services, search, cardFilter]);

  function handleCardFilter(nextFilter) {
    setCardFilter(nextFilter);
  }

  const stats = useMemo(() => {
    const dogServices = services.filter(
      (service) => String(service.pet_type || "").toLowerCase() === "dog"
    ).length;
    const catServices = services.filter(
      (service) => String(service.pet_type || "").toLowerCase() === "cat"
    ).length;
    return {
      total: services.length,
      dogServices,
      catServices,
    };
  }, [services]);

  const filteredRevenueSitters = useMemo(() => {
    const query = sitterSearch.trim().toLowerCase();

    if (!query) return sitters;

    return sitters.filter((sitter) =>
      [
        sitter.petsitter_id,
        sitter.ps_fname,
        sitter.ps_lname,
        sitter.ps_email,
        getSitterDisplayName(sitter),
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [sitters, sitterSearch]);

  const selectedSitterShare = Number(
    sitterRevenueForm.pet_sitter_percentage || 0
  );
  const selectedOwnerShare = Number(
    sitterRevenueForm.business_owner_percentage || 0
  );
  const selectedShareTotal =
    (Number.isFinite(selectedSitterShare) ? selectedSitterShare : 0) +
    (Number.isFinite(selectedOwnerShare) ? selectedOwnerShare : 0);
  const validSelectedShareTotal = percentagesEqual100(
    selectedSitterShare,
    selectedOwnerShare
  );

  return (
    <div className="maintenance-page" style={themeStyle}>
      <style>{MAINTENANCE_CSS}</style>

      <header
        className="maintenance-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "var(--maint-strong)",
              fontSize: adminScaledFontSize(34),
              fontWeight: 900,
              letterSpacing: "-1px",
            }}
          >
            Maintenance
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: "var(--maint-muted)",
              fontSize: adminScaledFontSize(15),
              lineHeight: 1.5,
            }}
          >
            Manage service information, pricing, and individual Pet Sitter revenue-sharing allocations used across Nanny Paws Care.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "var(--maint-strong)",
            fontSize: adminScaledFontSize(14),
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <span>Dashboard</span>
          <span style={{ color: "#9A8C89", fontSize: adminScaledFontSize(22) }}>›</span>
          <span>Maintenance</span>
        </div>
      </header>

      {success ? (
        <StatusAlert
          type="success"
          message={success}
          onClose={() => setSuccess("")}
        />
      ) : null}

      {serviceError ? (
        <StatusAlert type="error" message={serviceError} onClose={() => setServiceError("")} />
      ) : null}

      <div
        className="maintenance-stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<Coins size={28} />}
          label="Total Services"
          value={loading ? "—" : stats.total}
          desc="All configured services"
          iconBackground="#F9DCE5"
          iconColor="#D94D72"
          active={cardFilter === "All"}
          disabled={loading}
          onClick={() => handleCardFilter("All")}
        />
        <StatCard
          icon={<Dog size={29} />}
          label="Dog Services"
          value={loading ? "—" : stats.dogServices}
          desc="Services available for dogs"
          iconBackground="#E4EFFB"
          iconColor="#2E6EAE"
          active={cardFilter === "Dog"}
          disabled={loading}
          onClick={() => handleCardFilter("Dog")}
        />
        <StatCard
          icon={<Cat size={29} />}
          label="Cat Services"
          value={loading ? "—" : stats.catServices}
          desc="Services available for cats"
          iconBackground="#EFE5F8"
          iconColor="#7A4BA3"
          active={cardFilter === "Cat"}
          disabled={loading}
          onClick={() => handleCardFilter("Cat")}
        />
      </div>

      <section className="maintenance-card" style={{ marginBottom: 24, padding: "22px 14px 16px" }}>
        <div
          style={{
            padding: "0 12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "var(--maint-strong)",
                fontSize: adminScaledFontSize(21),
                fontWeight: 900,
              }}
            >
              Service Catalog
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                color: "var(--maint-muted)",
                fontSize: adminScaledFontSize(13),
                lineHeight: 1.5,
              }}
            >
              Manage service names, descriptions, and pricing used across Nanny Paws Care.
            </p>
          </div>

          <div
            className="maintenance-toolbar"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <div
              className="maintenance-search-shell"
              style={{
                width: 360,
                height: 48,
                border: "1px solid var(--maint-border-strong)",
                borderRadius: 7,
                background: "var(--maint-input)",
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 12px",
              }}
            >
              <Search size={22} color="var(--maint-muted)" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by service name, description, or ID"
                style={{
                  width: "100%",
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  color: "var(--maint-text)",
                  fontSize: adminScaledFontSize(14),
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh service and revenue-sharing data"
              style={{
                ...secondaryButtonStyle(),
                height: 48,
                minHeight: 48,
                borderRadius: 7,
                padding: "0 14px",
                fontSize: adminScaledFontSize(14),
              }}
            >
              <RefreshCw size={19} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 1080,
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--maint-head)",
                  borderTop: "1px solid var(--maint-border)",
                  borderBottom: "1px solid var(--maint-border)",
                }}
              >
                <TableHeading width="70px">ID</TableHeading>
                <TableHeading width="230px">Service</TableHeading>
                <TableHeading width="110px">Pet Type</TableHeading>
                <TableHeading width="135px">Base Price</TableHeading>
                <TableHeading width="135px">Medium Price</TableHeading>
                <TableHeading width="135px">Large Price</TableHeading>
                <TableHeading width="150px">Pricing Method</TableHeading>
                <TableHeading width="170px">Price Updated</TableHeading>
                <TableHeading width="100px" align="center">Action</TableHeading>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={emptyCellStyle()}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <span className="maintenance-spinner" />
                      Loading service pricing records...
                    </span>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={9} style={emptyCellStyle()}>
                    No services match the current search or filter.
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr
                    key={service.service_id}
                    className="maintenance-row"
                    style={{ borderBottom: "1px solid var(--maint-border)" }}
                  >
                    <TableCell align="center" muted strong>
                      {service.service_id}
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          display: "block",
                          color: "var(--maint-text)",
                          fontWeight: 900,
                          fontSize: adminScaledFontSize(13),
                        }}
                      >
                        {service.service_name || "Unnamed Service"}
                      </span>
                      <span
                        style={{
                          display: "block",
                          marginTop: 4,
                          color: "var(--maint-muted)",
                          fontSize: adminScaledFontSize(11),
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={service.description || ""}
                      >
                        {service.description || "No description"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PetTypeBadge petType={service.pet_type} />
                    </TableCell>
                    <TableCell strong>{formatPeso(service.base_price)}</TableCell>
                    <TableCell>
                      {service.medium_price === null || service.medium_price === undefined
                        ? "—"
                        : formatPeso(service.medium_price)}
                    </TableCell>
                    <TableCell>
                      {service.large_price === null || service.large_price === undefined
                        ? "—"
                        : formatPeso(service.large_price)}
                    </TableCell>
                    <TableCell>
                      {service.weight_based ? (
                        <span style={pricingBadgeStyle("weight")}>Weight-based</span>
                      ) : (
                        <span style={pricingBadgeStyle("fixed")}>Fixed price</span>
                      )}
                    </TableCell>
                    <TableCell muted>
                      {formatDateTime(service.updated_at || service.created_at)}
                    </TableCell>
                    <TableCell align="center">
                      <button
                        type="button"
                        onClick={() => openServiceEditor(service)}
                        style={iconActionButtonStyle()}
                        title={`Edit ${service.service_name || "service"}`}
                        aria-label={`Edit ${service.service_name || "service"}`}
                      >
                        <Pencil size={16} />
                      </button>
                    </TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading ? (
          <div
            style={{
              padding: "14px 12px 0",
              color: "var(--maint-muted)",
              fontSize: adminScaledFontSize(12),
              fontWeight: 700,
            }}
          >
            Showing {filteredServices.length} of {services.length} service
            {services.length === 1 ? "" : "s"}.
          </div>
        ) : null}
      </section>

      <section className="maintenance-card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--maint-border)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "var(--maint-strong)",
                fontSize: adminScaledFontSize(21),
                fontWeight: 900,
              }}
            >
              Pet Sitter Revenue Sharing
            </h2>
            <p
              style={{
                margin: "7px 0 0",
                color: "var(--maint-muted)",
                fontSize: adminScaledFontSize(13),
                lineHeight: 1.55,
                maxWidth: 760,
              }}
            >
              Set an individual revenue allocation for each Pet Sitter. Updating one Pet Sitter does not change the percentage assigned to other Pet Sitters.
            </p>
          </div>

          <div
            className="maintenance-search-shell"
            style={{
              width: 360,
              height: 48,
              border: "1px solid var(--maint-border-strong)",
              borderRadius: 7,
              background: "var(--maint-input)",
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "0 12px",
            }}
          >
            <Search size={22} color="var(--maint-muted)" />
            <input
              value={sitterSearch}
              onChange={(event) => setSitterSearch(event.target.value)}
              placeholder="Search Pet Sitter by name, email, or ID"
              style={{
                width: "100%",
                border: 0,
                outline: 0,
                background: "transparent",
                color: "var(--maint-text)",
                fontSize: adminScaledFontSize(14),
              }}
            />
          </div>
        </div>

        {sitterRevenueError ? (
          <div style={{ padding: "16px 20px 0" }}>
            <StatusAlert
              type="error"
              message={sitterRevenueError}
              onClose={() => setSitterRevenueError("")}
              compact
            />
          </div>
        ) : null}

        <div style={{ width: "100%", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 900,
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--maint-head)",
                  borderTop: "1px solid var(--maint-border)",
                  borderBottom: "1px solid var(--maint-border)",
                }}
              >
                <TableHeading width="90px">Sitter ID</TableHeading>
                <TableHeading width="250px">Pet Sitter</TableHeading>
                <TableHeading width="260px">Email</TableHeading>
                <TableHeading width="150px">Pet Sitter Share</TableHeading>
                <TableHeading width="170px">Business Owner Share</TableHeading>
                <TableHeading width="100px" align="center">Action</TableHeading>
              </tr>
            </thead>
            <tbody>
              {sitterRevenueLoading ? (
                <tr>
                  <td colSpan={6} style={emptyCellStyle()}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <span className="maintenance-spinner" />
                      Loading Pet Sitter revenue-sharing settings...
                    </span>
                  </td>
                </tr>
              ) : filteredRevenueSitters.length === 0 ? (
                <tr>
                  <td colSpan={6} style={emptyCellStyle()}>
                    No Pet Sitters match the current search.
                  </td>
                </tr>
              ) : (
                filteredRevenueSitters.map((sitter) => (
                  <tr
                    key={sitter.petsitter_id}
                    className="maintenance-row"
                    style={{ borderBottom: "1px solid var(--maint-border)" }}
                  >
                    <TableCell align="center" muted strong>
                      {sitter.petsitter_id}
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          display: "block",
                          color: "var(--maint-text)",
                          fontWeight: 900,
                          fontSize: adminScaledFontSize(13),
                        }}
                      >
                        {getSitterDisplayName(sitter)}
                      </span>
                    </TableCell>
                    <TableCell muted>
                      {sitter.ps_email || "No email available"}
                    </TableCell>
                    <TableCell strong>
                      {formatPercentage(sitter.pet_sitter_percentage)}
                    </TableCell>
                    <TableCell strong>
                      {formatPercentage(sitter.business_owner_percentage)}
                    </TableCell>
                    <TableCell align="center">
                      <button
                        type="button"
                        onClick={() => openSitterRevenueEditor(sitter)}
                        style={iconActionButtonStyle()}
                        title={`Edit ${getSitterDisplayName(sitter)} revenue share`}
                        aria-label={`Edit ${getSitterDisplayName(sitter)} revenue share`}
                      >
                        <Pencil size={16} />
                      </button>
                    </TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!sitterRevenueLoading ? (
          <div
            style={{
              padding: "14px 20px",
              color: "var(--maint-muted)",
              fontSize: adminScaledFontSize(12),
              fontWeight: 700,
            }}
          >
            Showing {filteredRevenueSitters.length} of {sitters.length} Pet Sitter
            {sitters.length === 1 ? "" : "s"}.
          </div>
        ) : null}

        <div
          style={{
            margin: "0 20px 20px",
            padding: "12px 14px",
            border: "1px solid var(--maint-border)",
            borderRadius: 10,
            background: "var(--maint-card-soft)",
            color: "var(--maint-muted)",
            fontSize: adminScaledFontSize(12.5),
            lineHeight: 1.55,
            display: "flex",
            alignItems: "flex-start",
            gap: 9,
          }}
        >
          <Info size={17} color={BRAND.pink} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>
            Revenue-sharing changes apply to bookings assigned to the selected Pet Sitter that are finalized as Completed and Paid after the update. Historical Business Earnings records keep the percentages captured when each transaction was finalized.
          </span>
        </div>
      </section>

      {selectedRevenueSitter && !sitterRevenueConfirmationOpen ? (
        <div
          className="maintenance-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSitterRevenueEditor();
          }}
        >
          <div
            className="maintenance-modal"
            style={{ ...themeStyle, width: "min(560px, 100%)", minHeight: "auto" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-sitter-revenue-modal-title"
          >
            <form onSubmit={saveSitterRevenueShare}>
              <div
                style={{
                  padding: "20px 20px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 14,
                  borderBottom: "1px solid var(--maint-border)",
                }}
              >
                <div>
                  <h3
                    id="maintenance-sitter-revenue-modal-title"
                    style={{
                      margin: 0,
                      color: "var(--maint-strong)",
                      fontSize: adminScaledFontSize(20),
                      fontWeight: 900,
                    }}
                  >
                    Edit Revenue Share
                  </h3>
                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "var(--maint-muted)",
                      fontSize: adminScaledFontSize(12.5),
                    }}
                  >
                    Set the revenue allocation for this Pet Sitter only.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSitterRevenueEditor}
                  disabled={savingSitterRevenue}
                  style={closeButtonStyle()}
                  aria-label="Close revenue-share editor"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: 20 }}>
                {sitterRevenueModalError ? (
                  <StatusAlert
                    type="error"
                    message={sitterRevenueModalError}
                    onClose={() => setSitterRevenueModalError("")}
                    compact
                  />
                ) : null}

                <div
                  style={{
                    padding: "13px 14px",
                    border: "1px solid var(--maint-border)",
                    borderRadius: 10,
                    background: "var(--maint-card-soft)",
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      color: "var(--maint-strong)",
                      fontSize: adminScaledFontSize(14),
                      fontWeight: 900,
                    }}
                  >
                    {getSitterDisplayName(selectedRevenueSitter)}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      color: "var(--maint-muted)",
                      fontSize: adminScaledFontSize(12),
                    }}
                  >
                    Sitter ID: {selectedRevenueSitter.petsitter_id}
                    {selectedRevenueSitter.ps_email
                      ? ` • ${selectedRevenueSitter.ps_email}`
                      : ""}
                  </div>
                </div>

                <div
                  className="maintenance-revenue-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                  }}
                >
                  <PercentageField
                    label="Pet Sitter Revenue Share"
                    value={sitterRevenueForm.pet_sitter_percentage}
                    onChange={(value) =>
                      updateSitterRevenueField("pet_sitter_percentage", value)
                    }
                  />
                  <PercentageField
                    label="Business Owner Revenue Share"
                    value={sitterRevenueForm.business_owner_percentage}
                    onChange={(value) =>
                      updateSitterRevenueField("business_owner_percentage", value)
                    }
                  />
                </div>

                <div
                  style={{
                    marginTop: 18,
                    height: 44,
                    borderRadius: 9,
                    border: `1px solid ${
                      validSelectedShareTotal ? "#B8DEC5" : "#F0C0C7"
                    }`,
                    background: validSelectedShareTotal
                      ? "var(--maint-success-bg)"
                      : "var(--maint-error-bg)",
                    color: validSelectedShareTotal
                      ? "var(--maint-success-text)"
                      : "var(--maint-error-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: adminScaledFontSize(14),
                    fontWeight: 900,
                  }}
                >
                  {validSelectedShareTotal ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <AlertCircle size={17} />
                  )}
                  Total Revenue Allocation: {formatPercentage(selectedShareTotal)}
                </div>
              </div>

              <div
                style={{
                  padding: "15px 20px 20px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  borderTop: "1px solid var(--maint-border)",
                }}
              >
                <button
                  type="button"
                  onClick={closeSitterRevenueEditor}
                  disabled={savingSitterRevenue}
                  style={secondaryButtonStyle()}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSitterRevenue || !validSelectedShareTotal}
                  style={primaryButtonStyle(
                    savingSitterRevenue || !validSelectedShareTotal
                  )}
                >
                  {savingSitterRevenue ? (
                    <span className="maintenance-spinner" />
                  ) : (
                    <Save size={17} />
                  )}
                  {savingSitterRevenue ? "Saving..." : "Save Revenue Share"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {selectedService && !serviceConfirmationOpen ? (
        <div
          className="maintenance-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeServiceEditor();
          }}
        >
          <div
            className="maintenance-modal"
            style={{ ...themeStyle, width: "min(560px, 100%)", minHeight: "auto" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-service-modal-title"
          >
            <form onSubmit={saveServicePrice}>
              <div
                style={{
                  padding: "20px 20px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 14,
                  borderBottom: "1px solid var(--maint-border)",
                }}
              >
                <div>
                  <h3
                    id="maintenance-service-modal-title"
                    style={{
                      margin: 0,
                      color: "var(--maint-strong)",
                      fontSize: adminScaledFontSize(20),
                      fontWeight: 900,
                    }}
                  >
                    Edit Service
                  </h3>
                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "var(--maint-muted)",
                      fontSize: adminScaledFontSize(12.5),
                    }}
                  >
                    Update the service name, description, and applicable pricing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeServiceEditor}
                  disabled={savingService}
                  style={closeButtonStyle()}
                  aria-label="Close service editor"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: 20 }}>
                {serviceModalError ? (
                  <StatusAlert
                    type="error"
                    message={serviceModalError}
                    onClose={() => setServiceModalError("")}
                    compact
                  />
                ) : null}

                <div
                  style={{
                    padding: "13px 14px",
                    border: "1px solid var(--maint-border)",
                    borderRadius: 10,
                    background: "var(--maint-card-soft)",
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      color: "var(--maint-strong)",
                      fontSize: adminScaledFontSize(13.5),
                      fontWeight: 900,
                    }}
                  >
                    Service ID: {selectedService.service_id}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      color: "var(--maint-muted)",
                      fontSize: adminScaledFontSize(12),
                      lineHeight: 1.5,
                    }}
                  >
                    Pet Type: {selectedService.pet_type || "Not specified"} • Pricing Method:{" "}
                    {selectedService.weight_based ? "Weight-based" : "Fixed price"}
                  </div>
                </div>

                <TextField
                  label="Service Name"
                  required
                  value={serviceForm.service_name}
                  onChange={(value) => updateServiceForm("service_name", value)}
                  placeholder="Enter service name"
                  helpText="Use a clear and unique name that customers can easily recognize."
                />

                <TextAreaField
                  label="Description"
                  value={serviceForm.description}
                  onChange={(value) => updateServiceForm("description", value)}
                  placeholder="Enter a short description of the service"
                  helpText="Briefly explain what the service includes so customers understand what they are booking."
                />

                <div style={{ marginTop: 16 }}>
                  <MoneyField
                  label="Base Price"
                  required
                  value={serviceForm.base_price}
                  onChange={(value) => updateServiceForm("base_price", value)}
                  helpText={
                    selectedService.weight_based
                      ? "Starting price used for this service."
                      : "Standard price charged for this service."
                  }
                />
                </div>

                {serviceUsesTierPrices(selectedService) ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 14,
                      marginTop: 15,
                    }}
                  >
                    <MoneyField
                      label="Medium Price"
                      value={serviceForm.medium_price}
                      onChange={(value) =>
                        updateServiceForm("medium_price", value)
                      }
                      helpText="Optional rate for medium-sized pets."
                    />
                    <MoneyField
                      label="Large Price"
                      value={serviceForm.large_price}
                      onChange={(value) =>
                        updateServiceForm("large_price", value)
                      }
                      helpText="Optional rate for large-sized pets."
                    />
                  </div>
                ) : null}

                {selectedService.note ? (
                  <div
                    style={{
                      marginTop: 18,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 9,
                      padding: "11px 13px",
                      border: "1px solid var(--maint-border)",
                      borderRadius: 9,
                      background: "var(--maint-card-soft)",
                      color: "var(--maint-muted)",
                      fontSize: adminScaledFontSize(12),
                      lineHeight: 1.5,
                    }}
                  >
                    <Info size={16} color={BRAND.pink} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span>{selectedService.note}</span>
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  padding: "15px 20px 20px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  borderTop: "1px solid var(--maint-border)",
                }}
              >
                <button
                  type="button"
                  onClick={closeServiceEditor}
                  disabled={savingService}
                  style={secondaryButtonStyle()}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  style={primaryButtonStyle(savingService)}
                >
                  {savingService ? (
                    <span className="maintenance-spinner" />
                  ) : (
                    <Save size={17} />
                  )}
                  {savingService ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  desc,
  iconBackground,
  iconColor,
  active = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`maintenance-card maintenance-stat-card${
        active ? " is-active" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      style={{
        height: 118,
        padding: 18,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          minWidth: 64,
          borderRadius: 13,
          background: iconBackground,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: "var(--maint-text)",
            fontSize: adminScaledFontSize(14),
            fontWeight: 800,
          }}
        >
          {label}
        </div>
        <div
          style={{
            margin: "4px 0 2px",
            color: "var(--maint-strong)",
            fontSize: adminScaledFontSize(28),
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            color: "var(--maint-muted)",
            fontSize: adminScaledFontSize(12),
            lineHeight: 1.25,
          }}
        >
          {desc}
        </div>
      </div>
    </button>
  );
}

function TableHeading({ children, width, align = "left" }) {
  return (
    <th
      style={{
        width,
        padding: "15px 12px",
        textAlign: align,
        color: "var(--maint-text)",
        fontSize: adminScaledFontSize(12.5),
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function TableCell({ children, align = "left", muted = false, strong = false }) {
  return (
    <td
      style={{
        padding: "16px 12px",
        textAlign: align,
        color: muted ? "var(--maint-muted)" : "var(--maint-text)",
        fontSize: adminScaledFontSize(12.5),
        fontWeight: strong ? 800 : 500,
        verticalAlign: "middle",
        overflow: "hidden",
      }}
    >
      {children}
    </td>
  );
}

function PetTypeBadge({ petType }) {
  const normalized = String(petType || "").trim().toLowerCase();
  const isDog = normalized === "dog";
  const isCat = normalized === "cat";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 27,
        padding: "0 9px",
        borderRadius: 999,
        border: `1px solid ${
          isDog ? "#CADFF3" : isCat ? "#DFCDED" : "#E7DDDA"
        }`,
        background: isDog ? "#EAF3FC" : isCat ? "#F3EAF9" : "#F5F1F0",
        color: isDog ? "#285F95" : isCat ? "#714493" : BRAND.muted,
        fontSize: adminScaledFontSize(11.5),
        fontWeight: 900,
      }}
    >
      {isDog ? <Dog size={14} /> : isCat ? <Cat size={14} /> : null}
      {petType || "Not set"}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  helpText,
  placeholder,
  required = false,
}) {
  return (
    <label style={{ display: "block", marginBottom: 15 }}>
      <span
        style={{
          display: "block",
          marginBottom: 7,
          color: "var(--maint-strong)",
          fontSize: adminScaledFontSize(12.5),
          fontWeight: 900,
        }}
      >
        {label}
        {required ? <span style={{ color: BRAND.pink }}> *</span> : null}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 44,
          border: "1px solid var(--maint-border-strong)",
          borderRadius: 9,
          padding: "0 12px",
          background: "var(--maint-input)",
          color: "var(--maint-text)",
          fontSize: adminScaledFontSize(13.5),
          fontWeight: 700,
        }}
      />

      {helpText ? (
        <span
          style={{
            display: "block",
            marginTop: 6,
            color: "var(--maint-muted)",
            fontSize: adminScaledFontSize(11),
            lineHeight: 1.4,
          }}
        >
          {helpText}
        </span>
      ) : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  helpText,
  placeholder,
}) {
  return (
    <label style={{ display: "block", marginBottom: 15 }}>
      <span
        style={{
          display: "block",
          marginBottom: 7,
          color: "var(--maint-strong)",
          fontSize: adminScaledFontSize(12.5),
          fontWeight: 900,
        }}
      >
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{
          width: "100%",
          minHeight: 96,
          resize: "vertical",
          border: "1px solid var(--maint-border-strong)",
          borderRadius: 9,
          padding: "10px 12px",
          background: "var(--maint-input)",
          color: "var(--maint-text)",
          fontFamily: "inherit",
          fontSize: adminScaledFontSize(13),
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      />

      {helpText ? (
        <span
          style={{
            display: "block",
            marginTop: 6,
            color: "var(--maint-muted)",
            fontSize: adminScaledFontSize(11),
            lineHeight: 1.4,
          }}
        >
          {helpText}
        </span>
      ) : null}
    </label>
  );
}

function MoneyField({ label, value, onChange, helpText, required = false }) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          marginBottom: 7,
          color: "var(--maint-strong)",
          fontSize: adminScaledFontSize(12.5),
          fontWeight: 900,
        }}
      >
        {label}
        {required ? <span style={{ color: BRAND.pink }}> *</span> : null}
      </span>
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--maint-muted)",
            fontSize: adminScaledFontSize(14),
            fontWeight: 900,
            pointerEvents: "none",
          }}
        >
          ₱
        </span>
        <input
          className="maintenance-price-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
          placeholder="0.00"
          style={{
            width: "100%",
            height: 44,
            border: "1px solid var(--maint-border-strong)",
            borderRadius: 9,
            padding: "0 12px 0 31px",
            background: "var(--maint-input)",
            color: "var(--maint-text)",
            fontSize: adminScaledFontSize(14),
            fontWeight: 800,
          }}
        />
      </div>
      {helpText ? (
        <span
          style={{
            display: "block",
            marginTop: 6,
            color: "var(--maint-muted)",
            fontSize: adminScaledFontSize(11),
            lineHeight: 1.4,
          }}
        >
          {helpText}
        </span>
      ) : null}
    </label>
  );
}

function PercentageField({ label, value, onChange }) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          marginBottom: 7,
          color: "var(--maint-strong)",
          fontSize: adminScaledFontSize(12.5),
          fontWeight: 900,
        }}
      >
        {label}
      </span>
      <div style={{ position: "relative" }}>
        <input
          className="maintenance-price-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
          placeholder="0"
          style={{
            width: "100%",
            height: 44,
            border: "1px solid var(--maint-border-strong)",
            borderRadius: 9,
            padding: "0 38px 0 12px",
            background: "var(--maint-input)",
            color: "var(--maint-text)",
            fontSize: adminScaledFontSize(14),
            fontWeight: 900,
          }}
        />
        <span
          style={{
            position: "absolute",
            right: 13,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--maint-muted)",
            fontSize: adminScaledFontSize(13),
            fontWeight: 900,
            pointerEvents: "none",
          }}
        >
          %
        </span>
      </div>
    </label>
  );
}

function StatusAlert({ type, message, onClose, compact = false }) {
  const success = type === "success";

  return (
    <div
      style={{
        marginBottom: compact ? 16 : 18,
        padding: compact ? "10px 12px" : "12px 14px",
        borderRadius: 10,
        border: `1px solid var(--maint-${success ? "success" : "error"}-border)`,
        background: `var(--maint-${success ? "success" : "error"}-bg)`,
        color: `var(--maint-${success ? "success" : "error"}-text)`,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: adminScaledFontSize(12.5),
        fontWeight: 700,
        lineHeight: 1.5,
      }}
    >
      {success ? (
        <CheckCircle2 size={18} style={{ marginTop: 1, flexShrink: 0 }} />
      ) : (
        <AlertCircle size={18} style={{ marginTop: 1, flexShrink: 0 }} />
      )}
      <span style={{ flex: 1 }}>{message}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          style={{
            width: 26,
            height: 26,
            padding: 0,
            border: 0,
            background: "transparent",
            color: "inherit",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={15} />
        </button>
      ) : null}
    </div>
  );
}

function serviceUsesTierPrices(service) {
  return Boolean(
    service?.weight_based ||
      (service?.medium_price !== null && service?.medium_price !== undefined) ||
      (service?.large_price !== null && service?.large_price !== undefined)
  );
}

function formatEditableNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return Number.isInteger(number)
    ? String(number)
    : String(roundTwoDecimals(number));
}

function formatPeso(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatPercentage(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0%";
  return `${roundTwoDecimals(number)}%`;
}

function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function parseRequiredMoney(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0) return null;
  return roundTwoDecimals(number);
}

function parseOptionalMoney(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0) return null;
  return roundTwoDecimals(number);
}

function roundTwoDecimals(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function moneyValuesEqual(left, right) {
  const normalize = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? roundTwoDecimals(number) : null;
  };

  return normalize(left) === normalize(right);
}

function percentagesEqual100(sitter, owner) {
  if (!Number.isFinite(Number(sitter)) || !Number.isFinite(Number(owner))) {
    return false;
  }
  return Math.abs(Number(sitter) + Number(owner) - 100) < 0.005;
}

function isValidCurrencyTyping(value) {
  return value === "" || /^\d{0,9}(?:\.\d{0,2})?$/.test(value);
}

function isValidPercentageTyping(value) {
  if (value === "") return true;
  if (!/^\d{0,3}(?:\.\d{0,2})?$/.test(value)) return false;
  const number = Number(value);
  return Number.isFinite(number) && number <= 100;
}

function getSitterRevenueSaveMessage(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();

  if (text.includes("row-level security") || text.includes("rls")) {
    return "You do not have permission to update revenue-sharing settings. Please review the administrator access policy.";
  }

  if (text.includes("100") || text.includes("check constraint")) {
    return "The Pet Sitter and Business Owner revenue shares must total exactly 100%.";
  }

  return "The revenue-sharing settings could not be updated. Please try again.";
}

function pricingBadgeStyle(type) {
  const weight = type === "weight";
  return {
    display: "inline-flex",
    alignItems: "center",
    height: 27,
    padding: "0 9px",
    borderRadius: 999,
    background: weight ? "#FCEBDD" : "#EDF6FB",
    color: weight ? "#CE7026" : "#286B8C",
    fontSize: adminScaledFontSize(11.5),
    fontWeight: 900,
  };
}

function emptyCellStyle() {
  return {
    padding: 32,
    textAlign: "center",
    color: "var(--maint-muted)",
    fontSize: adminScaledFontSize(13),
    fontWeight: 700,
  };
}

function primaryButtonStyle(disabled = false) {
  return {
    minHeight: 40,
    border: `1px solid ${BRAND.pink}`,
    borderRadius: 9,
    background: BRAND.pink,
    color: "#FFFFFF",
    padding: "0 15px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: adminScaledFontSize(12.5),
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.58 : 1,
    boxShadow: disabled ? "none" : "0 6px 14px rgba(217, 67, 104, 0.18)",
  };
}

function secondaryButtonStyle() {
  return {
    minHeight: 40,
    border: "1px solid var(--maint-border-strong)",
    borderRadius: 9,
    background: "var(--maint-card)",
    color: "var(--maint-strong)",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: adminScaledFontSize(12.5),
    fontWeight: 900,
    cursor: "pointer",
  };
}

function iconActionButtonStyle() {
  return {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "1px solid rgba(217, 67, 104, 0.28)",
    background: "var(--maint-card)",
    color: BRAND.pink,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}

function closeButtonStyle() {
  return {
    width: 36,
    height: 36,
    borderRadius: 9,
    border: "1px solid var(--maint-border-strong)",
    background: "var(--maint-card)",
    color: "var(--maint-muted)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}
