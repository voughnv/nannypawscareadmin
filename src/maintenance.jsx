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
  Scale,
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
    base_price: "",
    medium_price: "",
    large_price: "",
  });
  const [savingService, setSavingService] = useState(false);
  const [serviceModalError, setServiceModalError] = useState("");
  const [serviceConfirmationOpen, setServiceConfirmationOpen] = useState(false);

  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueSaving, setRevenueSaving] = useState(false);
  const [revenueError, setRevenueError] = useState("");
  const [revenueConfigured, setRevenueConfigured] = useState(false);
  const [revenueForm, setRevenueForm] = useState({
    pet_sitter_percentage: "60",
    business_owner_percentage: "40",
  });

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

    return () => {
      supabase.removeChannel(serviceChannel);
    };
  }, []);

  async function fetchMaintenanceData() {
    setLoading(true);
    setRevenueLoading(true);
    setServiceError("");
    setRevenueError("");

    await fetchServices(false);

    setLoading(false);
    setRevenueLoading(false);
  }

  function syncRevenueFromServices(serviceRows) {
    const rows = Array.isArray(serviceRows) ? serviceRows : [];

    if (rows.length === 0) {
      setRevenueConfigured(false);
      setRevenueForm({
        pet_sitter_percentage: "60",
        business_owner_percentage: "40",
      });
      return;
    }

    const firstConfiguredRow = rows.find((row) => {
      const sitter = Number(row.pet_sitter_percentage);
      const owner = Number(row.business_owner_percentage);

      return (
        Number.isFinite(sitter) &&
        Number.isFinite(owner) &&
        percentagesEqual100(sitter, owner)
      );
    });

    if (!firstConfiguredRow) {
      setRevenueConfigured(false);
      setRevenueForm({
        pet_sitter_percentage: "60",
        business_owner_percentage: "40",
      });
      return;
    }

    const sitterPercentage = Number(
      firstConfiguredRow.pet_sitter_percentage
    );
    const ownerPercentage = Number(
      firstConfiguredRow.business_owner_percentage
    );

    setRevenueConfigured(true);
    setRevenueForm({
      pet_sitter_percentage: formatEditableNumber(sitterPercentage),
      business_owner_percentage: formatEditableNumber(ownerPercentage),
    });

    const hasInconsistentRevenueShare = rows.some((row) => {
      const rowSitter = Number(row.pet_sitter_percentage);
      const rowOwner = Number(row.business_owner_percentage);

      return (
        !Number.isFinite(rowSitter) ||
        !Number.isFinite(rowOwner) ||
        Math.abs(rowSitter - sitterPercentage) >= 0.005 ||
        Math.abs(rowOwner - ownerPercentage) >= 0.005
      );
    });

    if (hasInconsistentRevenueShare) {
      setRevenueError(
        "Revenue sharing values differ between service records. Save the percentages below to synchronize all services."
      );
    } else {
      setRevenueError("");
    }
  }

  async function fetchServices(showBusyState = true) {
    if (showBusyState) {
      setRefreshing(true);
      setRevenueLoading(true);
    }

    setServiceError("");

    try {
      const { data, error } = await supabase
        .from(SERVICE_TABLE)
        .select(
          "service_id, service_name, pet_type, description, base_price, medium_price, large_price, weight_based, note, pet_sitter_percentage, business_owner_percentage, created_at, updated_at"
        )
        .order("service_id", { ascending: true });

      if (error) throw error;

      const serviceRows = data || [];
      setServices(serviceRows);
      syncRevenueFromServices(serviceRows);
    } catch (error) {
      console.error("Unable to load service catalog:", error);

      const errorText = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
      const missingRevenueColumns =
        errorText.includes("pet_sitter_percentage") ||
        errorText.includes("business_owner_percentage");

      setServiceError(
        missingRevenueColumns
          ? "Revenue-sharing fields are not available in the service catalog yet. Apply the Maintenance database update and refresh the page."
          : "Unable to load the service catalog. Please refresh the page and try again."
      );

      if (missingRevenueColumns) {
        setRevenueConfigured(false);
        setRevenueError(
          "Revenue sharing cannot be loaded until the Maintenance database update is applied."
        );
      }
    } finally {
      if (showBusyState) {
        setRefreshing(false);
        setRevenueLoading(false);
      }
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setRevenueLoading(true);
    setSuccess("");

    await fetchServices(false);

    setRefreshing(false);
    setRevenueLoading(false);
  }

  function openServiceEditor(service) {
    setSelectedService(service);
    setServiceModalError("");
    setServiceForm({
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
    if (!isValidCurrencyTyping(value)) return;
    setServiceForm((previous) => ({ ...previous, [field]: value }));
  }

  async function saveServicePrice(event) {
    event.preventDefault();
    if (!selectedService) return;

    setServiceModalError("");
    setSuccess("");

    const basePrice = parseRequiredMoney(serviceForm.base_price);
    const usesTierPrices = serviceUsesTierPrices(selectedService);
    const mediumPrice = usesTierPrices
      ? parseOptionalMoney(serviceForm.medium_price)
      : selectedService.medium_price;
    const largePrice = usesTierPrices
      ? parseOptionalMoney(serviceForm.large_price)
      : selectedService.large_price;

    if (basePrice === null) {
      setServiceModalError("Enter a valid base price of ₱0.00 or higher.");
      return;
    }

    if (
      usesTierPrices &&
      ((serviceForm.medium_price.trim() !== "" && mediumPrice === null) ||
        (serviceForm.large_price.trim() !== "" && largePrice === null))
    ) {
      setServiceModalError(
        "Enter valid medium and large prices, or leave an optional price blank."
      );
      return;
    }

    const baseChanged = !moneyValuesEqual(selectedService.base_price, basePrice);
    const mediumChanged =
      usesTierPrices &&
      !moneyValuesEqual(selectedService.medium_price, mediumPrice);
    const largeChanged =
      usesTierPrices &&
      !moneyValuesEqual(selectedService.large_price, largePrice);

    if (!baseChanged && !mediumChanged && !largeChanged) {
      setSelectedService(null);
      showSuccessNearCards("Service pricing is already up to date.");
      return;
    }

    const priceChanges = [];

    if (baseChanged) {
      priceChanges.push(
        `Base: ${formatPeso(selectedService.base_price)} → ${formatPeso(basePrice)}`
      );
    }

    if (mediumChanged) {
      priceChanges.push(
        `Medium: ${formatPeso(selectedService.medium_price)} → ${formatPeso(
          mediumPrice
        )}`
      );
    }

    if (largeChanged) {
      priceChanges.push(
        `Large: ${formatPeso(selectedService.large_price)} → ${formatPeso(
          largePrice
        )}`
      );
    }

    // Temporarily hide the price editor while the shared confirmation dialog is open.
    // This guarantees the confirmation dialog is the top-most modal regardless of
    // the z-index used by ConfirmationProvider. The editor state is preserved and
    // returns unchanged when the Admin cancels.
    setServiceConfirmationOpen(true);

    const confirmed = await requestConfirmation({
      title: "Update service price?",
      message: `Save the pricing changes for ${
        selectedService.service_name || "this service"
      }? ${priceChanges.join(" • ")}`,
      confirmText: "Save Price",
      cancelText: "Cancel",
      variant: "primary",
    });

    if (!confirmed) {
      setServiceConfirmationOpen(false);
      return;
    }

    setSavingService(true);

    try {
      const updatePayload = {
        base_price: basePrice,
        updated_at: new Date().toISOString(),
      };

      if (usesTierPrices) {
        updatePayload.medium_price = mediumPrice;
        updatePayload.large_price = largePrice;
      }

      const { data, error } = await supabase
        .from(SERVICE_TABLE)
        .update(updatePayload)
        .eq("service_id", selectedService.service_id)
        .select(
          "service_id, service_name, pet_type, description, base_price, medium_price, large_price, weight_based, note, pet_sitter_percentage, business_owner_percentage, created_at, updated_at"
        )
        .single();

      if (error) throw error;

      setServices((previous) =>
        previous.map((service) =>
          service.service_id === data.service_id ? data : service
        )
      );

      setSelectedService(null);
      showSuccessNearCards("Service price updated successfully.");
    } catch (error) {
      console.error("Unable to update service price:", error);
      // Restore the editor if the database update fails so the Admin can see
      // the error and keep the entered values.
      setServiceConfirmationOpen(false);
      setServiceModalError(
        "Unable to update the service price. Please try again."
      );
    } finally {
      setSavingService(false);
      setServiceConfirmationOpen(false);
    }
  }

  function updateRevenueField(field, value) {
    if (!isValidPercentageTyping(value)) return;
    setRevenueForm((previous) => ({ ...previous, [field]: value }));
    setRevenueError("");
  }

  async function saveRevenueShare(event) {
    event.preventDefault();
    setRevenueError("");
    setSuccess("");

    const sitterPercentage = Number(revenueForm.pet_sitter_percentage);
    const ownerPercentage = Number(revenueForm.business_owner_percentage);

    if (
      !Number.isFinite(sitterPercentage) ||
      !Number.isFinite(ownerPercentage) ||
      sitterPercentage < 0 ||
      sitterPercentage > 100 ||
      ownerPercentage < 0 ||
      ownerPercentage > 100
    ) {
      setRevenueError("Each revenue percentage must be between 0% and 100%.");
      return;
    }

    if (!percentagesEqual100(sitterPercentage, ownerPercentage)) {
      setRevenueError(
        "Pet Sitter and Business Owner percentages must total exactly 100%."
      );
      return;
    }

    if (services.length === 0) {
      setRevenueError(
        "Revenue sharing cannot be saved because no service records are available."
      );
      return;
    }

    const normalizedSitterPercentage = roundTwoDecimals(sitterPercentage);
    const normalizedOwnerPercentage = roundTwoDecimals(ownerPercentage);
    const serviceIds = services
      .map((service) => service.service_id)
      .filter(
        (serviceId) =>
          serviceId !== null &&
          serviceId !== undefined &&
          String(serviceId).trim() !== ""
      );

    if (serviceIds.length === 0) {
      setRevenueError("No service records are available for update.");
      return;
    }

    const revenueShareAlreadyMatches = services.every((service) => {
      const currentSitter = Number(service.pet_sitter_percentage);
      const currentOwner = Number(service.business_owner_percentage);

      return (
        Number.isFinite(currentSitter) &&
        Number.isFinite(currentOwner) &&
        Math.abs(currentSitter - normalizedSitterPercentage) < 0.005 &&
        Math.abs(currentOwner - normalizedOwnerPercentage) < 0.005
      );
    });

    if (revenueShareAlreadyMatches) {
      setRevenueConfigured(true);
      setRevenueError("");
      showSuccessNearCards(
        "Revenue sharing percentages are already up to date."
      );
      return;
    }

    const currentSitterPercentage = getCommonRevenuePercentage(
      services,
      "pet_sitter_percentage"
    );
    const currentOwnerPercentage = getCommonRevenuePercentage(
      services,
      "business_owner_percentage"
    );

    const currentSplitText =
      currentSitterPercentage !== null && currentOwnerPercentage !== null
        ? `Current: ${formatPercentage(
            currentSitterPercentage
          )} Pet Sitter / ${formatPercentage(
            currentOwnerPercentage
          )} Business Owner. `
        : "";

    const confirmed = await requestConfirmation({
      title: "Update revenue sharing?",
      message: `${currentSplitText}New: ${formatPercentage(
        normalizedSitterPercentage
      )} Pet Sitter / ${formatPercentage(
        normalizedOwnerPercentage
      )} Business Owner. This new split will apply to future finalized transactions only.`,
      confirmText: "Save Revenue Sharing",
      cancelText: "Cancel",
      variant: "primary",
    });

    if (!confirmed) return;

    setRevenueSaving(true);

    try {
      // Revenue sharing is a separate configuration from service pricing.
      // Do not touch updated_at here; the Service Pricing "Last Updated" value
      // must change only when a service price is actually edited.
      const payload = {
        pet_sitter_percentage: normalizedSitterPercentage,
        business_owner_percentage: normalizedOwnerPercentage,
      };

      const { data, error } = await supabase
        .from(SERVICE_TABLE)
        .update(payload)
        .in("service_id", serviceIds)
        .select(
          "service_id, pet_sitter_percentage, business_owner_percentage"
        );

      if (error) throw error;

      const updatedRows = data || [];

      if (updatedRows.length !== serviceIds.length) {
        throw new Error(
          "Not all service records were updated. Please verify administrator access."
        );
      }

      const updatedById = new Map(
        updatedRows.map((row) => [String(row.service_id), row])
      );

      setServices((previous) =>
        previous.map((service) => {
          const updated = updatedById.get(String(service.service_id));

          return updated
            ? {
                ...service,
                ...updated,
              }
            : service;
        })
      );

      setRevenueConfigured(true);
      setRevenueForm({
        pet_sitter_percentage: formatEditableNumber(
          normalizedSitterPercentage
        ),
        business_owner_percentage: formatEditableNumber(
          normalizedOwnerPercentage
        ),
      });

      setRevenueError("");
      showSuccessNearCards(
        "Revenue sharing percentages updated successfully."
      );
    } catch (error) {
      console.error("Unable to update revenue sharing percentages:", error);
      setRevenueError(getRevenueSaveMessage(error));
    } finally {
      setRevenueSaving(false);
    }
  }

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      const servicePetType = String(service.pet_type || "").toLowerCase();

      const matchesCard =
        cardFilter === "All" ||
        (cardFilter === "Dog" && servicePetType === "dog") ||
        (cardFilter === "Cat" && servicePetType === "cat") ||
        (cardFilter === "WeightBased" && Boolean(service.weight_based));

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
    const weightBased = services.filter((service) =>
      Boolean(service.weight_based)
    ).length;

    return {
      total: services.length,
      dogServices,
      catServices,
      weightBased,
    };
  }, [services]);

  const sitterShare = Number(revenueForm.pet_sitter_percentage || 0);
  const ownerShare = Number(revenueForm.business_owner_percentage || 0);
  const shareTotal =
    (Number.isFinite(sitterShare) ? sitterShare : 0) +
    (Number.isFinite(ownerShare) ? ownerShare : 0);
  const validShareTotal = percentagesEqual100(sitterShare, ownerShare);

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
            Manage service pricing and revenue sharing settings.
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
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<Coins size={28} />}
          label="Service Records"
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
          desc="Services for dogs"
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
          desc="Services for cats"
          iconBackground="#EFE5F8"
          iconColor="#7A4BA3"
          active={cardFilter === "Cat"}
          disabled={loading}
          onClick={() => handleCardFilter("Cat")}
        />
        <StatCard
          icon={<Scale size={28} />}
          label="Weight-Based Pricing"
          value={loading ? "—" : stats.weightBased}
          desc="Services with size rates"
          iconBackground="#FCEBDD"
          iconColor="#CE7026"
          active={cardFilter === "WeightBased"}
          disabled={loading}
          onClick={() => handleCardFilter("WeightBased")}
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
              Service Pricing
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                color: "var(--maint-muted)",
                fontSize: adminScaledFontSize(13),
                lineHeight: 1.5,
              }}
            >
              Update the prices currently used for Nanny Paws Care services.
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
                placeholder="Search service or ID"
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
              title="Refresh maintenance data"
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
                <TableHeading width="135px">Medium</TableHeading>
                <TableHeading width="135px">Large</TableHeading>
                <TableHeading width="150px">Pricing</TableHeading>
                <TableHeading width="170px">Last Updated</TableHeading>
                <TableHeading width="100px" align="center">Action</TableHeading>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={emptyCellStyle()}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <span className="maintenance-spinner" />
                      Loading service pricing...
                    </span>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={9} style={emptyCellStyle()}>
                    No service records match the current filter.
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
                        <span style={pricingBadgeStyle("fixed")}>Base price</span>
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
                        title={`Edit ${service.service_name || "service"} price`}
                        aria-label={`Edit ${service.service_name || "service"} price`}
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
            Showing {filteredServices.length} of {services.length} service record
            {services.length === 1 ? "" : "s"}.
          </div>
        ) : null}
      </section>

      <section className="maintenance-card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--maint-border)",
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
              Revenue Sharing
            </h2>
          </div>
          <p
            style={{
              margin: "7px 0 0",
              color: "var(--maint-muted)",
              fontSize: adminScaledFontSize(13),
              lineHeight: 1.55,
              maxWidth: 820,
            }}
          >
            Configure how service revenue is divided between the Pet Sitter and Business Owner.
            The two percentages must always total 100%.
          </p>
        </div>

        <form onSubmit={saveRevenueShare} style={{ padding: 20 }}>
          {revenueError ? (
            <StatusAlert
              type="error"
              message={revenueError}
              onClose={() => setRevenueError("")}
              compact
            />
          ) : null}

          {!revenueConfigured && !revenueError && !revenueLoading ? (
            <div
              style={{
                marginBottom: 16,
                padding: "11px 13px",
                borderRadius: 9,
                border: "1px solid var(--maint-warning-border)",
                background: "var(--maint-warning-bg)",
                color: "var(--maint-warning-text)",
                display: "flex",
                alignItems: "flex-start",
                gap: 9,
                fontSize: adminScaledFontSize(12.5),
                lineHeight: 1.5,
                fontWeight: 700,
              }}
            >
              <Info size={17} style={{ marginTop: 1, flexShrink: 0 }} />
              No saved revenue configuration was found. The form is showing the proposed 60% / 40% split. Save it to create the active configuration.
            </div>
          ) : null}

          {revenueLoading ? (
            <div
              style={{
                minHeight: 120,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "var(--maint-muted)",
                fontWeight: 700,
                fontSize: adminScaledFontSize(13),
              }}
            >
              <span className="maintenance-spinner" />
              Loading revenue settings...
            </div>
          ) : (
            <>
              <div
                className="maintenance-revenue-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 220px",
                  gap: 18,
                  alignItems: "end",
                }}
              >
                <PercentageField
                  label="Pet Sitter Share"
                  value={revenueForm.pet_sitter_percentage}
                  onChange={(value) =>
                    updateRevenueField("pet_sitter_percentage", value)
                  }
                />
                <PercentageField
                  label="Business Owner Share"
                  value={revenueForm.business_owner_percentage}
                  onChange={(value) =>
                    updateRevenueField("business_owner_percentage", value)
                  }
                />
                <div>
                  <div
                    style={{
                      marginBottom: 7,
                      color: "var(--maint-strong)",
                      fontSize: adminScaledFontSize(12.5),
                      fontWeight: 900,
                    }}
                  >
                    Total Allocation
                  </div>
                  <div
                    style={{
                      height: 44,
                      borderRadius: 9,
                      border: `1px solid ${
                        validShareTotal ? "#B8DEC5" : "#F0C0C7"
                      }`,
                      background: validShareTotal
                        ? "var(--maint-success-bg)"
                        : "var(--maint-error-bg)",
                      color: validShareTotal
                        ? "var(--maint-success-text)"
                        : "var(--maint-error-text)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: adminScaledFontSize(15),
                      fontWeight: 900,
                    }}
                  >
                    {validShareTotal ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <AlertCircle size={17} />
                    )}
                    {formatPercentage(shareTotal)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
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
                  Changes here apply to future calculations. Completed transactions should keep the price and percentage values that were saved for that transaction when it was finalized.
                </span>
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="submit"
                  disabled={revenueSaving || !validShareTotal}
                  style={primaryButtonStyle(
                    revenueSaving || !validShareTotal
                  )}
                >
                  {revenueSaving ? (
                    <span className="maintenance-spinner" />
                  ) : (
                    <Save size={17} />
                  )}
                  {revenueSaving ? "Saving..." : "Save Revenue Sharing"}
                </button>
              </div>
            </>
          )}
        </form>
      </section>

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
                    Edit Service Price
                  </h3>
                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "var(--maint-muted)",
                      fontSize: adminScaledFontSize(12.5),
                    }}
                  >
                    Update the current pricing for this service.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeServiceEditor}
                  disabled={savingService}
                  style={closeButtonStyle()}
                  aria-label="Close service price editor"
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
                      fontSize: adminScaledFontSize(14),
                      fontWeight: 900,
                    }}
                  >
                    {selectedService.service_name}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      color: "var(--maint-muted)",
                      fontSize: adminScaledFontSize(12),
                      lineHeight: 1.5,
                    }}
                  >
                    Service ID {selectedService.service_id} • {selectedService.pet_type || "No pet type"}
                  </div>
                </div>

                <MoneyField
                  label="Base Price"
                  required
                  value={serviceForm.base_price}
                  onChange={(value) => updateServiceForm("base_price", value)}
                  helpText={
                    selectedService.weight_based
                      ? "This is the starting price for the service."
                      : "This is the price displayed for the service."
                  }
                />

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
                      helpText="Optional medium-weight rate."
                    />
                    <MoneyField
                      label="Large Price"
                      value={serviceForm.large_price}
                      onChange={(value) =>
                        updateServiceForm("large_price", value)
                      }
                      helpText="Optional large-weight rate."
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
                  {savingService ? "Saving..." : "Save Price"}
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

function getCommonRevenuePercentage(services, field) {
  const values = (services || [])
    .map((service) => Number(service?.[field]))
    .filter((value) => Number.isFinite(value))
    .map((value) => roundTwoDecimals(value));

  if (values.length === 0) return null;

  const first = values[0];
  return values.every((value) => Math.abs(value - first) < 0.005)
    ? first
    : null;
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

function getRevenueSaveMessage(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();

  if (text.includes("row-level security") || text.includes("rls")) {
    return "You do not have permission to update revenue sharing settings. Please check the administrator access policy.";
  }

  if (text.includes("100") || text.includes("check constraint")) {
    return "Pet Sitter and Business Owner percentages must total exactly 100%.";
  }

  return "Unable to update revenue sharing percentages. Please try again.";
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
