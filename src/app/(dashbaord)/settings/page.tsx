"use client";

import React, { useState, useEffect } from "react";
import {
  configService,
  TenantConfiguration,
  DocumentSequence,
  TenantSubscription,
} from "../../../../services/configService";
import {
  navigationService,
  TenantListItem,
} from "../../../../services/navigationService";
import {
  tenantService,
  ModuleWithPages,
  TenantEntitlements,
} from "../../../../services/tenantService";
import { ALL_MODULE_CODES } from "@/app/config/moduleCatalog";
import { authService } from "../../../../services/authService";
import { downloadTenantExport } from "../../../../services/exportService";
import { useTenantConfig } from "@/context/TenantConfigContext";
import { useNavigation } from "@/context/NavigationContext";
import { previewSequenceNumber } from "@/utils/configFormatter";
import {
  Settings,
  Shield,
  Building2,
  Receipt,
  Hash,
  Zap,
  Crown,
  Plug,
  ClipboardList,
  BarChart3,
  Check,
  X,
  Plus,
  Rocket,
  Star,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  LayoutDashboard,
  Package,
  FileText,
  Truck,
  FileCheck,
  CreditCard,
  Database,
  Users,
  Navigation,
  Sliders,
  CheckCircle2,
  AlertCircle,
  IndianRupee
} from "lucide-react";

type TabKey = "general" | "menu_entitlements" | "billing" | "sequences" | "workflows" | "modules" | "integrations";

// TASK-054 — offline/first-render fallback for the read-only entitlement
// display. The authoritative module + page catalog comes live from
// tenantService.getCatalog(); dotted "menu keys" and the role/user override
// catalog have been removed (entitlement + role editing moved to /clients + /roles).
const FALLBACK_CATALOG: ModuleWithPages[] = ALL_MODULE_CODES.map((m, i) => ({
  code: m.code,
  name: m.label,
  isPremium: false,
  displayOrder: i,
  pages: [],
}));

export function renderCatalogIcon(keyOrName: string, className = "w-4 h-4") {
  switch (keyOrName) {
    case "dashboard":
      return <LayoutDashboard className={className} />;
    case "bilty":
    case "consignments":
      return <Package className={className} />;
    case "delivery_settlement":
      return <FileCheck className={className} />;
    case "trips":
    case "truck":
      return <Truck className={className} />;
    case "trip_settlement":
      return <CreditCard className={className} />;
    case "pod":
      return <FileCheck className={className} />;
    case "billing":
      return <Receipt className={className} />;
    case "master_data":
    case "database":
      return <Database className={className} />;
    case "users":
    case "vendors":
    case "master_data.parties":
      return <Users className={className} />;
    case "claims":
      return <AlertTriangle className={className} />;
    case "reports":
    case "analytics":
      return <BarChart3 className={className} />;
    case "compliance":
    case "master_data.compliance":
      return <AlertTriangle className={className} />;
    case "tracking":
      return <Navigation className={className} />;
    case "clients":
      return <Building2 className={className} />;
    case "system":
      return <Settings className={className} />;
    case "sliders":
    case "system.settings":
      return <Sliders className={className} />;
    case "rocket":
    case "system.onboard":
      return <Rocket className={className} />;
    case "plus":
    case "consignments.create":
      return <Plus className={className} />;
    case "file":
    case "consignments.all":
    case "billing.invoices":
    case "quotations":
      return <FileText className={className} />;
    case "card":
    case "billing.receipts":
      return <CreditCard className={className} />;
    case "rates":
    case "master_data.rates":
      return <IndianRupee className={className} />;
    case "cog":
    case "master_data.spares":
      return <Settings className={className} />;
    default:
      return <Package className={className} />;
  }
}


export default function SettingsPage() {
  const { config: globalConfig, updateConfig: updateGlobalConfig, refreshConfig } = useTenantConfig();
  const { refreshNavigation } = useNavigation();

  const [activeTab, setActiveTab] = useState<TabKey>("general");
  // Entitlement/subscription control is PLATFORM-operator only. A tenant admin must never be able to
  // grant their own org modules/reports or change their plan — those tabs are gated on this flag.
  // Hydrated synchronously from the cached user (set on login) so the tab set renders correctly
  // on first paint; /me only OVERRIDES on success — a failed /me keeps the cached value rather
  // than blanking the SaaS Configuration tabs for the actual platform operator.
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean>(() => authService.isPlatformAdminSync());
  const [exporting, setExporting] = useState<boolean>(false);

  const handleExportData = async () => {
    try {
      setExporting(true);
      await downloadTenantExport();
    } catch (e: any) {
      setErrorMessage(e?.message || "Failed to export data.");
    } finally {
      setExporting(false);
    }
  };
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  
  // Client selection for Multi-Tenant Entitlements
  const [tenantsList, setTenantsList] = useState<TenantListItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  // TASK-054 — the Menu & Permission matrix is now a READ-ONLY display of the
  // selected tenant's entitlement ceiling (entitled modules + page restrictions
  // + reports). Entitlement editing moved to /clients (platform-admin only);
  // role/permission editing lives on /roles. No more editable module/role state,
  // no `enabledMenuKeys` / `planTier` / `roleOverrides` reads.
  const [entitlements, setEntitlements] = useState<TenantEntitlements | null>(null);

  // Live module + page catalog (GET /admin/catalog) for module/page NAMES in the
  // read-only display. FALLBACK_CATALOG keeps names showing if the fetch fails.
  const [catalog, setCatalog] = useState<ModuleWithPages[]>(FALLBACK_CATALOG);

  // Local form state
  const [formData, setFormData] = useState<TenantConfiguration>({
    tenantId: "",
    general: {
      companyName: "FleetPulse Logistics",
      legalName: "FleetPulse Logistics Network Private Limited",
      supportEmail: "support@fleetpulse.io",
      supportPhone: "+91 98765 43210",
      logoUrl: "",
      faviconUrl: "",
      themeColor: "#0284c7",
      currencyCode: "INR",
      currencySymbol: "₹",
      timeZone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12h",
      address: "123 Logistics Park, Transport Nagar",
      biltyPreset: "standard",
      printDisclaimer: "",
    },
    billingAndTax: {
      isGstEnabled: true,
      gstin: "",
      panNumber: "",
      defaultCgstRate: 2.5,
      defaultSgstRate: 2.5,
      defaultIgstRate: 5.0,
      enableRcm: true,
      eWayBillThresholdAmount: 50000,
      isTdsEnabled: false,
      tdsPercentage: 2.0,
      isTcsEnabled: false,
      tcsPercentage: 0.1,
    },
    documentSequences: [
      { docType: "Invoice", prefix: "INV", suffix: "", paddingDigits: 5, nextNumber: 1001, resetPeriod: "Yearly" },
      { docType: "GR", prefix: "GR", suffix: "", paddingDigits: 5, nextNumber: 2001, resetPeriod: "Yearly" },
      { docType: "Challan", prefix: "CHL", suffix: "", paddingDigits: 5, nextNumber: 3001, resetPeriod: "Yearly" },
      { docType: "Trip", prefix: "TRP", suffix: "", paddingDigits: 5, nextNumber: 4001, resetPeriod: "Yearly" },
      { docType: "Claim", prefix: "CLM", suffix: "", paddingDigits: 5, nextNumber: 5001, resetPeriod: "Yearly" },
    ],
    operationalWorkflows: {
      mandatoryDriverPhone: true,
      mandatoryPodBeforeSettlement: true,
      mandatoryEWayBillForDispatch: true,
      allowOverweightTolerancePercentage: 5.0,
      maxDetentionFreeHours: 24,
      autoCloseCompletedTrips: true,
    },
    featureFlags: {
      gstBilling: true,
      withoutGstBilling: true,
      challanManagement: true,
      tripManagement: true,
      fleetManagement: true,
      vehicleMaintenance: true,
      cargoClaims: true,
      gpsTracking: true,
      reportsAndAnalytics: true,
      freightRateCards: true,
      vendorManagement: true,
      customerPortal: false,
    },
    integrations: {
      whatsAppEnabled: false,
      smsEnabled: false,
      gpsProvider: "None",
      fastagEnabled: false,
      webhookUrl: "",
    },
  });

  // Determine whether the current user is the platform operator (controls entitlements/subscription).
  useEffect(() => {
    // If the sync cache already says we're the platform operator, land on the
    // entitlement matrix immediately — don't wait for /me and don't briefly show
    // "Organization Settings" first.
    if (authService.isPlatformAdminSync()) {
      setActiveTab("menu_entitlements");
    }

    authService
      .getMyProfile()
      .then((p) => {
        const platform = !!p.isPlatformAdmin;
        setIsPlatformAdmin(platform);
        if (platform && activeTab !== "menu_entitlements") {
          setActiveTab("menu_entitlements");
        }
      })
      .catch(() => { /* keep the sync-cached value; do not demote the platform operator on /me failure */ });
    // We intentionally read activeTab through the setter callback pattern above where needed;
    // this effect should only ever run on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load configuration, tenants, users and subscription data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const [cfgRes, subRes, tenantsRes, catalogRes] = await Promise.allSettled([
          configService.getConfiguration(),
          configService.getSubscription(),
          navigationService.getAllTenants(),
          tenantService.getCatalog(),
        ]);

        // Live module + page catalog — used for module/page NAMES in the
        // read-only entitlement display (kept in lock-step with /clients).
        if (catalogRes.status === "fulfilled" && catalogRes.value && catalogRes.value.length > 0) {
          setCatalog(catalogRes.value);
        }

        if (cfgRes.status === "fulfilled" && cfgRes.value) {
          setFormData((prev) => ({
            ...prev,
            ...cfgRes.value,
            general: { ...prev.general, ...cfgRes.value.general },
            billingAndTax: { ...prev.billingAndTax, ...cfgRes.value.billingAndTax },
            documentSequences:
              cfgRes.value.documentSequences && cfgRes.value.documentSequences.length > 0
                ? cfgRes.value.documentSequences
                : prev.documentSequences,
            operationalWorkflows: { ...prev.operationalWorkflows, ...cfgRes.value.operationalWorkflows },
            featureFlags: { ...prev.featureFlags, ...cfgRes.value.featureFlags },
            integrations: { ...prev.integrations, ...cfgRes.value.integrations },
          }));
        } else if (globalConfig) {
          setFormData((prev) => ({ ...prev, ...globalConfig }));
        }

        if (subRes.status === "fulfilled" && subRes.value) {
          setSubscription(subRes.value);
        }

        if (tenantsRes.status === "fulfilled" && tenantsRes.value && tenantsRes.value.length > 0) {
          setTenantsList(tenantsRes.value);
          // TASK-054 — the read-only entitlement display is platform-admin only.
          // Default to the first tenant and load its entitlement ceiling.
          if (authService.isPlatformAdminSync()) {
            const firstId = tenantsRes.value[0].id;
            setSelectedTenantId(firstId);
            try {
              const ent = await tenantService.getEntitlements(firstId);
              setEntitlements(ent);
            } catch {
              /* non-fatal — display shows "unavailable" banner */
            }
          }
        }
      } catch (err: any) {
        console.error("Error loading configuration:", err);
        setErrorMessage(err?.message || "Failed to load configuration");
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // Run ONCE on mount. Previously this depended on [globalConfig], but
    // `globalConfig` is a fresh object on every TenantConfig refresh/update
    // (see TenantConfigContext.fetchConfig/updateConfig), so the effect re-fired
    // on mount→fetch, on save→updateConfig, and on save→refreshConfig. Each
    // re-run re-issued all 5 load APIs (the "same API firing many times") AND
    // reset `moduleCodes`/`selectedTenantId` to server state — wiping an admin's
    // in-progress checkbox edits before save and snapping the selected tenant
    // back to the operator's own org after save. The config form is seeded from
    // this effect's own getConfiguration() call (and from handleSave directly),
    // so it does not need to re-run when the context object changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TASK-054 — read-only: switching tenant reloads that tenant's entitlement
  // ceiling for display. No editing here (entitlement editing is on /clients).
  const handleTenantSelect = async (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setEntitlements(null);
    try {
      setLoading(true);
      const ent = await tenantService.getEntitlements(tenantId);
      setEntitlements(ent);
    } catch (err: any) {
      console.error("Error fetching entitlements for tenant:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle saving configuration
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      // TASK-054 — this page only saves the tenant's OWN organization config
      // (branding/logo, numbering, tax, workflows). Entitlement editing is NO
      // LONGER performed here — it is platform-admin-only on /clients. The
      // Menu & Permission matrix tab is a read-only ceiling display.
      const updatedConfig = await updateGlobalConfig(formData);
      setFormData((prev) => ({ ...prev, ...updatedConfig }));

      // TASK-048/049b — push the fresh menu to the sidebar without a hard
      // reload. `navigationService.refreshMenu()` dispatches the shared
      // browser event; `refreshNavigation()` also re-pulls on this tab.
      try {
        await navigationService.refreshMenu();
      } catch {
        // Non-fatal: sidebar refreshes on next route transition.
      }
      await refreshNavigation();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMessage(err?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  // Reset to default settings
  const handleResetDefaults = async () => {
    if (!confirm("Are you sure you want to reset all tenant settings and permissions to system defaults?")) return;

    try {
      setSaving(true);
      const resetConfig = await configService.resetToDefaults();
      setFormData((prev) => ({ ...prev, ...resetConfig }));
      await Promise.all([refreshConfig(), refreshNavigation()]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Reset error:", err);
      setErrorMessage(err?.message || "Failed to reset settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSequenceChange = (index: number, field: keyof DocumentSequence, value: any) => {
    const updated = [...formData.documentSequences];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, documentSequences: updated }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#2F8E86] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Loading SaaS Configuration & Permission Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header Bar - FleetPulse White & Teal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#2F8E86] flex items-center justify-center shadow-xs text-white font-bold text-xl shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white tracking-tight">
                {isPlatformAdmin ? "SaaS Configuration & Permission Engine" : "Organization Settings"}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-md dark:bg-slate-800 dark:text-teal-300 dark:border-slate-700">
                {entitlements?.planCode || "Custom"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
              Manage client menus, subscription plan tiers, dedicated user pages, document sequences, and tax policies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-[#64748B] dark:text-slate-300 hover:text-[#111827] bg-[#F7F8F8] hover:bg-[#E7F1F2] dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl transition cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2F8E86] hover:bg-[#25776F] text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-[#2F9E8F]/30 rounded-xl text-[#2F9E8F] flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#2F9E8F] shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">
            SaaS Configuration, Menu Entitlements & User Dedicated Pages saved successfully! Navigation updated live.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-[#D95C5C]/30 rounded-xl text-[#D95C5C] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#D95C5C] shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E5EAEB] dark:border-slate-800 pb-2 scrollbar-none">
        {[
          { id: "menu_entitlements", label: "Menu & Permission Matrix", icon: Shield, platformOnly: true },
          { id: "general", label: "General & Branding", icon: Building2 },
          { id: "billing", label: "Billing, GST & Tax", icon: Receipt },
          { id: "sequences", label: "Document Sequences", icon: Hash },
          { id: "workflows", label: "Operational Rules", icon: Zap },
          { id: "modules", label: "Subscription & Limits", icon: Crown, platformOnly: true },
          { id: "integrations", label: "Integrations & API", icon: Plug },
        ]
          .filter((tab) => isPlatformAdmin || !(tab as { platformOnly?: boolean }).platformOnly)
          .map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabKey)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#2F8E86] text-white shadow-xs"
                  : "text-[#64748B] dark:text-slate-400 hover:text-[#111827] hover:bg-[#E7F1F2] dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: MENU & PERMISSION MATRIX — READ-ONLY entitlement ceiling display (platform operator only).
          TASK-054 — entitlement editing moved to /clients (platform-admin); role editing to /roles. */}
      {activeTab === "menu_entitlements" && isPlatformAdmin && (
        <div className="space-y-6">
          {/* Tenant selector + guidance */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F8E86] dark:text-teal-400 bg-[#E7F1F2] dark:bg-slate-800 px-2 py-0.5 rounded border border-[#D9E2E3] dark:border-slate-700">
                  Entitlement Ceiling (Read-Only)
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Tenant Entitled Modules &amp; Pages
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  What the selected tenant is entitled to. To <strong>change</strong> entitlements use the platform-admin Clients page; to edit roles &amp; permissions use Roles.
                </p>
              </div>

              <div className="w-full md:w-80">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Active Client Tenant:
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => handleTenantSelect(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#2F8E86]"
                >
                  {tenantsList.length > 0 ? (
                    tenantsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))
                  ) : (
                    <option value={selectedTenantId || "default"}>Primary Organization (Default)</option>
                  )}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <a
                href="/clients"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#E7F1F2] text-[#25776F] border border-[#2F8E86]/30 hover:bg-[#D5EFEA] transition cursor-pointer flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Manage entitlements on Clients →</span>
              </a>
              <a
                href="/roles"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Edit roles &amp; permissions on Roles →</span>
              </a>
            </div>
          </div>

          {!entitlements ? (
            <div className="p-4 bg-[#FFF7ED] border border-[#F4A261]/40 rounded-xl text-[#7C2D12] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Entitlement data unavailable for this tenant — select a tenant above, or try again later.</span>
            </div>
          ) : (
            <>
              {/* Entitled Modules & Pages (read-only) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5EAEB] dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Entitled Modules &amp; Pages
                    </h3>
                    <p className="text-xs text-slate-500">Read-only ceiling. A module shows its restricted pages, or &ldquo;All pages&rdquo; when unrestricted.</p>
                  </div>
                  <span className="text-xs font-bold text-[#2F8E86] bg-[#E7F1F2] dark:bg-slate-800 dark:text-teal-300 px-3 py-1 rounded-lg border border-[#D9E2E3] dark:border-slate-700">
                    {entitlements.moduleCodes.length} Modules
                  </span>
                </div>

                {entitlements.moduleCodes.length === 0 ? (
                  <div className="text-xs text-slate-400">No modules entitled for this tenant.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {entitlements.moduleCodes.map((code) => {
                      const mod = catalog.find((m) => m.code === code);
                      const name = mod ? mod.name : code;
                      const restrictedKeys = entitlements.pageRestrictions
                        ? entitlements.pageRestrictions[code]
                        : undefined;
                      const isRestricted = restrictedKeys !== undefined;
                      const pageTitle = (pk: string) => {
                        const pg = mod?.pages.find((p) => p.pageKey === pk);
                        return pg ? pg.title : pk;
                      };
                      return (
                        <div
                          key={code}
                          className="p-4 rounded-2xl border border-[#E5EAEB] dark:border-slate-700 bg-slate-50/60 dark:bg-slate-850"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {renderCatalogIcon(code, "w-5 h-5 text-[#2F8E86] dark:text-teal-400 shrink-0")}
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{name}</h4>
                                <span className="text-[10px] font-mono text-slate-400 uppercase">Code: {code}</span>
                              </div>
                            </div>
                            {isRestricted ? (
                              <span className="px-2 py-0.5 bg-[#FEF6EE] border border-[#FBD38D] text-[#B45309] text-[10px] font-bold rounded-md shrink-0">
                                Page-restricted
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#E8F6F4] border border-[#C2E9E3] text-[#2F9E8F] text-[10px] font-bold rounded-md shrink-0">
                                All pages
                              </span>
                            )}
                          </div>
                          {isRestricted && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {restrictedKeys!.length === 0 ? (
                                <span className="text-[10px] text-slate-400">No pages entitled.</span>
                              ) : (
                                restrictedKeys!.map((pk) => (
                                  <span
                                    key={pk}
                                    className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300 rounded"
                                  >
                                    {pageTitle(pk)}
                                  </span>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Entitled Reports (read-only) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5EAEB] dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Entitled Reports</h3>
                    <p className="text-xs text-slate-500">Read-only. Report entitlements are managed on the Clients page.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    {entitlements.reports.filter((r) => r.isEnabled).length} / {entitlements.reports.length} Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entitlements.reports.map((report) => (
                    <div
                      key={report.reportKey}
                      className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
                        report.isEnabled
                          ? "bg-white dark:bg-slate-850 border-emerald-300 dark:border-emerald-800 shadow-2xs"
                          : "bg-slate-50 border-slate-200 opacity-60 dark:bg-slate-900"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{report.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                            {report.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{report.description}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                          report.isEnabled
                            ? "bg-[#E8F6F4] text-[#2F9E8F] border border-[#C2E9E3]"
                            : "bg-[#F7F8F8] text-[#94A3B8] border border-[#E5EAEB]"
                        }`}
                      >
                        {report.isEnabled ? "Enabled" : "Off"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 1: GENERAL & BRANDING */}
      {activeTab === "general" && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Company & Tenant Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Company Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.general.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, companyName: e.target.value } })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Legal Registered Name
                  </label>
                  <input
                    type="text"
                    value={formData.general.legalName}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, legalName: e.target.value } })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Support Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.general.supportEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, supportEmail: e.target.value } })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Support Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.general.supportPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, supportPhone: e.target.value } })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Company Logo Image URL (e.g. /logo.jpeg or https://...)
                  </label>
                  <input
                    type="text"
                    placeholder="/logo.jpeg or https://example.com/logo.png"
                    value={formData.general.logoUrl || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, logoUrl: e.target.value } })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">This logo will automatically appear on all printed Bilties, GR Consignment notes, and Challans for this organization.</p>

                  {/* Or upload a logo file — stored in object storage (MinIO/S3); the serve URL is filled in above */}
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    {formData.general.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData.general.logoUrl} alt="Logo preview" className="h-14 w-14 object-contain rounded-lg border border-[#E5EAEB] dark:border-slate-700 bg-white p-1" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg border border-dashed border-[#D9E2E3] dark:border-slate-700 flex items-center justify-center text-[#94A3B8] text-[10px] text-center">No logo</div>
                    )}
                    <label className={`inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 text-[#25776F] dark:text-teal-300 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-bold transition ${uploadingLogo ? "opacity-60 cursor-wait" : "cursor-pointer"}`}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        disabled={uploadingLogo}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            setErrorMessage("Logo image must be under 2 MB. Please upload a smaller file.");
                            e.target.value = "";
                            return;
                          }
                          try {
                            setUploadingLogo(true);
                            setErrorMessage(null);
                            const { logoUrl } = await configService.uploadLogo(file);
                            setFormData((prev) => ({ ...prev, general: { ...prev.general, logoUrl } }));
                          } catch (err) {
                            setErrorMessage(err instanceof Error ? err.message : "Failed to upload logo.");
                          } finally {
                            setUploadingLogo(false);
                            e.target.value = "";
                          }
                        }}
                      />
                      {uploadingLogo ? "Uploading…" : "Upload Logo"}
                    </label>
                    {formData.general.logoUrl && (
                      <button
                        type="button"
                        disabled={uploadingLogo}
                        onClick={async () => {
                          try {
                            setUploadingLogo(true);
                            await configService.deleteLogo();
                          } catch {
                            /* clear locally regardless of the server result */
                          } finally {
                            setFormData((prev) => ({ ...prev, general: { ...prev.general, logoUrl: "" } }));
                            setUploadingLogo(false);
                          }
                        }}
                        className="text-xs text-[#D95C5C] font-semibold hover:underline cursor-pointer disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Upload a PNG/JPG/SVG/WEBP (max 2 MB). The file is saved to object storage immediately and its URL is filled in above — click Save to persist the rest of your branding.</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Registered Headquarters Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.general.address}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, address: e.target.value } })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Bilty / GR Print Style
                  </label>
                  <select
                    value={formData.general.biltyPreset || "standard"}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, biltyPreset: e.target.value } })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15 cursor-pointer"
                  >
                    <option value="standard">Standard — spacious full-page copies</option>
                    <option value="dense">Dense — 3 copies per A4 (Rohtas-style)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">Standard prints one detailed copy per page (recommended for most). Dense fits three tightly-packed copies on one A4.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Bilty / GR Print Disclaimer
                  </label>
                  <textarea
                    rows={3}
                    value={formData.general.printDisclaimer || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, printDisclaimer: e.target.value } })
                    }
                    placeholder="All disputes subject to local jurisdiction. Goods carried at owner's risk. Not responsible for leakage, breakage or shortage. Freight payable as per terms. Received in good condition unless otherwise stated."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Printed at the bottom of every Bilty / GR copy. Leave blank to use the default terms.</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Locale & Currency Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Currency Symbol & Code
                  </label>
                  <select
                    value={formData.general.currencyCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const symbolMap: Record<string, string> = {
                        INR: "₹",
                        USD: "$",
                        EUR: "€",
                        GBP: "£",
                        AED: "AED",
                      };
                      setFormData({
                        ...formData,
                        general: {
                          ...formData.general,
                          currencyCode: code,
                          currencySymbol: symbolMap[code] || "₹",
                        },
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86]"
                  >
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="AED">AED (AED - UAE Dirham)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={formData.general.timeZone}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, timeZone: e.target.value } })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86]"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                    <option value="UTC">UTC (GMT +0:00)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Date Format
                  </label>
                  <select
                    value={formData.general.dateFormat}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, dateFormat: e.target.value } })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86]"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 24/09/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/24/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-24)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Live Preview */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#111827] dark:text-white uppercase tracking-wider">
                Live Branding Preview
              </h3>
              <div className="p-4 rounded-xl border border-[#E5EAEB] bg-[#F7F8F8] dark:bg-slate-850 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2F8E86] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {formData.general.companyName ? formData.general.companyName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "FP"}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#111827] dark:text-white">
                      {formData.general.companyName || "Company Name"}
                    </h4>
                    <p className="text-[11px] text-[#2F8E86] dark:text-teal-400">
                      {formData.general.legalName || "Legal Name"}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-[#64748B] dark:text-slate-400 space-y-1.5 pt-2 border-t border-[#E5EAEB] dark:border-slate-800">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#2F8E86] shrink-0" />
                    <span>{formData.general.supportEmail || "support@transport.com"}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#2F8E86] shrink-0" />
                    <span>{formData.general.supportPhone || "+91 98765 43210"}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2F8E86] shrink-0" />
                    <span>{formData.general.address || "Zero Mile, Pahari, Patna-7"}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data export (portability) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Data Export</h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mb-4">
            Download a JSON copy of your organization's core data (parties, vehicles, shipments, invoices, trips, challans, and more). Only your organization's data is included.
          </p>
          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 text-[#25776F] dark:text-teal-300 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-sm font-bold transition disabled:opacity-50 cursor-pointer"
          >
            {exporting ? "Preparing export…" : "Export Organization Data"}
          </button>
        </div>
        </>
      )}

      {/* TAB 2: BILLING, GST & TAX */}
      {activeTab === "billing" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            GST Compliance & Tax Rules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                GSTIN (15-digit GST Number)
              </label>
              <input
                type="text"
                placeholder="27AAAAA0000A1Z5"
                value={formData.billingAndTax.gstin}
                onChange={(e) =>
                  setFormData({ ...formData, billingAndTax: { ...formData.billingAndTax, gstin: e.target.value } })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                value={formData.billingAndTax.panNumber}
                onChange={(e) =>
                  setFormData({ ...formData, billingAndTax: { ...formData.billingAndTax, panNumber: e.target.value } })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                CGST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.billingAndTax.defaultCgstRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAndTax: { ...formData.billingAndTax, defaultCgstRate: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                SGST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.billingAndTax.defaultSgstRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAndTax: { ...formData.billingAndTax, defaultSgstRate: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                IGST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.billingAndTax.defaultIgstRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAndTax: { ...formData.billingAndTax, defaultIgstRate: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                e-Way Bill Mandatory Threshold (₹)
              </label>
              <input
                type="number"
                value={formData.billingAndTax.eWayBillThresholdAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAndTax: { ...formData.billingAndTax, eWayBillThresholdAmount: parseInt(e.target.value) || 50000 },
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENT SEQUENCES */}
      {activeTab === "sequences" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Document Numbering & Sequences</h2>
            <p className="text-xs text-slate-500">Configure prefixes, padding, and numbering for Invoices, Bilties (GR), and Challans</p>
          </div>

          <div className="space-y-4">
            {formData.documentSequences.map((seq, idx) => (
              <div
                key={seq.docType}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 grid grid-cols-1 md:grid-cols-5 gap-4 items-center"
              >
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{seq.docType}</span>
                  <p className="text-[11px] text-slate-400">Document Type</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prefix</label>
                  <input
                    type="text"
                    value={seq.prefix}
                    onChange={(e) => handleSequenceChange(idx, "prefix", e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#2F8E86]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Next Number</label>
                  <input
                    type="number"
                    value={seq.nextNumber}
                    onChange={(e) => handleSequenceChange(idx, "nextNumber", parseInt(e.target.value) || 1)}
                    className="w-full bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#2F8E86]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Padding Digits</label>
                  <input
                    type="number"
                    value={seq.paddingDigits}
                    onChange={(e) => handleSequenceChange(idx, "paddingDigits", parseInt(e.target.value) || 4)}
                    className="w-full bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#2F8E86]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sample Preview</label>
                  <span className="inline-block font-mono font-bold text-[#2F8E86] bg-[#E7F1F2] px-2.5 py-1 rounded border border-[#D9E2E3] text-xs">
                    {previewSequenceNumber(seq.prefix, seq.suffix, seq.paddingDigits, seq.nextNumber)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: OPERATIONAL RULES */}
      {activeTab === "workflows" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Operational Rules & Dispatch Workflows
          </h2>

          <div className="space-y-3">
            {[
              {
                key: "mandatoryDriverPhone",
                title: "Mandatory Driver Mobile Phone",
                desc: "Require valid driver 10-digit mobile number before creating vehicle challans",
              },
              {
                key: "mandatoryPodBeforeSettlement",
                title: "Mandatory Signed POD Before Trip Settlement",
                desc: "Enforce uploading verified proof of delivery before paying driver balance or closing trips",
              },
              {
                key: "mandatoryEWayBillForDispatch",
                title: "Enforce Valid e-Way Bill for Dispatch",
                desc: "Block lorry dispatch if total consignment value exceeds state threshold without e-Way Bill",
              },
              {
                key: "autoCloseCompletedTrips",
                title: "Auto-Close Completed Trips on Final Delivery",
                desc: "Automatically archive trip manifest when all associated bilties reach Delivered status",
              },
            ].map((rule) => {
              const isChecked = (formData.operationalWorkflows as any)[rule.key];
              return (
                <div
                  key={rule.key}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      operationalWorkflows: {
                        ...formData.operationalWorkflows,
                        [rule.key]: !isChecked,
                      },
                    })
                  }
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition ${
                    isChecked
                      ? "bg-[#E7F1F2]/40 border-[#2F8E86]/30 dark:bg-slate-850 dark:border-slate-700"
                      : "bg-white border-slate-200 dark:bg-slate-900"
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rule.title}</h4>
                    <p className="text-xs text-slate-500">{rule.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 accent-[#2F8E86] rounded cursor-pointer shrink-0"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTION & LIMITS — PLATFORM OPERATOR ONLY */}
      {activeTab === "modules" && isPlatformAdmin && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Subscription & Resource Quotas</h2>
              <p className="text-xs text-slate-500">Live usage metrics against allocated plan limits</p>
            </div>
            <span className="text-xs font-bold text-[#2F8E86] bg-[#E7F1F2] px-3 py-1 rounded-lg border border-[#D9E2E3]">
              Plan: {subscription?.planName || "Enterprise"} ({subscription?.planTier || "Enterprise"})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-[#F7F8F8] dark:bg-slate-850 border border-[#E5EAEB] dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Vehicles Quota</span>
              <h3 className="text-2xl font-black text-[#2F8E86] dark:text-teal-400">
                {subscription?.currentVehicles || 8} / {subscription?.maxVehicles || 25}
              </h3>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#2F8E86] h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((subscription?.currentVehicles || 8) / (subscription?.maxVehicles || 25)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F8F8] dark:bg-slate-850 border border-[#E5EAEB] dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Active Users</span>
              <h3 className="text-2xl font-black text-[#2F8E86] dark:text-teal-400">
                {subscription?.currentUsers || 3} / {subscription?.maxUsers || 10}
              </h3>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#2F8E86] h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((subscription?.currentUsers || 3) / (subscription?.maxUsers || 10)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#F7F8F8] dark:bg-slate-850 border border-[#E5EAEB] dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Monthly Shipments</span>
              <h3 className="text-2xl font-black text-[#2F8E86] dark:text-teal-400">
                {subscription?.currentMonthlyShipments || 120} / {subscription?.maxMonthlyShipments || 1000}
              </h3>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#2F8E86] h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((subscription?.currentMonthlyShipments || 120) / (subscription?.maxMonthlyShipments || 1000)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INTEGRATIONS & API */}
      {activeTab === "integrations" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            External Integrations & Webhooks
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                GPS Tracking Provider
              </label>
              <select
                value={formData.integrations.gpsProvider}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    integrations: {
                      ...formData.integrations,
                      gpsProvider: e.target.value as "None" | "Custom" | "TrackSolid" | "WheelsEye",
                    },
                  })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#2F8E86]"
              >
                <option value="None">None (Disabled)</option>
                <option value="WheelsEye">WheelsEye GPS</option>
                <option value="TrackSolid">TrackSolid Telematics</option>
                <option value="Custom">Custom GPS Webhook</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Outbound Event Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://your-api.com/webhooks/tms"
                value={formData.integrations.webhookUrl}
                onChange={(e) =>
                  setFormData({ ...formData, integrations: { ...formData.integrations, webhookUrl: e.target.value } })
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-[#2F8E86]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
