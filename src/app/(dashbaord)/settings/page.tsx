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
  TenantMenuEntitlements,
  TenantListItem,
} from "../../../../services/navigationService";
import { useTenantConfig } from "@/context/TenantConfigContext";
import { useNavigation } from "@/context/NavigationContext";
import { previewSequenceNumber } from "@/utils/configFormatter";

type TabKey = "general" | "menu_entitlements" | "billing" | "sequences" | "workflows" | "modules" | "integrations";

export default function SettingsPage() {
  const { config: globalConfig, updateConfig: updateGlobalConfig, refreshConfig } = useTenantConfig();
  const { refreshNavigation } = useNavigation();

  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  
  // Client selection for Multi-Tenant Entitlements
  const [tenantsList, setTenantsList] = useState<TenantListItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const [menuEntitlements, setMenuEntitlements] = useState<TenantMenuEntitlements>({
    tenantId: "",
    enabledMenuKeys: [
      "dashboard",
      "gr",
      "gr.list",
      "gr.entry",
      "challan",
      "challan.list",
      "challan.entry",
      "reports",
      "system",
      "system.settings",
    ],
    reports: [
      { reportKey: "booking_register", title: "Consignment Booking Register", description: "All booked goods receipts log", category: "Operational", path: "/reports?tab=booking_register", isEnabled: true },
      { reportKey: "tax_summary", title: "GST & Tax Summary Report", description: "Taxable amounts, CGST, SGST, IGST, RCM", category: "Financial", path: "/reports?tab=tax_summary", isEnabled: true },
      { reportKey: "party_outstanding", title: "Customer Outstanding Ledger", description: "Receivables, billed vs settled balance", category: "Financial", path: "/reports?tab=party_outstanding", isEnabled: true },
      { reportKey: "trip_profitability", title: "Trip Profitability & P&L", description: "Trip revenue vs diesel, toll, expense margin", category: "Operational", path: "/reports?tab=trip_profitability", isEnabled: true },
      { reportKey: "vendor_payables", title: "Vendor & Lorry Hire Payables", description: "Vehicle hiring dues and advances", category: "Financial", path: "/reports?tab=vendor_payables", isEnabled: true },
    ],
  });

  // Local form state
  const [formData, setFormData] = useState<TenantConfiguration>({
    tenantId: "",
    general: {
      companyName: "K-Transport Logistics",
      legalName: "K-Transport Logistics Private Limited",
      supportEmail: "support@ktransport.com",
      supportPhone: "+91 98765 43210",
      logoUrl: "",
      faviconUrl: "",
      themeColor: "#4f46e5",
      currencyCode: "INR",
      currencySymbol: "₹",
      timeZone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12h",
      address: "123 Logistics Park, Transport Nagar",
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

  // Load configuration, tenants, and subscription data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const [cfgRes, subRes, menuRes, tenantsRes] = await Promise.allSettled([
          configService.getConfiguration(),
          configService.getSubscription(),
          navigationService.getMenuEntitlements(),
          navigationService.getAllTenants(),
        ]);

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

        if (menuRes.status === "fulfilled" && menuRes.value) {
          setMenuEntitlements(menuRes.value);
          if (menuRes.value.tenantId) {
            setSelectedTenantId(menuRes.value.tenantId);
          }
        }

        if (tenantsRes.status === "fulfilled" && tenantsRes.value && tenantsRes.value.length > 0) {
          setTenantsList(tenantsRes.value);
        }
      } catch (err: any) {
        console.error("Error loading configuration:", err);
        setErrorMessage(err?.message || "Failed to load configuration");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [globalConfig]);

  // Handle tenant switch to edit another client's entitlements
  const handleTenantSelect = async (tenantId: string) => {
    setSelectedTenantId(tenantId);
    try {
      setLoading(true);
      const res = await navigationService.getMenuEntitlementsForTenant(tenantId);
      setMenuEntitlements(res);
    } catch (err: any) {
      console.error("Error fetching entitlements for tenant:", err);
    } finally {
      setLoading(false);
    }
  };

  // Preset Template 1: Client A (Bill Making Only, No Reports)
  const applyClientAPreset = () => {
    setMenuEntitlements({
      ...menuEntitlements,
      enabledMenuKeys: ["dashboard", "gr", "gr.list", "gr.entry", "challan", "challan.list", "challan.entry", "system"],
      reports: menuEntitlements.reports.map((r) => ({ ...r, isEnabled: false })),
    });
  };

  // Preset Template 2: Client B (Bill Making + Selected Reports: Tax Summary & Customer Outstanding)
  const applyClientBPreset = () => {
    setMenuEntitlements({
      ...menuEntitlements,
      enabledMenuKeys: [
        "dashboard",
        "gr",
        "gr.list",
        "gr.entry",
        "challan",
        "challan.list",
        "challan.entry",
        "reports",
        "system",
      ],
      reports: menuEntitlements.reports.map((r) => ({
        ...r,
        isEnabled: r.reportKey === "tax_summary" || r.reportKey === "party_outstanding" || r.reportKey === "booking_register",
      })),
    });
  };

  // Preset Template 3: Full Enterprise Suite (All modules & all reports)
  const applyFullEnterprisePreset = () => {
    setMenuEntitlements({
      ...menuEntitlements,
      enabledMenuKeys: [
        "dashboard",
        "gr",
        "gr.list",
        "gr.entry",
        "challan",
        "challan.list",
        "challan.entry",
        "reports",
        "system",
        "system.settings",
      ],
      reports: menuEntitlements.reports.map((r) => ({ ...r, isEnabled: true })),
    });
  };

  // Handle saving configuration
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      const targetTenantId = selectedTenantId || formData.tenantId;

      const [updatedConfig, updatedEntitlements] = await Promise.all([
        updateGlobalConfig(formData),
        selectedTenantId
          ? navigationService.updateMenuEntitlementsForTenant(targetTenantId, menuEntitlements)
          : navigationService.updateMenuEntitlements(menuEntitlements),
      ]);

      setFormData((prev) => ({ ...prev, ...updatedConfig }));
      setMenuEntitlements(updatedEntitlements);
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
    if (!confirm("Are you sure you want to reset all tenant settings to system defaults?")) return;

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

  // Sequence change helper
  const handleSequenceChange = (index: number, field: keyof DocumentSequence, value: any) => {
    const updated = [...formData.documentSequences];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, documentSequences: updated }));
  };

  // Menu entitlement toggle helper
  const toggleMenuKey = (key: string) => {
    const exists = menuEntitlements.enabledMenuKeys.includes(key);
    const updatedKeys = exists
      ? menuEntitlements.enabledMenuKeys.filter((k) => k !== key)
      : [...menuEntitlements.enabledMenuKeys, key];
    setMenuEntitlements({ ...menuEntitlements, enabledMenuKeys: updatedKeys });
  };

  // Report item toggle helper
  const toggleReportItem = (reportKey: string) => {
    const updatedReports = menuEntitlements.reports.map((r) =>
      r.reportKey === reportKey ? { ...r, isEnabled: !r.isEnabled } : r
    );
    setMenuEntitlements({ ...menuEntitlements, reports: updatedReports });
  };

  const themeColors = [
    { label: "Indigo Royal", value: "#4f46e5" },
    { label: "Electric Blue", value: "#2563eb" },
    { label: "Emerald Green", value: "#059669" },
    { label: "Violet Purple", value: "#7c3aed" },
    { label: "Crimson Amber", value: "#ea580c" },
    { label: "Rose Pink", value: "#e11d48" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Loading SaaS Configuration & Menu Manifest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl">
            ⚙️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">SaaS Configuration & Permission Engine</h1>
            <p className="text-sm text-slate-400">
              Manage dynamic multi-client branding, tax policies, document sequences, menu entitlements, and reports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all font-medium cursor-pointer"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center gap-3 animate-fade-in">
          <span className="text-lg">✓</span>
          <span className="text-sm font-medium">
            Configuration & Menu Entitlements saved successfully! Client navigation and permissions are live.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 flex items-center gap-3">
          <span className="text-lg">⚠</span>
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2 scrollbar-none">
        {[
          { id: "general", label: "General & Branding", icon: "🏢" },
          { id: "menu_entitlements", label: "Menu & Permissions Matrix", icon: "🛡️" },
          { id: "billing", label: "Billing, GST & Tax", icon: "🧾" },
          { id: "sequences", label: "Document Sequences", icon: "🔢" },
          { id: "workflows", label: "Operational Rules", icon: "⚡" },
          { id: "modules", label: "Modules & Plan Tier", icon: "💎" },
          { id: "integrations", label: "Integrations & API", icon: "🔌" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabKey)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-lg shadow-indigo-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB: MENU & PERMISSIONS ENTITLEMENTS MATRIX */}
      {activeTab === "menu_entitlements" && (
        <div className="space-y-6">
          {/* Client Selector & 1-Click Provisioning Presets Bar */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Multi-Client Entitlement Manager
                </span>
                <h3 className="text-lg font-bold text-white">Select Client Organization to Configure</h3>
                <p className="text-xs text-slate-400">
                  Switch between Client A, Client B, or your default tenant to turn features on/off per client.
                </p>
              </div>

              {/* Client Selector Dropdown */}
              <div className="w-full md:w-72">
                <select
                  value={selectedTenantId}
                  onChange={(e) => handleTenantSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-4 py-2.5 text-white text-sm font-semibold focus:outline-none focus:border-indigo-400"
                >
                  {tenantsList.length > 0 ? (
                    tenantsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        🏢 {t.name} ({t.code})
                      </option>
                    ))
                  ) : (
                    <option value={selectedTenantId || "default"}>🏢 Default Organization (Active)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Quick 1-Click Provisioning Templates */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">1-Click Client Presets:</span>
              <button
                type="button"
                onClick={applyClientAPreset}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-amber-500/30 cursor-pointer transition-all hover:scale-105"
              >
                📦 Client A: Bill Making Only (No Reports)
              </button>
              <button
                type="button"
                onClick={applyClientBPreset}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 border border-emerald-500/30 cursor-pointer transition-all hover:scale-105"
              >
                📊 Client B: Billing + Tax Reports
              </button>
              <button
                type="button"
                onClick={applyFullEnterprisePreset}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 border border-indigo-500/30 cursor-pointer transition-all hover:scale-105"
              >
                👑 Full Enterprise Suite
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 1: Navigation Menus & Pages */}
            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Menu Navigation & Page Modules</h2>
                  <p className="text-xs text-slate-400">Toggle top-level menu groups and sub-routes for this client</p>
                </div>
                <span className="text-xs font-bold text-indigo-400">
                  {menuEntitlements.enabledMenuKeys.length} Active
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: "dashboard", title: "Dashboard Home", desc: "Overview cards and live metric charts", icon: "🏠" },
                  { key: "gr", title: "GR / Consignment Module", desc: "Top-level GR menu group", icon: "📦" },
                  { key: "gr.list", title: "↳ View Bills & GR List", desc: "Search and filter booked goods receipts", icon: "📄" },
                  { key: "gr.entry", title: "↳ New GR / Consignment Entry", desc: "Create and print new consignment notes", icon: "➕" },
                  { key: "challan", title: "Challan / Dispatch Module", desc: "Top-level Truck Challan menu group", icon: "🚚" },
                  { key: "challan.list", title: "↳ View Challans List", desc: "Search and inspect truck loading memos", icon: "📋" },
                  { key: "challan.entry", title: "↳ New Challan Entry", desc: "Create vehicle loading memos and dispatches", icon: "➕" },
                  { key: "reports", title: "Reports & Analytics Module", desc: "Reports hub and data analytics", icon: "📊" },
                  { key: "system", title: "System & Administration", desc: "User security and settings", icon: "⚙️" },
                  { key: "system.settings", title: "↳ SaaS Settings & Rules", desc: "Company configuration and rules page", icon: "🛠️" },
                ].map((item) => {
                  const isChecked = menuEntitlements.enabledMenuKeys.includes(item.key);
                  const isSubItem = item.key.includes(".");

                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleMenuKey(item.key)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSubItem ? "ml-5" : ""
                      } ${
                        isChecked
                          ? "bg-slate-950/70 border-indigo-500/40 text-white shadow-sm"
                          : "bg-slate-950/20 border-slate-800/40 text-slate-500 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{item.icon}</span>
                        <div>
                          <h4 className="text-xs font-semibold">{item.title}</h4>
                          <p className="text-[11px] text-slate-400">{item.desc}</p>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by parent div
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Individual Sub-Report Entitlements */}
            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Granular Report Entitlements</h2>
                  <p className="text-xs text-slate-400">
                    Assign or revoke specific individual sub-reports for this client
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  {menuEntitlements.reports.filter((r) => r.isEnabled).length} / {menuEntitlements.reports.length} Active
                </span>
              </div>

              <div className="space-y-3">
                {menuEntitlements.reports.map((report) => (
                  <div
                    key={report.reportKey}
                    onClick={() => toggleReportItem(report.reportKey)}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                      report.isEnabled
                        ? "bg-slate-950/70 border-emerald-500/40 shadow-sm"
                        : "bg-slate-950/20 border-slate-800/40 opacity-50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{report.title}</h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {report.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{report.description}</p>
                      <span className="inline-block font-mono text-[10px] text-indigo-400">
                        Route: {report.path}
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={report.isEnabled}
                      onChange={() => {}} // Handled by parent div
                      className="w-5 h-5 accent-emerald-500 rounded mt-1 shrink-0 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: GENERAL & BRANDING */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-3">Company Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Company Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.general.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, companyName: e.target.value } })
                    }
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Legal Registered Name
                  </label>
                  <input
                    type="text"
                    value={formData.general.legalName}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, legalName: e.target.value } })
                    }
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Support Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.general.supportEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, supportEmail: e.target.value } })
                    }
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Support Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.general.supportPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, supportPhone: e.target.value } })
                    }
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Registered Headquarters Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.general.address}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, address: e.target.value } })
                    }
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-3">Locale, Currency & Formatting</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
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
                        AED: "د.إ",
                        GBP: "£",
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
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="AED">AED (د.إ - UAE Dirham)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Date Format
                  </label>
                  <select
                    value={formData.general.dateFormat}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, dateFormat: e.target.value } })
                    }
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 22/09/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/22/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-22)</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 22-09-2026)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Timezone
                  </label>
                  <select
                    value={formData.general.timeZone}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, timeZone: e.target.value } })
                    }
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC (GMT +0:00)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (BST)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Branding Preview Card */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
              <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-3">Brand Theme & Identity</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Brand Theme Color
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl border-2 border-white/20 shadow-md shrink-0 transition-transform"
                    style={{ backgroundColor: formData.general.themeColor }}
                  ></div>
                  <input
                    type="text"
                    value={formData.general.themeColor}
                    onChange={(e) =>
                      setFormData({ ...formData, general: { ...formData.general, themeColor: e.target.value } })
                    }
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {themeColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, general: { ...formData.general, themeColor: color.value } })
                      }
                      className="w-7 h-7 rounded-lg transition-transform hover:scale-110 cursor-pointer border border-white/10"
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Logo Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={formData.general.logoUrl || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, general: { ...formData.general, logoUrl: e.target.value } })
                  }
                  className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Live Card Preview */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Live SaaS Card Preview
                </label>
                <div
                  className="p-5 rounded-xl border border-white/10 shadow-xl space-y-3 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${formData.general.themeColor}22 0%, #0f172a 100%)`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-md text-sm"
                      style={{ backgroundColor: formData.general.themeColor }}
                    >
                      KT
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{formData.general.companyName || "Company Name"}</h4>
                      <p className="text-xs text-slate-400">Multi-Tenant SaaS Node</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 flex justify-between pt-2 border-t border-slate-800">
                    <span>Currency: {formData.general.currencySymbol} ({formData.general.currencyCode})</span>
                    <span>Date: {formData.general.dateFormat}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BILLING, GST & TAX */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-semibold text-white">GST & Tax Compliance</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.billingAndTax.isGstEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingAndTax: { ...formData.billingAndTax, isGstEnabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Company GSTIN
                </label>
                <input
                  type="text"
                  placeholder="27ABCDE1234F1Z5"
                  value={formData.billingAndTax.gstin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingAndTax: { ...formData.billingAndTax, gstin: e.target.value.toUpperCase() },
                    })
                  }
                  className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm uppercase font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Company PAN Number
                </label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={formData.billingAndTax.panNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingAndTax: { ...formData.billingAndTax, panNumber: e.target.value.toUpperCase() },
                    })
                  }
                  className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm uppercase font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Default GST Tax Slabs (%)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">CGST (%)</label>
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
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">SGST (%)</label>
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
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">IGST (%)</label>
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
                    className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                E-Way Bill Mandatory Threshold ({formData.general.currencySymbol})
              </label>
              <input
                type="number"
                value={formData.billingAndTax.eWayBillThresholdAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingAndTax: {
                      ...formData.billingAndTax,
                      eWayBillThresholdAmount: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-1">E-Way bill number is prompted when shipment value exceeds this limit.</p>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-3">
              Withholding Tax & Reverse Charge (RCM)
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-medium text-white">Reverse Charge Mechanism (RCM)</h4>
                  <p className="text-xs text-slate-400">Default to GST payable by consignee/recipient under RCM</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.billingAndTax.enableRcm}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingAndTax: { ...formData.billingAndTax, enableRcm: e.target.checked },
                    })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded"
                />
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-white">Tax Deducted at Source (TDS)</h4>
                    <p className="text-xs text-slate-400">Auto calculate TDS for contract vendors/lorry hire</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.billingAndTax.isTdsEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingAndTax: { ...formData.billingAndTax, isTdsEnabled: e.target.checked },
                      })
                    }
                    className="w-5 h-5 accent-indigo-600 rounded"
                  />
                </div>
                {formData.billingAndTax.isTdsEnabled && (
                  <div className="pt-2">
                    <label className="block text-xs text-slate-400 mb-1">TDS Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.billingAndTax.tdsPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAndTax: { ...formData.billingAndTax, tdsPercentage: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-white">Tax Collected at Source (TCS)</h4>
                    <p className="text-xs text-slate-400">Auto apply TCS on invoice totals exceeding regulatory limits</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.billingAndTax.isTcsEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingAndTax: { ...formData.billingAndTax, isTcsEnabled: e.target.checked },
                      })
                    }
                    className="w-5 h-5 accent-indigo-600 rounded"
                  />
                </div>
                {formData.billingAndTax.isTcsEnabled && (
                  <div className="pt-2">
                    <label className="block text-xs text-slate-400 mb-1">TCS Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.billingAndTax.tcsPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingAndTax: { ...formData.billingAndTax, tcsPercentage: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENT AUTO-NUMBERING SEQUENCES */}
      {activeTab === "sequences" && (
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Document Auto-Numbering Patterns</h2>
              <p className="text-xs text-slate-400">
                Configure prefixes, zero-padding, and reset periods for transport vouchers and bills
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                  <th className="pb-3 px-3">Document Type</th>
                  <th className="pb-3 px-3">Prefix</th>
                  <th className="pb-3 px-3">Suffix</th>
                  <th className="pb-3 px-3">Padding</th>
                  <th className="pb-3 px-3">Next Number</th>
                  <th className="pb-3 px-3">Reset Period</th>
                  <th className="pb-3 px-3">Live Sample Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {formData.documentSequences.map((seq, index) => {
                  const samplePreview = previewSequenceNumber(
                    seq.prefix,
                    seq.suffix,
                    seq.paddingDigits,
                    seq.nextNumber
                  );

                  return (
                    <tr key={seq.docType} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-white">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs">
                          {seq.docType}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <input
                          type="text"
                          value={seq.prefix}
                          onChange={(e) => handleSequenceChange(index, "prefix", e.target.value.toUpperCase())}
                          className="w-24 bg-slate-950/70 border border-slate-700/70 rounded-lg px-2.5 py-1 text-white font-mono text-xs uppercase"
                        />
                      </td>

                      <td className="py-3.5 px-3">
                        <input
                          type="text"
                          placeholder="—"
                          value={seq.suffix}
                          onChange={(e) => handleSequenceChange(index, "suffix", e.target.value.toUpperCase())}
                          className="w-20 bg-slate-950/70 border border-slate-700/70 rounded-lg px-2.5 py-1 text-white font-mono text-xs uppercase"
                        />
                      </td>

                      <td className="py-3.5 px-3">
                        <select
                          value={seq.paddingDigits}
                          onChange={(e) =>
                            handleSequenceChange(index, "paddingDigits", parseInt(e.target.value) || 4)
                          }
                          className="bg-slate-950/70 border border-slate-700/70 rounded-lg px-2 py-1 text-white text-xs"
                        >
                          <option value="3">3 digits (001)</option>
                          <option value="4">4 digits (0001)</option>
                          <option value="5">5 digits (00001)</option>
                          <option value="6">6 digits (000001)</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-3">
                        <input
                          type="number"
                          value={seq.nextNumber}
                          onChange={(e) =>
                            handleSequenceChange(index, "nextNumber", parseInt(e.target.value) || 1)
                          }
                          className="w-24 bg-slate-950/70 border border-slate-700/70 rounded-lg px-2.5 py-1 text-white font-mono text-xs"
                        />
                      </td>

                      <td className="py-3.5 px-3">
                        <select
                          value={seq.resetPeriod}
                          onChange={(e) => handleSequenceChange(index, "resetPeriod", e.target.value)}
                          className="bg-slate-950/70 border border-slate-700/70 rounded-lg px-2 py-1 text-white text-xs"
                        >
                          <option value="Never">Continuous (Never)</option>
                          <option value="Yearly">Yearly (Financial)</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-950 text-emerald-400 border border-emerald-500/20 shadow-inner">
                          {samplePreview}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: OPERATIONAL RULES */}
      {activeTab === "workflows" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-3">Validation & Enforcements</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-medium text-white">Mandatory Driver Mobile Number</h4>
                  <p className="text-xs text-slate-400">Block trip dispatch without a valid 10-digit driver mobile</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.operationalWorkflows.mandatoryDriverPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operationalWorkflows: {
                        ...formData.operationalWorkflows,
                        mandatoryDriverPhone: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-medium text-white">Mandatory POD Upload for Settlement</h4>
                  <p className="text-xs text-slate-400">Require signed Proof-of-Delivery scan before settling invoices</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.operationalWorkflows.mandatoryPodBeforeSettlement}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operationalWorkflows: {
                        ...formData.operationalWorkflows,
                        mandatoryPodBeforeSettlement: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-medium text-white">Mandatory E-Way Bill on High Value</h4>
                  <p className="text-xs text-slate-400">Enforce valid E-Way Bill entry before printing challan</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.operationalWorkflows.mandatoryEWayBillForDispatch}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operationalWorkflows: {
                        ...formData.operationalWorkflows,
                        mandatoryEWayBillForDispatch: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-medium text-white">Auto-Close Completed Trips</h4>
                  <p className="text-xs text-slate-400">Mark trip Completed once all linked consignments are delivered</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.operationalWorkflows.autoCloseCompletedTrips}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operationalWorkflows: {
                        ...formData.operationalWorkflows,
                        autoCloseCompletedTrips: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-3">
              Tolerances & Detention Policies
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Allowable Weight Tolerance (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.operationalWorkflows.allowOverweightTolerancePercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operationalWorkflows: {
                        ...formData.operationalWorkflows,
                        allowOverweightTolerancePercentage: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Weight discrepancy threshold allowed at weighbridge before warning.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Free Detention Hours
                </label>
                <input
                  type="number"
                  value={formData.operationalWorkflows.maxDetentionFreeHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operationalWorkflows: {
                        ...formData.operationalWorkflows,
                        maxDetentionFreeHours: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Grace hours allowed at loading/unloading point before detention charge applies.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MODULES & SUBSCRIPTION PLAN */}
      {activeTab === "modules" && (
        <div className="space-y-6">
          {/* Subscription Tier Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-indigo-500/30 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
                  {subscription?.planTier || "Enterprise"} SaaS Plan
                </span>
                <h3 className="text-2xl font-bold text-white mt-2">
                  {subscription?.planName || "Enterprise Dedicated Fleet Tier"}
                </h3>
                <p className="text-sm text-slate-400">
                  Status: <span className="text-emerald-400 font-semibold">{subscription?.status || "Active"}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => alert("Contact support at support@ktransport.com to upgrade your enterprise subscription tier.")}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg cursor-pointer transition-all"
                >
                  Manage Subscription Tier
                </button>
              </div>
            </div>

            {/* Usage Meters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Vehicles Enrolled</span>
                  <span className="text-white font-bold">
                    {subscription?.currentVehicles ?? 0} / {subscription?.maxVehicles ?? 500}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (((subscription?.currentVehicles ?? 0) / (subscription?.maxVehicles || 1)) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Active Users</span>
                  <span className="text-white font-bold">
                    {subscription?.currentUsers ?? 0} / {subscription?.maxUsers ?? 100}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (((subscription?.currentUsers ?? 0) / (subscription?.maxUsers || 1)) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Monthly Shipments</span>
                  <span className="text-white font-bold">
                    {subscription?.currentMonthlyShipments ?? 0} / {subscription?.maxMonthlyShipments ?? 10000}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (((subscription?.currentMonthlyShipments ?? 0) /
                          (subscription?.maxMonthlyShipments || 1)) *
                          100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Module Toggles */}
          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-3">Active SaaS Feature Modules</h2>
            <p className="text-xs text-slate-400">
              Toggling modules on or off dynamically adjusts sidebar navigation and system endpoints for your tenant.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: "gstBilling", title: "GST Goods Receipts (GR)", desc: "Consignment notes with GST computation" },
                { key: "withoutGstBilling", title: "Non-GST / Direct Bills", desc: "Non-taxable goods receipts" },
                { key: "challanManagement", title: "Truck Challan & Dispatch", desc: "Vehicle loading and memo creation" },
                { key: "tripManagement", title: "Trips & Expense Tracking", desc: "Diesel, toll, driver advance tracking" },
                { key: "fleetManagement", title: "Fleet & Driver Registry", desc: "Vehicles, fitness, insurance tracking" },
                { key: "vehicleMaintenance", title: "Fleet Maintenance Logs", desc: "Service schedules and repairs" },
                { key: "cargoClaims", title: "Cargo Claim Management", desc: "Damage, shortage and loss settlement" },
                { key: "gpsTracking", title: "GPS & Live Telematics", desc: "Real-time fleet tracking integration" },
                { key: "reportsAndAnalytics", title: "Reports & Financials", desc: "Ledgers, GST summaries, and P&L" },
                { key: "freightRateCards", title: "Customer Rate Cards", desc: "Per-tonne / per-box contracted rates" },
                { key: "vendorManagement", title: "Vendor & Lorry Hire", desc: "Broker/transporter contract memos" },
                { key: "customerPortal", title: "Customer Self-Service", desc: "Consignor/consignee tracking portal" },
              ].map((mod) => (
                <div
                  key={mod.key}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-white">{mod.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{mod.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(formData.featureFlags as any)[mod.key] ?? false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        featureFlags: {
                          ...formData.featureFlags,
                          [mod.key]: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 accent-indigo-600 rounded mt-0.5 shrink-0 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INTEGRATIONS & API */}
      {activeTab === "integrations" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-3">Notification Gateways</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-medium text-white">WhatsApp Dispatch Alerts</h4>
                  <p className="text-xs text-slate-400">Send automated WhatsApp PDF bills to consignors on dispatch</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.integrations.whatsAppEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      integrations: { ...formData.integrations, whatsAppEnabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-medium text-white">SMS Notifications</h4>
                  <p className="text-xs text-slate-400">Send OTPs and status alerts via SMS gateway</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.integrations.smsEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      integrations: { ...formData.integrations, smsEnabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-medium text-white">FASTag Automated Toll Sync</h4>
                  <p className="text-xs text-slate-400">Auto-pull FASTag toll expense deductions into active trips</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.integrations.fastagEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      integrations: { ...formData.integrations, fastagEnabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-3">
              Telematics & Outgoing Webhooks
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  GPS Telematics Provider
                </label>
                <select
                  value={formData.integrations.gpsProvider}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      integrations: { ...formData.integrations, gpsProvider: e.target.value as any },
                    })
                  }
                  className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="None">None (Manual Trip Updates)</option>
                  <option value="WheelsEye">WheelsEye GPS API</option>
                  <option value="TrackSolid">TrackSolid Pro GPS</option>
                  <option value="Custom">Custom REST Telematics Provider</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Webhook Event Dispatcher URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-api.com/webhooks/ktransport"
                  value={formData.integrations.webhookUrl || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      integrations: { ...formData.integrations, webhookUrl: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950/70 border border-slate-700/70 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  POST payload will be emitted whenever bills, challans, or trip status updates occur.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
