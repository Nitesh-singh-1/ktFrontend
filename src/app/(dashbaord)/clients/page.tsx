"use client";

import React, { useState, useEffect } from "react";
import {
  tenantService,
  TenantAdminListItem,
  TenantOnboardingPayload,
  TenantUser,
  SystemRoleTemplate,
  ModuleWithPages,
  TenantEntitlements,
  UpdateTenantEntitlements,
  TenantSummary,
  TenantDetail,
} from "../../../../services/tenantService";
import { navigationService } from "../../../../services/navigationService";
import { planService, Plan } from "../../../../services/planService";
import {
  ALL_MODULE_CODES,
  ALL_MODULE_CODE_LIST,
  PRESET_MODULE_CODES,
} from "@/app/config/moduleCatalog";
import {
  PackageIcon,
  BarChartIcon,
  PlusIcon,
  SearchIcon,
  LockIcon,
} from "@/app/components/ui/Icons";
import {
  X,
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  Layers,
  Info,
  Building2,
} from "lucide-react";
import { PagePermissionGuard } from "@/app/components/ui/PagePermissionGuard";
import ManagePlanModal from "@/app/components/platform/ManagePlanModal";
import { sanitizeMobile, validateMobile } from "@/utils/validation";
import { sweetAlert } from "@/utils/sweetAlert";

// TASK-054 — offline/first-render fallback catalog (no pages). The authoritative
// module + page catalog is fetched live from tenantService.getCatalog().
const FALLBACK_CATALOG: ModuleWithPages[] = ALL_MODULE_CODES.map((m, i) => ({
  code: m.code,
  name: m.label,
  isPremium: false,
  displayOrder: i,
  pages: [],
}));

type TopView = "directory" | "console";

export default function ClientsManagementPage() {
  const [topView, setTopView] = useState<TopView>("directory");

  const [clients, setClients] = useState<TenantAdminListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [loadBanner, setLoadBanner] = useState<string | null>(null);
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
    enabledModules: ["dashboard", "bilty", "trips", "system"],
    enabledReportKeys: [],
  });
  const [submittingOnboard, setSubmittingOnboard] = useState(false);

  const [systemRoles, setSystemRoles] = useState<SystemRoleTemplate[]>([]);
  const PLAN_DEFAULT_MODULES: Record<string, string[]> = {
    Starter: ["dashboard", "bilty", "reports"],
    Professional: ["dashboard", "bilty", "pod", "billing", "reports"],
    Enterprise: ALL_MODULE_CODE_LIST,
  };

  // Module Entitlement Drawer State
  const [selectedClient, setSelectedClient] =
    useState<TenantAdminListItem | null>(null);
  const [clientEntitlements, setClientEntitlements] =
    useState<TenantEntitlements | null>(null);
  // TASK-054 — canonical module codes the tenant is entitled to (the ceiling).
  const [moduleCodes, setModuleCodes] = useState<Set<string>>(new Set());
  // TASK-054 — per-module set of CHECKED page keys. A module whose checked set
  // equals its full page list = NO restriction (omitted from the save payload);
  // a proper subset → pageRestrictions[code] = [checkedPageKeys].
  const [pageSelections, setPageSelections] = useState<Record<string, Set<string>>>({});
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loadingEntitlements, setLoadingEntitlements] = useState(false);
  const [savingEntitlements, setSavingEntitlements] = useState(false);
  const [assigningPlan, setAssigningPlan] = useState(false);

  // TASK-054 — live module + page catalog (GET /admin/catalog). Offline fallback
  // keeps the module checklist populated (no pages) if the fetch fails.
  const [catalog, setCatalog] = useState<ModuleWithPages[]>(FALLBACK_CATALOG);
  // TASK-054 §C — plan catalog for the Plan dropdown (tier strings).
  const [plans, setPlans] = useState<Plan[]>([]);

  // Tenant Users / Set Admin Modal State (legacy promote/demote helper)
  const [usersClient, setUsersClient] = useState<TenantAdminListItem | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  // Manage Plan Modal
  const [planClient, setPlanClient] = useState<TenantAdminListItem | null>(null);

  // TASK-054 §G — platform tenant console ("trace every tenant").
  const [tenantSummaries, setTenantSummaries] = useState<TenantSummary[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [tenantsLoaded, setTenantsLoaded] = useState(false);
  const [detailTenant, setDetailTenant] = useState<TenantDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [userRoleEdits, setUserRoleEdits] = useState<Record<string, Set<string>>>({});
  const [savingRolesUserId, setSavingRolesUserId] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
    // System role templates for the onboarding wizard.
    tenantService
      .getSystemRoleTemplates()
      .then((rows) => setSystemRoles(rows || []))
      .catch(() => setSystemRoles([]));
    // Live module + page catalog + plan catalog, loaded resiliently.
    Promise.allSettled([tenantService.getCatalog(), planService.getPlans()]).then(
      ([catRes, planRes]) => {
        if (catRes.status === "fulfilled" && catRes.value && catRes.value.length > 0) {
          setCatalog(catRes.value);
        } else {
          setLoadBanner(
            "Live module catalog unavailable — showing the offline module list (page-level restriction disabled)."
          );
        }
        if (planRes.status === "fulfilled" && planRes.value) {
          setPlans(planRes.value);
        }
      }
    );
  }, []);

  // Lazy-load the tenant console the first time it is opened.
  useEffect(() => {
    if (topView === "console" && !tenantsLoaded) {
      loadTenantSummaries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topView]);

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

  // ── Tenant console ────────────────────────────────────────────────────────
  const loadTenantSummaries = async () => {
    try {
      setLoadingTenants(true);
      const rows = await tenantService.getTenants();
      setTenantSummaries(rows || []);
      setTenantsLoaded(true);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load tenants.");
    } finally {
      setLoadingTenants(false);
    }
  };

  const openTenantDetail = async (id: string) => {
    setDetailTenant(null);
    setLoadingDetail(true);
    try {
      const detail = await tenantService.getTenantDetail(id);
      setDetailTenant(detail);
      const edits: Record<string, Set<string>> = {};
      detail.users.forEach((u) => {
        edits[u.id] = new Set(u.roleCodes || []);
      });
      setUserRoleEdits(edits);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load tenant detail.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleUserRole = (userId: string, roleCode: string) => {
    setUserRoleEdits((prev) => {
      const next = { ...prev };
      const set = new Set(next[userId] || []);
      if (set.has(roleCode)) set.delete(roleCode);
      else set.add(roleCode);
      next[userId] = set;
      return next;
    });
  };

  const saveUserRoles = async (userId: string) => {
    if (!detailTenant) return;
    setSavingRolesUserId(userId);
    try {
      const roleCodes = Array.from(userRoleEdits[userId] || []);
      await tenantService.setTenantUserRoles(detailTenant.id, userId, roleCodes);
      showToast("success", "User roles updated.");
      await openTenantDetail(detailTenant.id);
    } catch (err: any) {
      showToast("error", err.message || "Failed to update user roles.");
    } finally {
      setSavingRolesUserId(null);
    }
  };

  // ── Legacy promote/demote admin modal ──────────────────────────────────────
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

  // ── Provisioning drawer ─────────────────────────────────────────────────────
  // Build the per-module page-selection map from the catalog + the tenant's
  // current pageRestrictions. Module present in pageRestrictions = restricted to
  // that set; absent = all pages checked (no restriction).
  const buildPageSelections = (ent: TenantEntitlements): Record<string, Set<string>> => {
    const sel: Record<string, Set<string>> = {};
    for (const mod of catalog) {
      const restricted = ent.pageRestrictions ? ent.pageRestrictions[mod.code] : undefined;
      sel[mod.code] =
        restricted !== undefined
          ? new Set(restricted)
          : new Set(mod.pages.map((p) => p.pageKey));
    }
    return sel;
  };

  const seedFromEntitlements = (ent: TenantEntitlements) => {
    setClientEntitlements(ent);
    setModuleCodes(new Set(ent.moduleCodes || []));
    setPageSelections(buildPageSelections(ent));
  };

  const handleOpenEntitlements = async (client: TenantAdminListItem) => {
    setSelectedClient(client);
    setExpandedModules(new Set());
    try {
      setLoadingEntitlements(true);
      const entitlements = await tenantService.getEntitlements(client.id);
      seedFromEntitlements(entitlements);
    } catch (err: any) {
      showToast("error", "Failed to load entitlements for this client.");
    } finally {
      setLoadingEntitlements(false);
    }
  };

  const closeEntitlements = () => {
    setSelectedClient(null);
    setClientEntitlements(null);
    setModuleCodes(new Set());
    setPageSelections({});
    setExpandedModules(new Set());
  };

  const handleAssignPlan = async (planTier: string) => {
    if (!selectedClient || !planTier) return;
    setAssigningPlan(true);
    try {
      await tenantService.assignPlan(selectedClient.id, planTier);
      // Reseeds the module/page ceiling from the plan — reload entitlements.
      const fresh = await tenantService.getEntitlements(selectedClient.id);
      seedFromEntitlements(fresh);
      try {
        await navigationService.refreshMenu();
      } catch {
        /* non-fatal */
      }
      showToast("success", `Plan "${planTier}" assigned. Entitlements reloaded.`);
      loadClients();
    } catch (err: any) {
      showToast("error", err.message || "Failed to assign plan.");
    } finally {
      setAssigningPlan(false);
    }
  };

  const handleSaveEntitlements = async () => {
    if (!selectedClient || !clientEntitlements) return;
    try {
      setSavingEntitlements(true);
      // TASK-054 — compute page restrictions: only for entitled modules whose
      // checked page set is a PROPER SUBSET of the module's full page list.
      const pageRestrictions: Record<string, string[]> = {};
      for (const code of Array.from(moduleCodes)) {
        const mod = catalog.find((m) => m.code === code);
        if (mod && mod.pages.length > 0) {
          const allKeys = mod.pages.map((p) => p.pageKey);
          const sel = pageSelections[code] ?? new Set(allKeys);
          if (sel.size < allKeys.length) {
            pageRestrictions[code] = allKeys.filter((k) => sel.has(k));
          }
        }
      }
      const payload: UpdateTenantEntitlements = {
        moduleCodes: Array.from(moduleCodes),
        pageRestrictions,
        reports: clientEntitlements.reports,
      };
      await tenantService.updateEntitlements(selectedClient.id, payload);
      showToast(
        "success",
        `Module & page permissions updated for ${selectedClient.name}!`
      );
      closeEntitlements();
      loadClients();
      // Flip the sidebar immediately without a hard refresh.
      try {
        await navigationService.refreshMenu();
      } catch {
        /* non-fatal */
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to update entitlements.");
    } finally {
      setSavingEntitlements(false);
    }
  };

  const applyPresetToClient = (presetType: "starter" | "tax_reports" | "enterprise") => {
    if (!clientEntitlements) return;

    setModuleCodes(new Set(PRESET_MODULE_CODES[presetType]));

    if (presetType === "starter") {
      setClientEntitlements({
        ...clientEntitlements,
        reports: clientEntitlements.reports.map((r) => ({ ...r, isEnabled: false })),
      });
      showToast("success", "Applied: Bill-Making Only Preset");
    } else if (presetType === "tax_reports") {
      setClientEntitlements({
        ...clientEntitlements,
        reports: clientEntitlements.reports.map((r) => ({
          ...r,
          isEnabled:
            r.reportKey === "tax_summary" ||
            r.reportKey === "party_outstanding" ||
            r.reportKey === "booking_register",
        })),
      });
      showToast("success", "Applied: Billing + Tax Reports Preset");
    } else {
      setClientEntitlements({
        ...clientEntitlements,
        reports: clientEntitlements.reports.map((r) => ({ ...r, isEnabled: true })),
      });
      showToast("success", "Applied: Full Enterprise Preset");
    }
  };

  const toggleClientModule = (code: string) => {
    setModuleCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
        // A newly-granted module defaults to NO page restriction (all pages).
        const mod = catalog.find((m) => m.code === code);
        if (mod) {
          setPageSelections((ps) => ({
            ...ps,
            [code]: new Set(mod.pages.map((p) => p.pageKey)),
          }));
        }
      }
      return next;
    });
  };

  const toggleModuleExpand = (code: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const togglePage = (code: string, pageKey: string) => {
    const mod = catalog.find((m) => m.code === code);
    const allKeys = mod ? mod.pages.map((p) => p.pageKey) : [];
    setPageSelections((prev) => {
      const next = { ...prev };
      const set = new Set(next[code] ?? allKeys);
      if (set.has(pageKey)) set.delete(pageKey);
      else set.add(pageKey);
      next[code] = set;
      return next;
    });
  };

  const toggleClientReport = (reportKey: string) => {
    if (!clientEntitlements) return;
    const updated = clientEntitlements.reports.map((r) =>
      r.reportKey === reportKey ? { ...r, isEnabled: !r.isEnabled } : r
    );
    setClientEntitlements({ ...clientEntitlements, reports: updated });

    const hasAnyReport = updated.some((r) => r.isEnabled);
    setModuleCodes((prev) => {
      const next = new Set(prev);
      if (hasAnyReport) next.add("reports");
      else next.delete("reports");
      return next;
    });
  };

  // ── Onboarding helpers ──────────────────────────────────────────────────────
  const handleSelectTier = (tier: string) => {
    setOnboardForm((prev) => ({
      ...prev,
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
      enabledModuleCodes: PLAN_DEFAULT_MODULES[tier] || [],
    }));
  };

  const handleNextStep = () => {
    if (onboardStep === 1) {
      if (!onboardForm.organizationName?.trim() || !onboardForm.organizationCode?.trim()) {
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
      setOnboardStep(2);
    } else if (onboardStep === 2) {
      if (
        !onboardForm.adminUsername?.trim() ||
        !onboardForm.adminPassword?.trim() ||
        !onboardForm.adminFullName?.trim()
      ) {
        sweetAlert.warning(
          "Missing details",
          "Please complete administrator full name, username, and initial password."
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
      setOnboardStep(3);
    }
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (onboardStep < 3) {
      handleNextStep();
      return;
    }

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
          enabledModules: ["dashboard", "bilty", "trips", "system"],
          enabledReportKeys: [],
        });
        loadClients();
      } else {
        await sweetAlert.error("Onboarding failed", res.message || "Failed to onboard client.");
      }
    } catch (err: any) {
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

  // Distinct plan tier strings for the Plan dropdown (getPlans → tier strings).
  const planTierOptions = Array.from(
    new Map(plans.map((p) => [p.tier, p])).values()
  );

  // Provisionable modules (dashboard/system/clients are always-on / platform-only).
  const provisionableModules = catalog.filter(
    (m) => m.code !== "dashboard" && m.code !== "system" && m.code !== "clients"
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
              setOnboardForm({
                organizationName: "",
                organizationCode: "",
                adminUsername: "",
                adminPassword: "",
                adminFullName: "",
                adminMobile: "",
                planTier: "Starter",
                enabledModuleCodes: PLAN_DEFAULT_MODULES["Starter"] || [],
                enabledReportKeys: [],
              });
              setShowOnboardModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>

        {/* Non-blocking load banner */}
        {loadBanner && (
          <div className="p-3 rounded-xl bg-[#FFF7ED] border border-[#F4A261]/40 text-[#7C2D12] text-xs font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{loadBanner}</span>
          </div>
        )}

        {/* View switcher */}
        <div className="flex items-center gap-2">
          {[
            { id: "directory" as TopView, label: "Provisioning & Directory", icon: PackageIcon },
            { id: "console" as TopView, label: "Tenant Console", icon: Building2 },
          ].map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setTopView(v.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  topView === v.id
                    ? "bg-[#2F8E86] text-white shadow-xs"
                    : "bg-white text-[#64748B] border border-[#E5EAEB] hover:bg-[#E7F1F2] hover:text-[#25776F]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>

        {topView === "directory" && (
          <>
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
          </>
        )}

        {/* ── TENANT CONSOLE ───────────────────────────────────────────────── */}
        {topView === "console" && (
          <div className="bg-white border border-[#E5EAEB] rounded-xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-[#E5EAEB] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#111827]">Tenant Console</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Trace every tenant: provisioned modules, pages, roles, and users. Click a row to drill in.
                </p>
              </div>
              <button
                onClick={loadTenantSummaries}
                className="px-3 py-1.5 bg-white hover:bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-4">Organization & Code</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4 text-center">Modules</th>
                    <th className="py-3 px-4 text-center">Users</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAEB]">
                  {loadingTenants ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#64748B]">
                        Loading tenants...
                      </td>
                    </tr>
                  ) : tenantSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#64748B]">
                        No tenants found.
                      </td>
                    </tr>
                  ) : (
                    tenantSummaries.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => openTenantDetail(t.id)}
                        className="hover:bg-[#F5FAFA] transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#111827]">{t.name}</div>
                          <div className="text-[10px] text-[#2F8E86] font-mono">{t.code}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border bg-[#E7F1F2] text-[#25776F] border-[#D9E2E3]">
                            {t.planCode || "Custom"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[#111827]">{t.moduleCount}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-[#111827]">{t.userCount}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              t.isActive
                                ? "bg-[#E8F6F4] text-[#2F9E8F] border-[#C2E9E3]"
                                : "bg-[#FDF2F2] text-[#D95C5C] border-[#F8B4B4]"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? "bg-[#2F9E8F]" : "bg-[#D95C5C]"}`} />
                            {t.isActive ? "Active" : "Suspended"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <ChevronRight className="w-4 h-4 text-[#94A3B8] inline" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TENANT DETAIL DRAWER ─────────────────────────────────────────── */}
        {(detailTenant || loadingDetail) && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5EAEB] w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-[#E5EAEB] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#111827]">
                    {detailTenant ? `${detailTenant.name} — Tenant Trace` : "Loading…"}
                  </h2>
                  {detailTenant && (
                    <p className="text-xs text-[#64748B] mt-1">
                      <span className="font-mono text-[#2F8E86]">{detailTenant.code}</span>
                      {" · "}Plan: <strong className="text-[#111827]">{detailTenant.planCode || "Custom"}</strong>
                      {" · "}{detailTenant.isActive ? "Active" : "Suspended"}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setDetailTenant(null)}
                  className="text-[#94A3B8] hover:text-[#111827] p-1.5 rounded-lg hover:bg-[#F7F8F8] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {loadingDetail || !detailTenant ? (
                  <div className="py-12 text-center text-[#64748B]">Loading tenant detail…</div>
                ) : (
                  <>
                    {/* Modules */}
                    <section>
                      <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#2F8E86]" /> Provisioned Modules ({detailTenant.modules.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {detailTenant.modules.map((m) => (
                          <div
                            key={m.code}
                            className="p-3 rounded-xl border border-[#E5EAEB] bg-[#F7F8F8] flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-[#111827]">{m.name}</div>
                              <div className="text-[11px] text-[#64748B] font-mono">{m.code}</div>
                            </div>
                            {m.pageRestricted && (
                              <span className="px-2 py-0.5 bg-[#FEF6EE] border border-[#FBD38D] text-[#B45309] text-[10px] font-bold rounded-md">
                                Page-restricted
                              </span>
                            )}
                          </div>
                        ))}
                        {detailTenant.modules.length === 0 && (
                          <div className="text-[#94A3B8]">No modules provisioned.</div>
                        )}
                      </div>
                    </section>

                    {/* Roles */}
                    <section>
                      <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#2F8E86]" /> Roles ({detailTenant.roles.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {detailTenant.roles.map((r) => (
                          <span
                            key={r.code}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#D9E2E3] bg-white text-[#25776F] font-semibold"
                          >
                            {r.name}
                            {r.isSystem && (
                              <span className="text-[9px] uppercase text-[#64748B] bg-[#F1F5F9] px-1 py-0.5 rounded">sys</span>
                            )}
                            <span className="text-[10px] text-[#64748B]">· {r.userCount} user{r.userCount === 1 ? "" : "s"}</span>
                          </span>
                        ))}
                        {detailTenant.roles.length === 0 && (
                          <div className="text-[#94A3B8]">No roles defined.</div>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] text-[#64748B]">
                        Role & permission editing lives on <strong className="text-[#25776F]">/roles</strong>.
                      </p>
                    </section>

                    {/* Users */}
                    <section>
                      <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#2F8E86]" /> Users ({detailTenant.users.length})
                      </h3>
                      <div className="space-y-2">
                        {detailTenant.users.map((u) => {
                          const edited = userRoleEdits[u.id] || new Set<string>();
                          const original = new Set(u.roleCodes || []);
                          const dirty =
                            edited.size !== original.size ||
                            Array.from(edited).some((c) => !original.has(c));
                          return (
                            <div
                              key={u.id}
                              className="p-3 rounded-xl border border-[#E5EAEB] bg-white"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-bold text-[#111827] truncate">
                                    {u.fullName || u.username}
                                    {!u.isActive && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-[#FDF2F2] text-[#D95C5C] border border-[#F8B4B4] text-[9px] font-bold rounded">Inactive</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#64748B] font-mono truncate">
                                    @{u.username}{u.email ? ` · ${u.email}` : ""}
                                  </div>
                                </div>
                                <button
                                  disabled={!dirty || savingRolesUserId === u.id}
                                  onClick={() => saveUserRoles(u.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2F8E86] hover:bg-[#25776F] text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                  {savingRolesUserId === u.id ? "Saving…" : "Save Roles"}
                                </button>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {detailTenant.roles.map((r) => {
                                  const on = edited.has(r.code);
                                  return (
                                    <button
                                      key={r.code}
                                      type="button"
                                      onClick={() => toggleUserRole(u.id, r.code)}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                                        on
                                          ? "bg-[#E7F1F2] text-[#25776F] border-[#2F8E86]/40"
                                          : "bg-[#F7F8F8] text-[#94A3B8] border-[#E5EAEB]"
                                      }`}
                                    >
                                      {r.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {detailTenant.users.length === 0 && (
                          <div className="text-[#94A3B8]">No users found for this tenant.</div>
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

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
                    Control exact modules, pages and sub-reports enabled for user{" "}
                    <strong className="text-[#111827]">
                      @{selectedClient.adminUsername}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={closeEntitlements}
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
                    {/* Plan dropdown */}
                    <div className="p-4 bg-[#F7F8F8] border border-[#E5EAEB] rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div>
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                          Subscription Plan
                        </span>
                        <span className="text-[11px] text-[#64748B]">
                          Assigning a plan reseeds this tenant's module & page ceiling.
                        </span>
                      </div>
                      <select
                        value={clientEntitlements.planCode || ""}
                        disabled={assigningPlan}
                        onChange={(e) => handleAssignPlan(e.target.value)}
                        className="px-3 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-bold text-[#111827] focus:outline-none focus:border-[#2F8E86] disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">
                          {clientEntitlements.planCode ? "Custom (keep current)" : "Custom (no plan)"}
                        </option>
                        {planTierOptions.map((p) => (
                          <option key={p.tier} value={p.tier}>
                            {p.tier}
                            {typeof p.monthlyPriceInr === "number" ? ` — ₹${p.monthlyPriceInr}/mo` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

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

                    {/* Core Modules + Page sub-checklist */}
                    <div>
                      <h3 className="text-sm font-semibold text-[#111827] mb-3">
                        Subscribed Functional Modules & Pages
                      </h3>
                      <div className="space-y-2.5">
                        {provisionableModules.map((mod) => {
                          const isChecked = moduleCodes.has(mod.code);
                          const isExpanded = expandedModules.has(mod.code);
                          const allKeys = mod.pages.map((p) => p.pageKey);
                          const sel = pageSelections[mod.code] ?? new Set(allKeys);
                          const restrictedCount = mod.pages.length - sel.size;
                          const isAccounting = mod.code === "accounting";
                          return (
                            <div
                              key={mod.code}
                              className={`rounded-xl border transition-all ${
                                isChecked
                                  ? "bg-[#E7F1F2]/60 border-[#D9E2E3]"
                                  : "bg-[#F7F8F8] border-[#E5EAEB]"
                              }`}
                            >
                              <div className="p-3 flex items-center justify-between">
                                <div
                                  className="flex items-center gap-2 cursor-pointer select-none flex-1"
                                  onClick={() => toggleClientModule(mod.code)}
                                >
                                  <div>
                                    <div className="font-semibold text-xs text-[#111827] flex items-center gap-1.5">
                                      {mod.name}
                                      {mod.isPremium && (
                                        <span className="px-1.5 py-0.5 bg-[#FEF6EE] border border-[#FBD38D] text-[#B45309] text-[9px] font-bold rounded">
                                          Premium
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-[#64748B]">
                                      Code: {mod.code}
                                      {isChecked && mod.pages.length > 0 && restrictedCount > 0 && (
                                        <span className="ml-1 text-[#B45309] font-semibold">
                                          · {sel.size}/{mod.pages.length} pages
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isChecked && mod.pages.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleModuleExpand(mod.code)}
                                      className="p-1 rounded hover:bg-white/60 text-[#64748B] cursor-pointer"
                                      title="Show pages"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleClientModule(mod.code)}
                                    className="w-4 h-4 accent-[#2F8E86] rounded cursor-pointer"
                                  />
                                </div>
                              </div>

                              {isChecked && isExpanded && mod.pages.length > 0 && (
                                <div className="px-3 pb-3 pt-1 border-t border-[#D9E2E3]/60 space-y-1.5">
                                  {isAccounting && (
                                    <div className="flex items-start gap-1.5 text-[10px] text-[#64748B] bg-[#FFF7ED] border border-[#F4A261]/40 rounded-lg px-2 py-1.5 mb-1">
                                      <Info className="w-3.5 h-3.5 text-[#B45309] shrink-0 mt-px" />
                                      <span>
                                        Accounting pages share one permission, so page-restriction here is
                                        menu-level only (hides the menu row) and is not enforced per-page by the API.
                                      </span>
                                    </div>
                                  )}
                                  {mod.pages.map((pg) => {
                                    const pageOn = sel.has(pg.pageKey);
                                    return (
                                      <label
                                        key={pg.pageKey}
                                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-white/60 cursor-pointer"
                                      >
                                        <span className="text-[11px] text-[#111827]">
                                          {pg.title}
                                          <span className="text-[#94A3B8] font-mono ml-1">({pg.pageKey})</span>
                                        </span>
                                        <input
                                          type="checkbox"
                                          checked={pageOn}
                                          onChange={() => togglePage(mod.code, pg.pageKey)}
                                          className="w-3.5 h-3.5 accent-[#2F8E86] rounded cursor-pointer"
                                        />
                                      </label>
                                    );
                                  })}
                                  <p className="text-[10px] text-[#94A3B8] pt-1">
                                    All pages checked = full module access (no restriction). Uncheck some to restrict.
                                  </p>
                                </div>
                              )}
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
                          {clientEntitlements.reports.filter((r) => r.isEnabled).length}{" "}
                          / {clientEntitlements.reports.length} enabled
                        </span>
                      </div>

                      <div className="space-y-2">
                        {clientEntitlements.reports.map((rep) => (
                          <div
                            key={rep.reportKey}
                            onClick={() => toggleClientReport(rep.reportKey)}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none ${
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
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleClientReport(rep.reportKey);
                              }}
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
                  onClick={closeEntitlements}
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
                  <div className="flex items-center gap-2 mt-2">
                    {[
                      { step: 1, label: "Organization & Plan" },
                      { step: 2, label: "Admin Credentials" },
                      { step: 3, label: "Modules & Review" },
                    ].map((s) => (
                      <div
                        key={s.step}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                          onboardStep === s.step
                            ? "bg-[#2F8E86] text-white shadow-xs"
                            : onboardStep > s.step
                            ? "bg-[#E7F1F2] text-[#25776F]"
                            : "bg-[#F1F5F9] text-[#94A3B8]"
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-white/20">
                          {onboardStep > s.step ? "✓" : s.step}
                        </span>
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="text-[#94A3B8] hover:text-[#111827] p-1.5 rounded-lg hover:bg-[#F7F8F8] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Content */}
              <form
                onSubmit={handleOnboardSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (onboardStep < 3) {
                      handleNextStep();
                    }
                  }
                }}
                className="flex flex-col flex-1 overflow-hidden"
              >
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

                      {/* Subscription Plan Picker on Step 1 */}
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-2">
                          Select Subscription Plan *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            {
                              tier: "Starter",
                              price: "₹999/mo",
                              desc: "Bilty & basic transport",
                            },
                            {
                              tier: "Professional",
                              price: "₹2,999/mo",
                              desc: "Bilty, POD, Billing, Reports",
                            },
                            {
                              tier: "Enterprise",
                              price: "₹9,999/mo",
                              desc: "Complete Transport ERP suite",
                            },
                          ].map((item) => {
                            const isSelected =
                              (onboardForm.planTier || "Starter") === item.tier;
                            return (
                              <button
                                key={item.tier}
                                type="button"
                                onClick={() => handleSelectTier(item.tier)}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#E7F1F2] border-[#2F8E86] text-[#25776F] shadow-xs ring-1 ring-[#2F8E86]"
                                    : "bg-[#F7F8F8] border-[#E5EAEB] text-[#64748B] hover:border-[#D9E2E3] hover:bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-[#111827]">
                                    {item.tier}
                                  </span>
                                  {isSelected && (
                                    <span className="w-2 h-2 rounded-full bg-[#2F8E86]" />
                                  )}
                                </div>
                                <div className="text-xs text-[#2F8E86] font-semibold mt-1">
                                  {item.price}
                                </div>
                                <div className="text-[10px] text-[#64748B] mt-0.5 leading-tight">
                                  {item.desc}
                                </div>
                              </button>
                            );
                          })}
                        </div>
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

                      {/* Admin User's Role */}
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-1.5">
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
                          Default is "admin". You can pick any seeded system role.
                        </p>
                      </div>
                    </div>
                  )}

                  {onboardStep === 3 && (
                    <div className="space-y-4">
                      {/* Subscription Plan Switcher / Confirmation */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-[#111827] uppercase tracking-wider">
                            Selected Subscription Plan
                          </label>
                          <span className="text-[11px] text-[#2F8E86] font-bold">
                            Current: {onboardForm.planTier || "Starter"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {["Starter", "Professional", "Enterprise"].map((tier) => {
                            const isSelected =
                              (onboardForm.planTier || "Starter") === tier;
                            return (
                              <button
                                key={tier}
                                type="button"
                                onClick={() => handleSelectTier(tier)}
                                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-[#E7F1F2] border-[#2F8E86] text-[#25776F] font-bold ring-1 ring-[#2F8E86]"
                                    : "bg-[#F7F8F8] border-[#E5EAEB] text-[#64748B] hover:border-[#D9E2E3]"
                                }`}
                              >
                                <div className="text-xs font-bold text-[#111827]">{tier}</div>
                                <div className="text-xs text-[#2F8E86] mt-1 font-semibold">
                                  {tier === "Starter"
                                    ? "₹999/mo"
                                    : tier === "Professional"
                                    ? "₹2,999/mo"
                                    : "₹9,999/mo"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Module checkboxes (writes tenant_modules). */}
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider mb-2">
                          Enabled Modules
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {catalog.filter((m) => m.code !== "clients").map((mod) => {
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
                                <span>{mod.name}</span>
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
                                  className="w-4 h-4 accent-[#2F8E86] rounded cursor-pointer"
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
                                  className="w-4 h-4 accent-[#2F8E86] rounded cursor-pointer"
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
                      ← Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {onboardStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
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
                      {submittingOnboard ? "Saving..." : "Save"}
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
