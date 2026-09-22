"use client";

import React, { useState, useEffect } from "react";
import {
  tenantService,
  TenantAdminListItem,
  TenantOnboardingPayload,
} from "../../../../services/tenantService";
import {
  TenantMenuEntitlements,
  ReportEntitlementItem,
} from "../../../../services/navigationService";
import {
  PackageIcon,
  TruckIcon,
  BarChartIcon,
  SettingsIcon,
  PlusIcon,
  SearchIcon,
  CheckIcon,
  LockIcon,
} from "@/app/components/ui/Icons";
import { PagePermissionGuard } from "@/app/components/ui/PagePermissionGuard";

export default function ClientsManagementPage() {
  const [clients, setClients] = useState<TenantAdminListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Onboarding Modal State
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardStep, setOnboardStep] = useState<1 | 2 | 3>(1);
  const [onboardForm, setOnboardForm] = useState<TenantOnboardingPayload>({
    organizationName: "",
    organizationCode: "",
    adminUsername: "",
    adminPassword: "",
    adminFullName: "",
    adminMobile: "",
    planTier: "Starter",
    enabledModules: [
      "dashboard",
      "gr",
      "gr.list",
      "gr.entry",
      "challan",
      "challan.list",
      "challan.entry",
      "system",
      "system.settings",
    ],
    enabledReportKeys: [],
  });
  const [submittingOnboard, setSubmittingOnboard] = useState(false);

  // Module Entitlement Drawer/Modal State
  const [selectedClient, setSelectedClient] =
    useState<TenantAdminListItem | null>(null);
  const [clientEntitlements, setClientEntitlements] =
    useState<TenantMenuEntitlements | null>(null);
  const [loadingEntitlements, setLoadingEntitlements] = useState(false);
  const [savingEntitlements, setSavingEntitlements] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await tenantService.getAllTenants();
      setClients(data);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (
    client: TenantAdminListItem,
    newStatus: boolean
  ) => {
    try {
      await tenantService.updateStatus(client.id, newStatus);
      showToast(
        "success",
        `${client.name} status updated to ${newStatus ? "Active" : "Inactive"}.`
      );
      loadClients();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update status.");
    }
  };

  const handleOpenEntitlements = async (client: TenantAdminListItem) => {
    setSelectedClient(client);
    try {
      setLoadingEntitlements(true);
      const entitlements = await tenantService.getEntitlements(client.id);
      setClientEntitlements(entitlements);
    } catch (err: any) {
      showToast("error", "Failed to load entitlements for this client.");
    } finally {
      setLoadingEntitlements(false);
    }
  };

  const handleSaveEntitlements = async () => {
    if (!selectedClient || !clientEntitlements) return;
    try {
      setSavingEntitlements(true);
      await tenantService.updateEntitlements(
        selectedClient.id,
        clientEntitlements
      );
      showToast(
        "success",
        `Module permissions updated successfully for ${selectedClient.name}!`
      );
      setSelectedClient(null);
      setClientEntitlements(null);
      loadClients();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update entitlements.");
    } finally {
      setSavingEntitlements(false);
    }
  };

  const applyPresetToClient = (presetType: "starter" | "tax_reports" | "enterprise") => {
    if (!clientEntitlements) return;

    if (presetType === "starter") {
      setClientEntitlements({
        ...clientEntitlements,
        enabledMenuKeys: [
          "dashboard",
          "gr",
          "gr.list",
          "gr.entry",
          "challan",
          "challan.list",
          "challan.entry",
          "system",
          "system.settings",
        ],
        reports: clientEntitlements.reports.map((r) => ({
          ...r,
          isEnabled: false,
        })),
      });
      showToast("success", "Applied: Bill-Making Only Preset");
    } else if (presetType === "tax_reports") {
      setClientEntitlements({
        ...clientEntitlements,
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
        reports: clientEntitlements.reports.map((r) => ({
          ...r,
          isEnabled:
            r.reportKey === "tax_summary" || r.reportKey === "party_outstanding",
        })),
      });
      showToast("success", "Applied: Billing + Tax Reports Preset");
    } else if (presetType === "enterprise") {
      setClientEntitlements({
        ...clientEntitlements,
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
        reports: clientEntitlements.reports.map((r) => ({
          ...r,
          isEnabled: true,
        })),
      });
      showToast("success", "Applied: Full Enterprise Preset");
    }
  };

  const toggleClientMenuKey = (key: string) => {
    if (!clientEntitlements) return;
    const current = new Set(clientEntitlements.enabledMenuKeys);
    if (current.has(key)) {
      current.delete(key);
    } else {
      current.add(key);
    }
    setClientEntitlements({
      ...clientEntitlements,
      enabledMenuKeys: Array.from(current),
    });
  };

  const toggleClientReport = (reportKey: string) => {
    if (!clientEntitlements) return;
    const updated = clientEntitlements.reports.map((r) =>
      r.reportKey === reportKey ? { ...r, isEnabled: !r.isEnabled } : r
    );

    // If at least one report is enabled, ensure 'reports' menu key is present
    const hasAnyReport = updated.some((r) => r.isEnabled);
    const keys = new Set(clientEntitlements.enabledMenuKeys);
    if (hasAnyReport) {
      keys.add("reports");
    } else {
      keys.delete("reports");
    }

    setClientEntitlements({
      ...clientEntitlements,
      enabledMenuKeys: Array.from(keys),
      reports: updated,
    });
  };

  // Onboarding Helpers
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingOnboard(true);
      const res = await tenantService.onboardTenant(onboardForm);
      if (res.success) {
        showToast(
          "success",
          `Client "${onboardForm.organizationName}" onboarded successfully with initial admin "${onboardForm.adminUsername}"!`
        );
        setShowOnboardModal(false);
        setOnboardStep(1);
        setOnboardForm({
          organizationName: "",
          organizationCode: "",
          adminUsername: "",
          adminPassword: "",
          adminFullName: "",
          adminMobile: "",
          planTier: "Starter",
          enabledModules: [
            "dashboard",
            "gr",
            "gr.list",
            "gr.entry",
            "challan",
            "challan.list",
            "challan.entry",
            "system",
            "system.settings",
          ],
          enabledReportKeys: [],
        });
        loadClients();
      } else {
        showToast("error", res.message || "Failed to onboard client.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Error during client onboarding.");
    } finally {
      setSubmittingOnboard(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.adminUsername &&
        c.adminUsername.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier =
      tierFilter === "all" ||
      c.subscriptionPlanTier.toLowerCase() === tierFilter.toLowerCase();

    return matchesSearch && matchesTier;
  });

  const totalMRR = clients.reduce(
    (acc, c) => (c.isActive ? acc + (c.monthlyPrice || 0) : acc),
    0
  );

  return (
    <PagePermissionGuard
      permission="saas.tenants.manage"
      moduleName="Client Management & SaaS Onboarding"
    >
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border transition-all duration-300 ${
            notification.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-300 border-rose-500/40"
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <PackageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                SaaS Client Management & Provisioning
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Onboard transport companies, monetize subscription tiers, and control feature access per client
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setOnboardStep(1);
            setShowOnboardModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Onboard New Client</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Total Clients
          </span>
          <div className="text-3xl font-bold text-white mt-1">
            {clients.length}
          </div>
          <span className="text-emerald-400 text-xs mt-2 block">
            {clients.filter((c) => c.isActive).length} active organizations
          </span>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Active Subscriptions MRR
          </span>
          <div className="text-3xl font-bold text-indigo-400 mt-1">
            ₹{totalMRR.toLocaleString("en-IN")}
            <span className="text-sm text-slate-400 font-normal"> / mo</span>
          </div>
          <span className="text-slate-400 text-xs mt-2 block">
            Recurring platform revenue
          </span>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Starter Pack (Billing Only)
          </span>
          <div className="text-3xl font-bold text-amber-400 mt-1">
            {
              clients.filter(
                (c) =>
                  c.subscriptionPlanTier.toLowerCase() === "starter" ||
                  c.enabledReportsCount === 0
              ).length
            }
          </div>
          <span className="text-slate-400 text-xs mt-2 block">
            Client A model (GR & Challans)
          </span>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Advanced / Reporting Enabled
          </span>
          <div className="text-3xl font-bold text-purple-400 mt-1">
            {clients.filter((c) => c.enabledReportsCount > 0).length}
          </div>
          <span className="text-slate-400 text-xs mt-2 block">
            Client B & C models (Reports & Tax)
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company, code, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Filter Tier:</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Tiers</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Clients Directory Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="py-4 px-5">Organization & Code</th>
                <th className="py-4 px-5">Primary Admin</th>
                <th className="py-4 px-5">Subscription Plan</th>
                <th className="py-4 px-5">Subscribed Modules & Reports</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading clients directory...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No clients found matching your query.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const hasReports = client.enabledReportsCount > 0;
                  const isStarterOnly = !hasReports;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold text-white">
                          {client.name}
                        </div>
                        <div className="text-xs text-indigo-400 font-mono">
                          {client.code}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="text-slate-200">
                          {client.adminFullName || client.adminUsername || "—"}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          @{client.adminUsername || "unassigned"}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            client.subscriptionPlanTier.toLowerCase() ===
                            "enterprise"
                              ? "bg-purple-950/80 text-purple-300 border border-purple-500/40"
                              : client.subscriptionPlanTier.toLowerCase() ===
                                "professional"
                              ? "bg-indigo-950/80 text-indigo-300 border border-indigo-500/40"
                              : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          {client.subscriptionPlanTier} (₹
                          {client.monthlyPrice}/mo)
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs rounded-md">
                            GR & Challan
                          </span>
                          {hasReports ? (
                            <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs rounded-md flex items-center gap-1">
                              <BarChartIcon className="w-3 h-3" />
                              Reports ({client.enabledReportsCount})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-md flex items-center gap-1">
                              <LockIcon className="w-3 h-3" />
                              No Reports
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <button
                          onClick={() =>
                            handleToggleStatus(client, !client.isActive)
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            client.isActive
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              client.isActive ? "bg-emerald-400" : "bg-rose-400"
                            }`}
                          />
                          {client.isActive ? "Active" : "Suspended"}
                        </button>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleOpenEntitlements(client)}
                          className="px-3.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          Provision Modules
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Module Entitlements Drawer / Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                    {selectedClient.code}
                  </span>
                  <h2 className="text-xl font-bold text-white">
                    {selectedClient.name} — Module Entitlements
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Control exact modules and sub-reports enabled for user{" "}
                  <strong className="text-slate-200">
                    @{selectedClient.adminUsername}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setClientEntitlements(null);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingEntitlements || !clientEntitlements ? (
                <div className="py-12 text-center text-slate-400">
                  Loading client entitlements...
                </div>
              ) : (
                <>
                  {/* 1-Click Presets */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      1-Click Onboarding Presets
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => applyPresetToClient("starter")}
                        className="px-3 py-2 bg-slate-900 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 rounded-lg text-xs font-medium text-amber-300 text-left transition-colors"
                      >
                        <div className="font-bold">Client A: Bill Making</div>
                        <div className="text-[11px] text-slate-400">
                          GR + Challans only
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPresetToClient("tax_reports")}
                        className="px-3 py-2 bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 rounded-lg text-xs font-medium text-indigo-300 text-left transition-colors"
                      >
                        <div className="font-bold">Client B: Tax Reports</div>
                        <div className="text-[11px] text-slate-400">
                          Billing + GST & Ledger
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPresetToClient("enterprise")}
                        className="px-3 py-2 bg-slate-900 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 rounded-lg text-xs font-medium text-purple-300 text-left transition-colors"
                      >
                        <div className="font-bold">Enterprise Suite</div>
                        <div className="text-[11px] text-slate-400">
                          All modules & 5 reports
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Core Modules Toggles */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">
                      Core Operations Modules
                    </h3>
                    <div className="space-y-2.5">
                      {/* GR Module */}
                      <div className="p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white text-sm">
                            Module A: Goods Receipt (GR) & Consignments
                          </div>
                          <div className="text-xs text-slate-400">
                            Create GR, Print Bilty, View Consignment Register
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={clientEntitlements.enabledMenuKeys.includes("gr")}
                          onChange={() => toggleClientMenuKey("gr")}
                          className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                        />
                      </div>

                      {/* Challan Module */}
                      <div className="p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white text-sm">
                            Module A: Loading Challan & Dispatch
                          </div>
                          <div className="text-xs text-slate-400">
                            Create Challan, Lorry Hire contracts, Dispatch list
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={clientEntitlements.enabledMenuKeys.includes(
                            "challan"
                          )}
                          onChange={() => toggleClientMenuKey("challan")}
                          className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reporting & Granular Sub-Reports */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">
                        Reporting & Analytics Module (Granular Sub-Reports)
                      </h3>
                      <span className="text-xs text-indigo-400 font-mono">
                        {
                          clientEntitlements.reports.filter((r) => r.isEnabled)
                            .length
                        }{" "}
                        / {clientEntitlements.reports.length} enabled
                      </span>
                    </div>

                    <div className="space-y-2">
                      {clientEntitlements.reports.map((rep) => (
                        <div
                          key={rep.reportKey}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                            rep.isEnabled
                              ? "bg-indigo-950/30 border-indigo-500/40 text-slate-200"
                              : "bg-slate-950/30 border-slate-800 text-slate-400 opacity-70"
                          }`}
                        >
                          <div>
                            <div className="font-medium text-sm text-white">
                              {rep.title}
                            </div>
                            <div className="text-xs text-slate-400">
                              {rep.description}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={rep.isEnabled}
                            onChange={() => toggleClientReport(rep.reportKey)}
                            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/40">
              <button
                type="button"
                onClick={() => {
                  setSelectedClient(null);
                  setClientEntitlements(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEntitlements}
                disabled={savingEntitlements || loadingEntitlements}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingEntitlements ? "Saving Changes..." : "Save Entitlements"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Client Wizard Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Onboard Transport Client
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Step {onboardStep} of 3:{" "}
                  {onboardStep === 1
                    ? "Organization Profile"
                    : onboardStep === 2
                    ? "Admin User Credentials"
                    : "Subscription & Module Package"}
                </p>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Step Content */}
            <form onSubmit={handleOnboardSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {onboardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Transport Organization Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nitesh Logistics Pvt Ltd"
                        value={onboardForm.organizationName}
                        onChange={(e) =>
                          setOnboardForm({
                            ...onboardForm,
                            organizationName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Organization Code (Unique) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. NITESH-LOG"
                        value={onboardForm.organizationCode}
                        onChange={(e) =>
                          setOnboardForm({
                            ...onboardForm,
                            organizationCode: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono uppercase text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Contact Mobile / Phone
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={onboardForm.adminMobile}
                        onChange={(e) =>
                          setOnboardForm({
                            ...onboardForm,
                            adminMobile: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {onboardStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Client Administrator Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nitesh Sharma"
                        value={onboardForm.adminFullName}
                        onChange={(e) =>
                          setOnboardForm({
                            ...onboardForm,
                            adminFullName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Login Username *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nitesh"
                        value={onboardForm.adminUsername}
                        onChange={(e) =>
                          setOnboardForm({
                            ...onboardForm,
                            adminUsername: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Initial Login Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="e.g. Nitesh123"
                        value={onboardForm.adminPassword}
                        onChange={(e) =>
                          setOnboardForm({
                            ...onboardForm,
                            adminPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {onboardStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Select Subscription Plan
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {["Starter", "Professional", "Enterprise"].map((tier) => (
                          <div
                            key={tier}
                            onClick={() =>
                              setOnboardForm({
                                ...onboardForm,
                                planTier: tier,
                                enabledReportKeys:
                                  tier === "Starter"
                                    ? []
                                    : tier === "Professional"
                                    ? ["tax_summary", "party_outstanding"]
                                    : [
                                        "booking_register",
                                        "tax_summary",
                                        "party_outstanding",
                                        "trip_profitability",
                                        "vendor_payables",
                                      ],
                              })
                            }
                            className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                              onboardForm.planTier === tier
                                ? "bg-indigo-950/60 border-indigo-500 text-white font-bold"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <div className="text-sm">{tier}</div>
                            <div className="text-xs text-indigo-400 mt-1">
                              {tier === "Starter"
                                ? "₹999/mo"
                                : tier === "Professional"
                                ? "₹3,999/mo"
                                : "₹9,999/mo"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Subscribed Reports Pack
                      </label>
                      <div className="space-y-2">
                        {[
                          { key: "booking_register", label: "Consignment Booking Register" },
                          { key: "tax_summary", label: "GST & Tax Summary Report" },
                          { key: "party_outstanding", label: "Customer Outstanding Ledger" },
                          { key: "trip_profitability", label: "Trip Profitability & P&L" },
                          { key: "vendor_payables", label: "Vendor & Lorry Payables" },
                        ].map((rep) => {
                          const isChecked =
                            onboardForm.enabledReportKeys?.includes(rep.key) ||
                            false;
                          return (
                            <label
                              key={rep.key}
                              className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer text-xs ${
                                isChecked
                                  ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-200"
                                  : "bg-slate-950 border-slate-800 text-slate-400"
                              }`}
                            >
                              <span>{rep.label}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const current = new Set(
                                    onboardForm.enabledReportKeys || []
                                  );
                                  if (current.has(rep.key)) {
                                    current.delete(rep.key);
                                  } else {
                                    current.add(rep.key);
                                  }
                                  setOnboardForm({
                                    ...onboardForm,
                                    enabledReportKeys: Array.from(current),
                                  });
                                }}
                                className="w-4 h-4 accent-indigo-600 rounded"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Footer */}
              <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
                {onboardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOnboardStep((prev) => (prev - 1) as 1 | 2 | 3)
                    }
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {onboardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onboardStep === 1) {
                        if (
                          !onboardForm.organizationName ||
                          !onboardForm.organizationCode
                        ) {
                          showToast(
                            "error",
                            "Please enter organization name and code."
                          );
                          return;
                        }
                      } else if (onboardStep === 2) {
                        if (
                          !onboardForm.adminUsername ||
                          !onboardForm.adminPassword ||
                          !onboardForm.adminFullName
                        ) {
                          showToast(
                            "error",
                            "Please complete admin credentials."
                          );
                          return;
                        }
                      }
                      setOnboardStep((prev) => (prev + 1) as 1 | 2 | 3);
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submittingOnboard}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingOnboard
                      ? "Onboarding Client..."
                      : "Complete Client Onboarding"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </PagePermissionGuard>
  );
}
