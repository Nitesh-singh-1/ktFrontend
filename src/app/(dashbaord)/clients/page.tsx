"use client";

import React, { useState, useEffect } from "react";
import {
  tenantService,
  TenantAdminListItem,
  TenantOnboardingPayload,
  TenantUser,
  SystemRoleTemplate,
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
import { X } from "lucide-react";
import { PagePermissionGuard } from "@/app/components/ui/PagePermissionGuard";
import ManagePlanModal from "@/app/components/platform/ManagePlanModal";
import { sanitizeMobile, validateMobile } from "@/utils/validation";
import { sweetAlert } from "@/utils/sweetAlert";

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

  // TASK-046 Phase 1 — role picker + module checkboxes for the admin wizard.
  const [systemRoles, setSystemRoles] = useState<SystemRoleTemplate[]>([]);
  const ALL_MODULE_CODES: { code: string; label: string }[] = [
    { code: "dashboard", label: "Dashboard" },
    { code: "bilty", label: "Bilty / Consignments" },
    { code: "pod", label: "Proof of Delivery" },
    { code: "trips", label: "Trips & Manifests" },
    { code: "billing", label: "Billing & Invoicing" },
    { code: "master_data", label: "Master Data" },
    { code: "reports", label: "Reports" },
    { code: "vendors", label: "Vendors & Lorry Hire" },
    { code: "claims", label: "Claims" },
    { code: "quotations", label: "Quotations" },
    { code: "tracking", label: "Live Tracking" },
    { code: "analytics", label: "Analytics" },
    { code: "trip_settlement", label: "Trip Settlement" },
    { code: "delivery_settlement", label: "Delivery Settlement" },
    { code: "system", label: "System" },
  ];
  const PLAN_DEFAULT_MODULES: Record<string, string[]> = {
    Starter: ["dashboard", "bilty", "reports"],
    Professional: ["dashboard", "bilty", "pod", "billing", "reports"],
    Enterprise: ALL_MODULE_CODES.map((m) => m.code),
  };

  // Module Entitlement Drawer/Modal State
  const [selectedClient, setSelectedClient] =
    useState<TenantAdminListItem | null>(null);
  const [clientEntitlements, setClientEntitlements] =
    useState<TenantMenuEntitlements | null>(null);
  const [loadingEntitlements, setLoadingEntitlements] = useState(false);
  const [savingEntitlements, setSavingEntitlements] = useState(false);

  // Tenant Users / Set Admin Modal State
  const [usersClient, setUsersClient] = useState<TenantAdminListItem | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  // Manage Plan (TASK-009) — per-tenant usage + change subscription tier.
  const [planClient, setPlanClient] = useState<TenantAdminListItem | null>(null);

  useEffect(() => {
    loadClients();
    // TASK-046 Phase 1: fetch system role templates once on page mount.
    tenantService
      .getSystemRoleTemplates()
      .then((rows) => setSystemRoles(rows || []))
      .catch(() => setSystemRoles([]));
  }, []);

  const handleOpenUsers = async (client: TenantAdminListItem) => {
    setUsersClient(client);
    setTenantUsers([]);
    setLoadingUsers(true);
    try {
      const users = await tenantService.getTenantUsers(client.id);
      setTenantUsers(users);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSetUserRole = async (userId: number, makeAdmin: boolean) => {
    if (!usersClient) return;
    setUpdatingUserId(userId);
    try {
      const res = await tenantService.setTenantUserRole(usersClient.id, userId, makeAdmin ? "admin" : "SUB_USER");
      showToast("success", res.message || "Role updated.");
      const users = await tenantService.getTenantUsers(usersClient.id);
      setTenantUsers(users);
      loadClients();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update role.");
    } finally {
      setUpdatingUserId(null);
    }
  };

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
          "bilty",
          "consignments",
          "trips",
          "reports",
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
          "bilty",
          "consignments",
          "trips",
          "billing",
          "reports",
          "system",
          "system.settings",
        ],
        reports: clientEntitlements.reports.map((r) => ({
          ...r,
          isEnabled:
            r.reportKey === "tax_summary" || r.reportKey === "party_outstanding" || r.reportKey === "booking_register",
        })),
      });
      showToast("success", "Applied: Billing + Tax Reports Preset");
    } else if (presetType === "enterprise") {
      setClientEntitlements({
        ...clientEntitlements,
        enabledMenuKeys: [
          ...ALL_MODULE_CODES.map((m) => m.code),
          "consignments",
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
    const canonicalKey = key === "gr" ? "bilty" : key === "challan" ? "trips" : key;
    const aliases = canonicalKey === "bilty" ? ["bilty", "consignments", "gr"] : canonicalKey === "trips" ? ["trips", "challan"] : [canonicalKey];
    const isCurrentlyEnabled = aliases.some((a) => current.has(a));

    if (isCurrentlyEnabled) {
      aliases.forEach((a) => current.delete(a));
    } else {
      current.add(canonicalKey);
      if (canonicalKey === "bilty") {
        current.add("consignments");
      }
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

    // Defense in depth: re-validate everything at final submit, not just when the user
    // clicked "Next Step" — covers the case where a value became invalid after a step
    // was already passed (e.g. browser back/forward, or state edited some other way).
    const mobileErr = validateMobile(onboardForm.adminMobile || "", "Contact mobile");
    if (mobileErr) {
      await sweetAlert.error("Invalid mobile number", mobileErr);
      setOnboardStep(1);
      return;
    }
    if (!onboardForm.adminPassword || onboardForm.adminPassword.length < 6) {
      await sweetAlert.error("Password too short", "Initial password must be at least 6 characters long.");
      setOnboardStep(2);
      return;
    }

    try {
      setSubmittingOnboard(true);
      // TASK-046 Phase 1: platform admin uses the new /api/admin/tenants path
      // that respects adminRoleCode + explicit enabledModuleCodes. Fall back to
      // the public endpoint if the admin-only one 403s (not expected here).
      const adminPayload: TenantOnboardingPayload = {
        ...onboardForm,
        adminRoleCode: onboardForm.adminRoleCode || "admin",
        enabledModuleCodes:
          onboardForm.enabledModuleCodes && onboardForm.enabledModuleCodes.length > 0
            ? onboardForm.enabledModuleCodes
            : PLAN_DEFAULT_MODULES[onboardForm.planTier || "Starter"] || [],
      };
      const res = await tenantService.onboardTenantByAdmin(adminPayload);
      if (res.success) {
        await sweetAlert.success(
          "Client onboarded",
          `"${onboardForm.organizationName}" is live with initial admin "${onboardForm.adminUsername}".`
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
        await sweetAlert.error("Onboarding failed", res.message || "Failed to onboard client.");
      }
    } catch (err: any) {
      // err.message now carries the unpacked field-level validation message when the
      // backend rejected a value (see baseservice.ts extractValidationMessage), instead
      // of the generic "One or more validation errors occurred."
      await sweetAlert.error("Onboarding failed", err.message || "Error during client onboarding.");
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
      permission="saas.tenants.manage.view"
      moduleName="Client Management & SaaS Onboarding"
      platformOnly
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border transition-all duration-300 ${
              notification.type === "success"
                ? "bg-[#E8F6F4] text-[#2F9E8F] border-[#C2E9E3]"
                : "bg-[#FDF2F2] text-[#D95C5C] border-[#F8B4B4]"
            }`}
          >
            <span className="text-xs font-bold">{notification.message}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5EAEB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F1F2] flex items-center justify-center text-[#2F8E86] font-bold text-lg shadow-xs">
              <PackageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111827] tracking-tight">
                SaaS Client Management & Provisioning
              </h1>
              <p className="text-[#64748B] text-xs mt-0.5">
                Onboard transport companies, monetize subscription tiers, and control feature access per client
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setOnboardStep(1);
              setShowOnboardModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Onboard New Client</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-[#E5EAEB] rounded-xl shadow-xs">
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider">
              Total Clients
            </span>
            <div className="text-2xl font-bold text-[#111827] mt-1">
              {clients.length}
            </div>
            <span className="text-[#2F9E8F] text-xs mt-1 block font-medium">
              {clients.filter((c) => c.isActive).length} active organizations
            </span>
          </div>

          <div className="p-4 bg-white border border-[#E5EAEB] rounded-xl shadow-xs">
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider">
              Active Subscriptions MRR
            </span>
            <div className="text-2xl font-bold text-[#2F8E86] font-mono mt-1">
              ₹{totalMRR.toLocaleString("en-IN")}
              <span className="text-xs text-[#64748B] font-normal"> / mo</span>
            </div>
            <span className="text-[#64748B] text-xs mt-1 block">
              Recurring platform revenue
            </span>
          </div>

          <div className="p-4 bg-white border border-[#E5EAEB] rounded-xl shadow-xs">
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider">
              Starter Pack (Billing Only)
            </span>
            <div className="text-2xl font-bold text-[#F4A261] mt-1">
              {
                clients.filter(
                  (c) =>
                    c.subscriptionPlanTier.toLowerCase() === "starter" ||
                    c.enabledReportsCount === 0
                ).length
              }
            </div>
            <span className="text-[#64748B] text-xs mt-1 block">
              Client A model (GR & Challans)
            </span>
          </div>

          <div className="p-4 bg-white border border-[#E5EAEB] rounded-xl shadow-xs">
            <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider">
              Advanced / Reporting Enabled
            </span>
            <div className="text-2xl font-bold text-[#4A90E2] mt-1">
              {clients.filter((c) => c.enabledReportsCount > 0).length}
            </div>
            <span className="text-[#64748B] text-xs mt-1 block">
              Client B & C models (Reports & Tax)
            </span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-[#E5EAEB] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by company, code, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:border-[#2F8E86] focus:outline-none focus:ring-1 focus:ring-[#2F8E86]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#64748B]">Filter Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:border-[#2F8E86]"
            >
              <option value="all">All Tiers</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Clients Directory Table */}
        <div className="bg-white border border-[#E5EAEB] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Organization & Code</th>
                  <th className="py-3 px-4">Primary Admin</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4">Subscribed Modules & Reports</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAEB]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#64748B]">
                      Loading clients directory...
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#64748B]">
                      No clients found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const hasReports = client.enabledReportsCount > 0;

                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-[#F5FAFA] transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#111827]">
                            {client.name}
                          </div>
                          <div className="text-[10px] text-[#2F8E86] font-mono">
                            {client.code}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#111827]">
                            {client.adminFullName || client.adminUsername || "—"}
                          </div>
                          <div className="text-[10px] text-[#64748B] font-mono">
                            @{client.adminUsername || "unassigned"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              client.subscriptionPlanTier.toLowerCase() ===
                              "enterprise"
                                ? "bg-[#EFF6FF] text-[#4A90E2] border-[#BFDBFE]"
                                : client.subscriptionPlanTier.toLowerCase() ===
                                  "professional"
                                ? "bg-[#E7F1F2] text-[#25776F] border-[#D9E2E3]"
                                : "bg-[#FEF6EE] text-[#F4A261] border-[#FBD38D]"
                            }`}
                          >
                            {client.subscriptionPlanTier} (₹
                            {client.monthlyPrice}/mo)
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-[#E8F6F4] border border-[#C2E9E3] text-[#2F9E8F] text-[10px] font-semibold rounded-md">
                              GR & Challan
                            </span>
                            {hasReports ? (
                              <span className="px-2 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#4A90E2] text-[10px] font-semibold rounded-md flex items-center gap-1">
                                <BarChartIcon className="w-3 h-3" />
                                Reports ({client.enabledReportsCount})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#F7F8F8] border border-[#E5EAEB] text-[#94A3B8] text-[10px] rounded-md flex items-center gap-1">
                                <LockIcon className="w-3 h-3" />
                                No Reports
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() =>
                              handleToggleStatus(client, !client.isActive)
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors border ${
                              client.isActive
                                ? "bg-[#E8F6F4] text-[#2F9E8F] border-[#C2E9E3] hover:bg-[#D5EFEA]"
                                : "bg-[#FDF2F2] text-[#D95C5C] border-[#F8B4B4] hover:bg-[#FCE8E8]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                client.isActive ? "bg-[#2F9E8F]" : "bg-[#D95C5C]"
                              }`}
                            />
                            {client.isActive ? "Active" : "Suspended"}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setPlanClient(client)}
                              className="px-2.5 py-1 bg-white hover:bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] font-bold rounded-lg text-xs transition cursor-pointer"
                            >
                              Manage Plan
                            </button>
                            <button
                              onClick={() => handleOpenUsers(client)}
                              className="px-2.5 py-1 bg-white hover:bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] font-bold rounded-lg text-xs transition cursor-pointer"
                            >
                              Manage Users
                            </button>
                            <button
                              onClick={() => handleOpenEntitlements(client)}
                              className="px-2.5 py-1 bg-white hover:bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] font-bold rounded-lg text-xs transition cursor-pointer"
                            >
                              Provision Modules
                            </button>
                          </div>
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
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5EAEB] w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-[#E5EAEB] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] font-mono font-bold">
                      {selectedClient.code}
                    </span>
                    <h2 className="text-lg font-bold text-[#111827]">
                      {selectedClient.name} — Module Entitlements
                    </h2>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Control exact modules and sub-reports enabled for user{" "}
                    <strong className="text-[#111827]">
                      @{selectedClient.adminUsername}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setClientEntitlements(null);
                  }}
                  className="text-[#94A3B8] hover:text-[#111827] p-1.5 rounded-lg hover:bg-[#F7F8F8] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {loadingEntitlements || !clientEntitlements ? (
                  <div className="py-12 text-center text-[#64748B]">
                    Loading client entitlements...
                  </div>
                ) : (
                  <>
                    {/* 1-Click Presets */}
                    <div className="p-4 bg-[#F7F8F8] border border-[#E5EAEB] rounded-xl">
                      <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
                        1-Click Onboarding Presets
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => applyPresetToClient("starter")}
                          className="px-3 py-2 bg-white hover:bg-[#FEF6EE] border border-[#E5EAEB] hover:border-[#FBD38D] rounded-lg text-xs font-medium text-[#F4A261] text-left transition-colors cursor-pointer"
                        >
                          <div className="font-bold text-[#111827]">Client A: Bill Making</div>
                          <div className="text-[11px] text-[#64748B]">
                            GR + Challans only
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => applyPresetToClient("tax_reports")}
                          className="px-3 py-2 bg-white hover:bg-[#EFF6FF] border border-[#E5EAEB] hover:border-[#BFDBFE] rounded-lg text-xs font-medium text-[#4A90E2] text-left transition-colors cursor-pointer"
                        >
                          <div className="font-bold text-[#111827]">Client B: Tax Reports</div>
                          <div className="text-[11px] text-[#64748B]">
                            Billing + GST & Ledger
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => applyPresetToClient("enterprise")}
                          className="px-3 py-2 bg-white hover:bg-[#E7F1F2] border border-[#E5EAEB] hover:border-[#D9E2E3] rounded-lg text-xs font-medium text-[#2F8E86] text-left transition-colors cursor-pointer"
                        >
                          <div className="font-bold text-[#111827]">Enterprise Suite</div>
                          <div className="text-[11px] text-[#64748B]">
                            All modules & 5 reports
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Core Modules Toggles */}
                    <div>
                      <h3 className="text-sm font-semibold text-[#111827] mb-3">
                        Subscribed Functional Modules
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {ALL_MODULE_CODES.filter((m) => m.code !== "dashboard" && m.code !== "system").map((mod) => {
                          const isChecked =
                            clientEntitlements.enabledMenuKeys.includes(mod.code) ||
                            (mod.code === "bilty" && (clientEntitlements.enabledMenuKeys.includes("consignments") || clientEntitlements.enabledMenuKeys.includes("gr"))) ||
                            (mod.code === "trips" && clientEntitlements.enabledMenuKeys.includes("challan"));
                          return (
                            <div
                              key={mod.code}
                              className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                                isChecked
                                  ? "bg-[#E7F1F2]/60 border-[#D9E2E3] text-[#111827]"
                                  : "bg-[#F7F8F8] border-[#E5EAEB] text-[#94A3B8]"
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-xs text-[#111827]">
                                  {mod.label}
                                </div>
                                <div className="text-[11px] text-[#64748B]">
                                  Code: {mod.code}
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleClientMenuKey(mod.code)}
                                className="w-4 h-4 accent-[#2F8E86] rounded cursor-pointer"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reporting & Granular Sub-Reports */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-[#111827]">
                          Reporting & Analytics Module (Granular Sub-Reports)
                        </h3>
                        <span className="text-xs text-[#2F8E86] font-mono font-bold">
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
                                ? "bg-[#E7F1F2]/60 border-[#D9E2E3] text-[#111827]"
                                : "bg-[#F7F8F8] border-[#E5EAEB] text-[#94A3B8] opacity-75"
                            }`}
                          >
                            <div>
                              <div className="font-medium text-sm text-[#111827]">
                                {rep.title}
                              </div>
                              <div className="text-xs text-[#64748B]">
                                {rep.description}
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={rep.isEnabled}
                              onChange={() => toggleClientReport(rep.reportKey)}
                              className="w-5 h-5 accent-[#2F8E86] rounded cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#E5EAEB] flex items-center justify-end gap-3 bg-[#F7F8F8]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientEntitlements(null);
                  }}
                  className="px-4 py-2 bg-white hover:bg-[#E7F1F2] text-[#64748B] text-xs font-bold rounded-xl border border-[#D9E2E3] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEntitlements}
                  disabled={savingEntitlements || loadingEntitlements}
                  className="px-5 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingEntitlements ? "Saving Changes..." : "Save Entitlements"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onboard New Client Wizard Modal */}
        {showOnboardModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5EAEB] w-full max-w-xl rounded-2xl shadow-xl flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-[#E5EAEB] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">
                    Onboard Transport Client
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
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
                  className="text-[#94A3B8] hover:text-[#111827] p-1.5 rounded-lg hover:bg-[#F7F8F8] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Content */}
              <form onSubmit={handleOnboardSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                  {onboardStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-1.5">
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
                          className="w-full px-3.5 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:border-[#2F8E86] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-1.5">
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
                          className="w-full px-3.5 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-mono uppercase text-[#111827] placeholder:text-[#94A3B8] focus:border-[#2F8E86] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-1.5">
                          Contact Mobile / Phone (10 Digits)
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={onboardForm.adminMobile}
                          onChange={(e) =>
                            setOnboardForm({
                              ...onboardForm,
                              adminMobile: sanitizeMobile(e.target.value),
                            })
                          }
                          className="w-full px-3.5 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-mono font-medium text-[#111827] placeholder:text-[#94A3B8] focus:border-[#2F8E86] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {onboardStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-1.5">
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
                          className="w-full px-3.5 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:border-[#2F8E86] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-1.5">
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
                          className="w-full px-3.5 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:border-[#2F8E86] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-1.5">
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
                          className="w-full px-3.5 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:border-[#2F8E86] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {onboardStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-2">
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
                                  // TASK-046 Phase 1: pre-select the plan's default modules on tier change.
                                  enabledModuleCodes: PLAN_DEFAULT_MODULES[tier] || [],
                                })
                              }
                              className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                                onboardForm.planTier === tier
                                  ? "bg-[#E7F1F2] border-[#2F8E86] text-[#25776F] font-bold"
                                  : "bg-[#F7F8F8] border-[#E5EAEB] text-[#64748B] hover:border-[#D9E2E3]"
                              }`}
                            >
                              <div className="text-sm font-bold">{tier}</div>
                              <div className="text-xs text-[#2F8E86] mt-1 font-semibold">
                                {tier === "Starter"
                                  ? "₹999/mo"
                                  : tier === "Professional"
                                  ? "₹2,999/mo"
                                  : "₹9,999/mo"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TASK-046 Phase 1 — Admin role picker */}
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-2">
                          Admin User's Role
                        </label>
                        <select
                          value={onboardForm.adminRoleCode || "admin"}
                          onChange={(e) =>
                            setOnboardForm({
                              ...onboardForm,
                              adminRoleCode: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] focus:border-[#2F8E86] focus:outline-none"
                        >
                          {(systemRoles.length > 0
                            ? systemRoles
                            : [{ code: "admin", name: "Administrator", description: "" }]
                          ).map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.name} ({r.code})
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-[11px] text-[#64748B]">
                          Platform admin may pick any seeded system role. Default is "admin".
                        </p>
                      </div>

                      {/* TASK-046 Phase 1 — Module checkboxes (writes tenant_modules). */}
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-2">
                          Enabled Modules
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {ALL_MODULE_CODES.map((mod) => {
                            const current = new Set(
                              onboardForm.enabledModuleCodes ||
                                PLAN_DEFAULT_MODULES[onboardForm.planTier || "Starter"] ||
                                []
                            );
                            const isChecked = current.has(mod.code);
                            return (
                              <label
                                key={mod.code}
                                className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer text-xs ${
                                  isChecked
                                    ? "bg-[#E7F1F2]/60 border-[#D9E2E3] text-[#25776F] font-semibold"
                                    : "bg-[#F7F8F8] border-[#E5EAEB] text-[#64748B]"
                                }`}
                              >
                                <span>{mod.label}</span>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const next = new Set(current);
                                    if (next.has(mod.code)) next.delete(mod.code);
                                    else next.add(mod.code);
                                    setOnboardForm({
                                      ...onboardForm,
                                      enabledModuleCodes: Array.from(next),
                                    });
                                  }}
                                  className="w-4 h-4 accent-[#2F8E86] rounded"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-2">
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
                                    ? "bg-[#E7F1F2]/60 border-[#D9E2E3] text-[#25776F] font-semibold"
                                    : "bg-[#F7F8F8] border-[#E5EAEB] text-[#64748B]"
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
                                  className="w-4 h-4 accent-[#2F8E86] rounded"
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
                <div className="p-4 border-t border-[#E5EAEB] flex items-center justify-between bg-[#F7F8F8]">
                  {onboardStep > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOnboardStep((prev) => (prev - 1) as 1 | 2 | 3)
                      }
                      className="px-4 py-2 bg-white hover:bg-[#E7F1F2] text-[#64748B] text-xs font-bold rounded-xl border border-[#D9E2E3] transition-colors cursor-pointer"
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
                            sweetAlert.warning(
                              "Missing details",
                              "Please enter organization name and code."
                            );
                            return;
                          }
                          const mobileErr = validateMobile(onboardForm.adminMobile || "", "Contact mobile");
                          if (mobileErr) {
                            sweetAlert.error("Invalid mobile number", mobileErr);
                            return;
                          }
                        } else if (onboardStep === 2) {
                          if (
                            !onboardForm.adminUsername ||
                            !onboardForm.adminPassword ||
                            !onboardForm.adminFullName
                          ) {
                            sweetAlert.warning(
                              "Missing details",
                              "Please complete admin credentials."
                            );
                            return;
                          }
                          if (onboardForm.adminPassword.length < 6) {
                            sweetAlert.error(
                              "Password too short",
                              "Initial password must be at least 6 characters long."
                            );
                            return;
                          }
                        }
                        setOnboardStep((prev) => (prev + 1) as 1 | 2 | 3);
                      }}
                      className="px-5 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Next Step →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submittingOnboard}
                      className="px-6 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
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

        {/* Manage Users / Set Admin Modal */}
        {usersClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-[#111827] dark:text-white">Users — {usersClient.name}</h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">Assign or repair this organization's administrator.</p>
                </div>
                <button
                  onClick={() => setUsersClient(null)}
                  className="p-1.5 rounded-lg hover:bg-[#F7F8F8] dark:hover:bg-slate-800 text-[#64748B] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {loadingUsers ? (
                  <div className="text-center text-sm text-[#64748B] py-8">Loading users…</div>
                ) : tenantUsers.length === 0 ? (
                  <div className="text-center text-sm text-[#64748B] py-8">No users found for this organization.</div>
                ) : (
                  <div className="space-y-2">
                    {!tenantUsers.some((u) => u.isAdmin) && (
                      <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                        This organization has no administrator. Promote a user below so they can manage it.
                      </div>
                    )}
                    {tenantUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-[#E5EAEB] dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#111827] dark:text-white truncate">{u.fullName || u.username}</span>
                            {u.isAdmin ? (
                              <span className="px-2 py-0.5 bg-[#E8F6F4] text-[#2F9E8F] border border-[#C2E9E3] text-[10px] font-bold rounded-md">Admin</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#F7F8F8] text-[#64748B] border border-[#E5EAEB] text-[10px] font-bold rounded-md">Standard User</span>
                            )}
                            {!u.isActive && (
                              <span className="px-2 py-0.5 bg-red-50 text-[#D95C5C] border border-red-200 text-[10px] font-bold rounded-md">Inactive</span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                            @{u.username}{u.mobile ? ` · ${u.mobile}` : ""}{u.email ? ` · ${u.email}` : ""}
                          </div>
                        </div>
                        <button
                          disabled={updatingUserId === u.id}
                          onClick={() => handleSetUserRole(u.id, !u.isAdmin)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                            u.isAdmin
                              ? "bg-white hover:bg-red-50 text-[#D95C5C] border border-[#F8B4B4]"
                              : "bg-[#2F8E86] hover:bg-[#25776F] text-white"
                          }`}
                        >
                          {updatingUserId === u.id ? "Saving…" : u.isAdmin ? "Demote to User" : "Make Admin"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manage Plan Modal (TASK-009) */}
        <ManagePlanModal
          isOpen={!!planClient}
          client={planClient}
          onClose={() => setPlanClient(null)}
          onSaved={loadClients}
        />
      </div>
    </PagePermissionGuard>
  );
}
