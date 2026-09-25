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
  TenantUserItem,
} from "../../../../services/navigationService";
import { userService, SubUserDetails } from "../../../../services/userService";
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
  User,
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
  AlertCircle
} from "lucide-react";

type TabKey = "general" | "menu_entitlements" | "billing" | "sequences" | "workflows" | "modules" | "integrations";
type MatrixMode = "subscriptions" | "menus" | "roles" | "users" | "reports";

export interface MenuItemDefinition {
  key: string;
  title: string;
  desc: string;
  iconName: string;
  category: "Core Operations" | "Fleet & Dispatch" | "Financial & Billing" | "Master Data" | "Analytics & SaaS" | "System";
  subItems?: { key: string; title: string; desc: string; iconName: string }[];
}

export const fullMenuCatalog: MenuItemDefinition[] = [
  {
    key: "dashboard",
    title: "Dashboard Home",
    desc: "Overview cards, live metric charts, revenue summary",
    iconName: "dashboard",
    category: "Core Operations",
  },
  {
    key: "consignments",
    title: "Bilty / GR Booking Module",
    desc: "Goods receipt booking, consignment printing, and registry",
    iconName: "consignments",
    category: "Core Operations",
    subItems: [
      { key: "consignments.create", title: "New Bilty (GR Booking Entry)", desc: "Issue new consignment note with consignor/consignee", iconName: "plus" },
      { key: "consignments.all", title: "All Bilties (GR Registry)", desc: "Search, filter, edit, and print consignment bilties", iconName: "file" },
    ],
  },
  {
    key: "trips",
    title: "LR / Truck Challan & Manifest",
    desc: "Vehicle loading memo, driver hire contract, and dispatch trips",
    iconName: "trips",
    category: "Fleet & Dispatch",
  },
  {
    key: "pod",
    title: "POD & Deliveries Management",
    desc: "Proof of delivery upload, physical slip acknowledgment, settlement",
    iconName: "pod",
    category: "Fleet & Dispatch",
  },
  {
    key: "billing",
    title: "Freight Invoicing & Billing",
    desc: "Generate corporate GST freight invoices and Money Receipts (MR)",
    iconName: "billing",
    category: "Financial & Billing",
    subItems: [
      { key: "billing.invoices", title: "Freight Invoices", desc: "Create, view, and send freight tax invoices", iconName: "file" },
      { key: "billing.receipts", title: "Money Receipts (MR)", desc: "Collect customer payments and issue MR vouchers", iconName: "card" },
    ],
  },
  {
    key: "master_data",
    title: "Master Data Management",
    desc: "Parties directory, customer GSTINs, fleet registry, and stations",
    iconName: "database",
    category: "Master Data",
    subItems: [
      { key: "master_data.parties", title: "Party Directory", desc: "Consignors, consignees, billing parties ledger", iconName: "users" },
      { key: "master_data.fleet", title: "Fleet & Stations Directory", desc: "Owned & attached vehicles, driver details, branches", iconName: "truck" },
    ],
  },
  {
    key: "vendors",
    title: "Market Vendors & Lorry Hire",
    desc: "Market truck brokers, lorry hire agreements, advance payables",
    iconName: "vendors",
    category: "Fleet & Dispatch",
  },
  {
    key: "claims",
    title: "Cargo Damage & Claims",
    desc: "Shortage, transit damage claims, settlement approval workflow",
    iconName: "claims",
    category: "Core Operations",
  },
  {
    key: "reports",
    title: "Reports & Business Intelligence",
    desc: "Financial summaries, booking registers, customer outstanding, P&L",
    iconName: "reports",
    category: "Analytics & SaaS",
  },
  {
    key: "tracking",
    title: "Live GPS Vehicle Tracker",
    desc: "Real-time GPS vehicle location, speed, and geofence tracking",
    iconName: "tracking",
    category: "Fleet & Dispatch",
  },
  {
    key: "clients",
    title: "Multi-Client Management",
    desc: "Multi-tenant client provisioning, billing status, tenant isolation",
    iconName: "clients",
    category: "Analytics & SaaS",
  },
  {
    key: "system",
    title: "System & Administration",
    desc: "SaaS settings, document sequences, tenant onboarding, security",
    iconName: "system",
    category: "System",
    subItems: [
      { key: "system.settings", title: "SaaS Configuration & Matrix", desc: "Company branding, menus, and permission engine", iconName: "sliders" },
      { key: "system.onboard", title: "Tenant Onboarding", desc: "Provision new client organizations and branches", iconName: "rocket" },
    ],
  },
];

export function renderCatalogIcon(keyOrName: string, className = "w-4 h-4") {
  switch (keyOrName) {
    case "dashboard":
      return <LayoutDashboard className={className} />;
    case "consignments":
      return <Package className={className} />;
    case "trips":
    case "truck":
      return <Truck className={className} />;
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
      return <BarChart3 className={className} />;
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
      return <FileText className={className} />;
    case "card":
    case "billing.receipts":
      return <CreditCard className={className} />;
    default:
      return <Package className={className} />;
  }
}

const standardRoles = ["admin", "dispatcher", "billing_operator", "fleet_manager", "viewer"];

export default function SettingsPage() {
  const { config: globalConfig, updateConfig: updateGlobalConfig, refreshConfig } = useTenantConfig();
  const { refreshNavigation } = useNavigation();

  const [activeTab, setActiveTab] = useState<TabKey>("menu_entitlements");
  const [matrixMode, setMatrixMode] = useState<MatrixMode>("menus");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  
  // Client selection for Multi-Tenant Entitlements
  const [tenantsList, setTenantsList] = useState<TenantListItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  // Users list for User-Dedicated Page Assignment
  const [tenantUsers, setTenantUsers] = useState<TenantUserItem[]>([
    { id: 1, username: "admin", fullName: "System Admin", role: "admin" },
    { id: 2, username: "nitesh", fullName: "Nitesh (Sub User)", role: "SUB_USER" },
    { id: 3, username: "billing_clerk", fullName: "Ramesh (Billing Clerk)", role: "billing_operator" },
    { id: 4, username: "dispatcher_user", fullName: "Suresh (Fleet Dispatcher)", role: "dispatcher" },
  ]);
  const [selectedUserId, setSelectedUserId] = useState<string>("nitesh");

  // Sub-User Creation Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [newFullName, setNewFullName] = useState<string>("");
  const [newMobile, setNewMobile] = useState<string>("");
  const [newAssignedFeatures, setNewAssignedFeatures] = useState<string[]>(["dashboard", "consignments", "consignments.all", "tracking"]);
  const [creatingUser, setCreatingUser] = useState<boolean>(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // User Overrides map: Record<userId, string[]>
  const [userOverrides, setUserOverrides] = useState<Record<string, string[]>>({
    nitesh: ["dashboard", "consignments", "consignments.create", "consignments.all", "trips", "tracking"],
    billing_clerk: ["dashboard", "consignments", "consignments.create", "consignments.all", "billing", "billing.invoices", "billing.receipts"],
    dispatcher_user: ["dashboard", "consignments", "consignments.all", "trips", "pod", "master_data", "master_data.fleet", "vendors", "tracking"],
  });

  // Role Overrides map: Record<role, string[]>
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string[]>>({
    admin: fullMenuCatalog.flatMap((m) => [m.key, ...(m.subItems ? m.subItems.map((s) => s.key) : [])]),
    dispatcher: ["dashboard", "consignments", "consignments.all", "trips", "pod", "master_data", "master_data.fleet", "vendors", "tracking", "system"],
    billing_operator: ["dashboard", "consignments", "consignments.create", "consignments.all", "billing", "billing.invoices", "billing.receipts", "system"],
    fleet_manager: ["dashboard", "trips", "pod", "master_data", "master_data.fleet", "vendors", "tracking", "claims", "system"],
    viewer: ["dashboard", "consignments.all", "reports", "system"],
  });

  const [menuEntitlements, setMenuEntitlements] = useState<TenantMenuEntitlements>({
    tenantId: "",
    planTier: "Enterprise",
    enabledMenuKeys: [
      "dashboard",
      "consignments",
      "consignments.create",
      "consignments.all",
      "trips",
      "pod",
      "billing",
      "billing.invoices",
      "billing.receipts",
      "master_data",
      "master_data.parties",
      "master_data.fleet",
      "vendors",
      "claims",
      "reports",
      "tracking",
      "clients",
      "system",
      "system.settings",
      "system.onboard",
    ],
    reports: [
      { reportKey: "booking_register", title: "Consignment Booking Register", description: "Comprehensive log of all booked goods receipts", category: "Operational", path: "/reports?tab=booking_register", isEnabled: true },
      { reportKey: "tax_summary", title: "GST & Tax Summary Report", description: "Taxable amounts, CGST, SGST, IGST, and RCM breakdowns", category: "Financial", path: "/reports?tab=tax_summary", isEnabled: true },
      { reportKey: "party_outstanding", title: "Customer Outstanding Ledger", description: "Real-time receivables, billed vs settled balance", category: "Financial", path: "/reports?tab=party_outstanding", isEnabled: true },
      { reportKey: "trip_profitability", title: "Trip Profitability & P&L", description: "Trip revenue vs diesel, toll, and expense margin", category: "Operational", path: "/reports?tab=trip_profitability", isEnabled: true },
      { reportKey: "vendor_payables", title: "Vendor & Lorry Hire Payables", description: "Vehicle hiring dues, advances, and pending dues", category: "Financial", path: "/reports?tab=vendor_payables", isEnabled: true },
    ],
  });

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

  // Load configuration, tenants, users and subscription data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const [cfgRes, subRes, menuRes, tenantsRes, usersRes] = await Promise.allSettled([
          configService.getConfiguration(),
          configService.getSubscription(),
          navigationService.getMenuEntitlements(),
          navigationService.getAllTenants(),
          navigationService.getTenantUsers(),
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
          if (menuRes.value.userOverridesJson) {
            try {
              const parsedUsers = JSON.parse(menuRes.value.userOverridesJson);
              if (parsedUsers) setUserOverrides(parsedUsers);
            } catch {}
          }
          if (menuRes.value.roleOverridesJson) {
            try {
              const parsedRoles = JSON.parse(menuRes.value.roleOverridesJson);
              if (parsedRoles) setRoleOverrides(parsedRoles);
            } catch {}
          }
        }

        if (tenantsRes.status === "fulfilled" && tenantsRes.value && tenantsRes.value.length > 0) {
          setTenantsList(tenantsRes.value);
        }

        if (usersRes.status === "fulfilled" && usersRes.value && usersRes.value.length > 0) {
          setTenantUsers(usersRes.value);
          if (usersRes.value[0]?.username) {
            setSelectedUserId(usersRes.value[0].username);
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
  }, [globalConfig]);

  // Handle tenant switch to edit another client's entitlements
  const handleTenantSelect = async (tenantId: string) => {
    setSelectedTenantId(tenantId);
    try {
      setLoading(true);
      const res = await navigationService.getMenuEntitlementsForTenant(tenantId);
      setMenuEntitlements(res);
      if (res.userOverridesJson) {
        try {
          setUserOverrides(JSON.parse(res.userOverridesJson));
        } catch {}
      }
      if (res.roleOverridesJson) {
        try {
          setRoleOverrides(JSON.parse(res.roleOverridesJson));
        } catch {}
      }
    } catch (err: any) {
      console.error("Error fetching entitlements for tenant:", err);
    } finally {
      setLoading(false);
    }
  };

  // Subscription Plan Presets
  const applyStarterPlan = () => {
    const starterKeys = ["dashboard", "consignments", "consignments.create", "consignments.all", "system"];
    setMenuEntitlements({
      ...menuEntitlements,
      planTier: "Starter",
      enabledMenuKeys: starterKeys,
      reports: menuEntitlements.reports.map((r) => ({
        ...r,
        isEnabled: r.reportKey === "booking_register",
      })),
    });
  };

  const applyProfessionalPlan = () => {
    const proKeys = [
      "dashboard",
      "consignments",
      "consignments.create",
      "consignments.all",
      "trips",
      "pod",
      "billing",
      "billing.invoices",
      "billing.receipts",
      "master_data",
      "master_data.parties",
      "master_data.fleet",
      "reports",
      "system",
      "system.settings",
    ];
    setMenuEntitlements({
      ...menuEntitlements,
      planTier: "Professional",
      enabledMenuKeys: proKeys,
      reports: menuEntitlements.reports.map((r) => ({
        ...r,
        isEnabled: r.reportKey === "booking_register" || r.reportKey === "tax_summary" || r.reportKey === "party_outstanding",
      })),
    });
  };

  const applyEnterprisePlan = () => {
    const allKeys = fullMenuCatalog.flatMap((m) => [m.key, ...(m.subItems ? m.subItems.map((s) => s.key) : [])]);
    setMenuEntitlements({
      ...menuEntitlements,
      planTier: "Enterprise",
      enabledMenuKeys: allKeys,
      reports: menuEntitlements.reports.map((r) => ({ ...r, isEnabled: true })),
    });
  };

  const applyClientAPreset = () => {
    setMenuEntitlements({
      ...menuEntitlements,
      planTier: "Custom",
      enabledMenuKeys: ["dashboard", "consignments", "consignments.create", "consignments.all", "trips", "billing", "billing.invoices", "system"],
      reports: menuEntitlements.reports.map((r) => ({ ...r, isEnabled: false })),
    });
  };

  const applyClientBPreset = () => {
    setMenuEntitlements({
      ...menuEntitlements,
      planTier: "Custom",
      enabledMenuKeys: [
        "dashboard",
        "consignments",
        "consignments.create",
        "consignments.all",
        "billing",
        "billing.invoices",
        "billing.receipts",
        "reports",
        "system",
      ],
      reports: menuEntitlements.reports.map((r) => ({
        ...r,
        isEnabled: r.reportKey === "tax_summary" || r.reportKey === "party_outstanding" || r.reportKey === "booking_register",
      })),
    });
  };

  // Toggle Menu Key in Global Matrix
  const toggleMenuKey = (key: string) => {
    const exists = menuEntitlements.enabledMenuKeys.includes(key);
    const updatedKeys = exists
      ? menuEntitlements.enabledMenuKeys.filter((k) => k !== key)
      : [...menuEntitlements.enabledMenuKeys, key];
    setMenuEntitlements({ ...menuEntitlements, enabledMenuKeys: updatedKeys });
  };

  // Toggle Dedicated User Page
  const toggleUserPage = (userId: string, pageKey: string) => {
    const currentPages = userOverrides[userId] || menuEntitlements.enabledMenuKeys;
    const exists = currentPages.includes(pageKey);
    const updated = exists ? currentPages.filter((k) => k !== pageKey) : [...currentPages, pageKey];
    setUserOverrides({ ...userOverrides, [userId]: updated });
  };

  // Toggle Role Page
  const toggleRolePage = (role: string, pageKey: string) => {
    const currentPages = roleOverrides[role] || [];
    const exists = currentPages.includes(pageKey);
    const updated = exists ? currentPages.filter((k) => k !== pageKey) : [...currentPages, pageKey];
    setRoleOverrides({ ...roleOverrides, [role]: updated });
  };

  // Toggle Report Item
  const toggleReportItem = (reportKey: string) => {
    const updatedReports = menuEntitlements.reports.map((r) =>
      r.reportKey === reportKey ? { ...r, isEnabled: !r.isEnabled } : r
    );
    setMenuEntitlements({ ...menuEntitlements, reports: updatedReports });
  };

  // Handle creating a new Sub User
  const handleCreateSubUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newFullName.trim()) {
      setCreateUserError("Username, Password, and Full Name are required.");
      return;
    }

    try {
      setCreatingUser(true);
      setCreateUserError(null);

      const res = await userService.createSubUser({
        username: newUsername.trim(),
        password: newPassword.trim(),
        fullName: newFullName.trim(),
        mobile: newMobile.trim() || undefined,
        role: "SUB_USER",
        assignedFeatures: newAssignedFeatures,
      });

      if (res.success && res.data) {
        // Refresh users list
        const updatedUsers = await userService.getUsers();
        if (updatedUsers && updatedUsers.length > 0) {
          setTenantUsers(updatedUsers.map((u) => ({ id: u.id, username: u.username, fullName: u.fullName, role: u.role, mobile: u.mobile, isActive: u.isActive })));
        } else {
          setTenantUsers((prev) => [...prev, { id: res.data!.id, username: res.data!.username, fullName: res.data!.fullName, role: res.data!.role, mobile: res.data!.mobile, isActive: res.data!.isActive }]);
        }

        // Update user overrides
        setUserOverrides((prev) => ({
          ...prev,
          [res.data!.username]: newAssignedFeatures,
          [res.data!.id.toString()]: newAssignedFeatures,
        }));

        setSelectedUserId(res.data.username);
        setShowCreateUserModal(false);
        setNewUsername("");
        setNewPassword("");
        setNewFullName("");
        setNewMobile("");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setCreateUserError(res.message || "Failed to create sub-user.");
      }
    } catch (err: any) {
      setCreateUserError(err?.message || "Failed to create sub-user.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (username: string) => {
    const targetUser = tenantUsers.find((u) => u.username === username);
    if (!targetUser) return;

    const newStatus = !(targetUser.isActive ?? true);
    try {
      const res = await userService.toggleStatus(targetUser.id, newStatus);
      if (res.success) {
        setTenantUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: newStatus } : u)));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  // Handle saving configuration & matrix
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      const targetTenantId = selectedTenantId || formData.tenantId;

      const payload: TenantMenuEntitlements = {
        ...menuEntitlements,
        userOverridesJson: JSON.stringify(userOverrides),
        roleOverridesJson: JSON.stringify(roleOverrides),
      };

      const [updatedConfig, updatedEntitlements] = await Promise.all([
        updateGlobalConfig(formData),
        selectedTenantId
          ? navigationService.updateMenuEntitlementsForTenant(targetTenantId, payload)
          : navigationService.updateMenuEntitlements(payload),
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
    if (!confirm("Are you sure you want to reset all tenant settings and permissions to system defaults?")) return;

    try {
      setSaving(true);
      const resetConfig = await configService.resetToDefaults();
      setFormData((prev) => ({ ...prev, ...resetConfig }));
      applyEnterprisePlan();
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
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Loading SaaS Configuration & Permission Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header Bar - Light Blue & Crisp White */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center shadow-xs text-white font-bold text-xl shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                SaaS Configuration & Permission Engine
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800">
                {menuEntitlements.planTier || "Enterprise"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage client menus, subscription plan tiers, dedicated user pages, document sequences, and tax policies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl transition cursor-pointer"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Matrix...</span>
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
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">
            SaaS Configuration, Menu Entitlements & User Dedicated Pages saved successfully! Navigation updated live.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-sky-100 dark:border-slate-800 pb-2 scrollbar-none">
        {[
          { id: "menu_entitlements", label: "Menu & Permission Matrix", icon: Shield },
          { id: "general", label: "General & Branding", icon: Building2 },
          { id: "billing", label: "Billing, GST & Tax", icon: Receipt },
          { id: "sequences", label: "Document Sequences", icon: Hash },
          { id: "workflows", label: "Operational Rules", icon: Zap },
          { id: "modules", label: "Subscription & Limits", icon: Crown },
          { id: "integrations", label: "Integrations & API", icon: Plug },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabKey)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: MENU & PERMISSION MATRIX (COMPREHENSIVE MULTI-TIER ENGINE) */}
      {activeTab === "menu_entitlements" && (
        <div className="space-y-6">
          {/* Tenant Selector & Sub-Matrix Mode Switcher Bar */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                  Client & User Permission Engine
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Multi-Client Organization & Dedicated User Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control exact page access per client organization, subscription tier, role, or dedicated individual user
                </p>
              </div>

              {/* Client Tenant Selector */}
              <div className="w-full md:w-80">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Active Client Tenant:
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => handleTenantSelect(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-sky-500"
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

            {/* Matrix View Mode Tabs */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
              {[
                { id: "menus", label: "Global Page Matrix", icon: ClipboardList },
                { id: "users", label: "Dedicated User Pages", icon: User },
                { id: "subscriptions", label: "Subscription Tier Presets", icon: Crown },
                { id: "roles", label: "Role-Based Matrix (RBAC)", icon: Shield },
                { id: "reports", label: "Reports Catalog", icon: BarChart3 },
              ].map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setMatrixMode(mode.id as MatrixMode)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      matrixMode === mode.id
                        ? "bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800 shadow-2xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUB-VIEW 1: SUBSCRIPTION TIER PRESETS */}
          {matrixMode === "subscriptions" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-sky-100 dark:border-slate-800 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  1-Click Subscription Tier & Client Presets
                </h3>
                <p className="text-xs text-slate-500">
                  Instantly configure allowed menus and reports according to the client&apos;s active subscription package
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Starter Plan */}
                <div className="p-5 rounded-2xl border-2 border-sky-100 bg-sky-50/40 dark:bg-slate-850 dark:border-slate-800 space-y-4 hover:border-sky-300 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-sky-700 bg-sky-100 dark:bg-sky-950 dark:text-sky-300 px-2 py-0.5 rounded flex items-center gap-1">
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Starter Tier</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Basic Transport</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">Bilty Entry & Registry</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Ideal for single-branch booking counters who only need GR consignment booking and register
                    </p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Consignment Booking (GR)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Booking Register Report</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-400">
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Truck Challans (Locked)</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-400">
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>GPS Tracking (Locked)</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={applyStarterPlan}
                    className="w-full py-2 bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs dark:bg-slate-800 dark:border-slate-700 dark:text-sky-400"
                  >
                    Apply Starter Preset
                  </button>
                </div>

                {/* Professional Plan */}
                <div className="p-5 rounded-2xl border-2 border-sky-300 bg-sky-50/80 dark:bg-slate-850 dark:border-sky-700 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-white bg-sky-600 px-2 py-0.5 rounded flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      <span>Professional Tier</span>
                    </span>
                    <span className="text-xs font-bold text-sky-700 dark:text-sky-300">Most Popular</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">Bilties + Challans + Billing</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Full operational dispatch workflow with Invoicing, Money Receipts, and GST Reports
                    </p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-200">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>GR Consignments & Challans</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>POD Deliveries & Settlements</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Freight Invoicing & Money Receipts</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>GST Tax Summary & Ledger</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={applyProfessionalPlan}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                  >
                    Apply Professional Preset
                  </button>
                </div>

                {/* Enterprise Plan */}
                <div className="p-5 rounded-2xl border-2 border-slate-300 bg-white dark:bg-slate-850 dark:border-slate-700 space-y-4 hover:border-sky-400 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Enterprise Suite</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Full Platform</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">Uncapped TMS Platform</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      All 15+ modules: GPS Tracking, Vendor Hire, Claims, Multi-Client Manager, and all 5 Reports
                    </p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Full Suite + GPS Live Tracking</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Vendor Lorry Hire & Claims</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Multi-Client Tenant Manager</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>All 5 Financial & P&L Reports</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={applyEnterprisePlan}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs dark:bg-sky-700 dark:hover:bg-sky-600"
                  >
                    Apply Enterprise Preset
                  </button>
                </div>
              </div>

              {/* Custom Client Presets */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Quick Client Presets:</span>
                <button
                  type="button"
                  onClick={applyClientAPreset}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition cursor-pointer dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Client A: Bill Making Only (No Reports)</span>
                </button>
                <button
                  type="button"
                  onClick={applyClientBPreset}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Client B: Billing + Tax Reports Only</span>
                </button>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: DEDICATED USER PAGE ASSIGNMENT MATRIX */}
          {matrixMode === "users" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-sky-100 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Sub-User Management & Feature Permissions
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200">
                      Dual-Tier Security
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Create sub-users and assign dedicated modules strictly filtered to your organization's subscribed features.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateUserError(null);
                      setShowCreateUserModal(true);
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Sub-User</span>
                  </button>
                </div>
              </div>

              {/* User Selection and Status Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-sky-50/60 dark:bg-slate-850 border border-sky-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white font-black text-sm">
                    {selectedUserId.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Selected Sub-User:
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-sky-300 dark:border-slate-700 rounded-lg px-3 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    >
                      {tenantUsers.map((u) => (
                        <option key={u.id} value={u.username}>
                          {u.fullName || u.username} ({u.role || "SUB_USER"}) {u.isActive === false ? "[Inactive]" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedUserId !== "admin" && (
                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(selectedUserId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        tenantUsers.find((u) => u.username === selectedUserId)?.isActive === false
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                      }`}
                    >
                      {tenantUsers.find((u) => u.username === selectedUserId)?.isActive === false
                        ? "Activate User"
                        : "Deactivate User"}
                    </button>
                  )}
                  <span className="text-xs font-bold text-sky-700 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-slate-700 shadow-2xs">
                    {(userOverrides[selectedUserId] || []).length} Assigned
                  </span>
                </div>
              </div>

              {/* Organization Subscribed Features Notice */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    <strong className="text-slate-800 dark:text-white">Subscription Filter:</strong> Showing only modules included in your organization's <strong className="text-sky-700 dark:text-sky-400">{menuEntitlements.planTier || "Active"} Plan</strong>. Unsubscribed modules cannot be assigned.
                  </span>
                </span>
                <span className="font-bold text-sky-700 dark:text-sky-400 shrink-0 ml-2">
                  {menuEntitlements.enabledMenuKeys.length} Subscribed Features
                </span>
              </div>

              {/* Assignable Features Checklist (Filtered to Organization Subscription) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fullMenuCatalog
                  .filter(
                    (menu) =>
                      menu.key !== "system" &&
                      menu.key !== "system.settings" &&
                      menu.key !== "clients" &&
                      (menuEntitlements.enabledMenuKeys.includes(menu.key) ||
                        (menu.subItems && menu.subItems.some((s) => menuEntitlements.enabledMenuKeys.includes(s.key))))
                  )
                  .map((menu) => {
                    const activeUserPages = userOverrides[selectedUserId] || [];
                    const isChecked = activeUserPages.includes(menu.key);

                    // Filter sub items to only subscribed ones
                    const assignableSubItems = (menu.subItems || []).filter(
                      (sub) =>
                        sub.key !== "system.settings" &&
                        sub.key !== "system.onboard" &&
                        menuEntitlements.enabledMenuKeys.includes(sub.key)
                    );

                    return (
                      <div
                        key={menu.key}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isChecked
                            ? "bg-sky-50/40 dark:bg-slate-850 border-sky-200 dark:border-slate-700"
                            : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800"
                        }`}
                      >
                        <div
                          onClick={() => toggleUserPage(selectedUserId, menu.key)}
                          className="flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            {renderCatalogIcon(menu.key, "w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0")}
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{menu.title}</h4>
                              <p className="text-[11px] text-slate-500">{menu.desc}</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 accent-sky-600 rounded cursor-pointer shrink-0"
                          />
                        </div>

                        {/* Sub-items for this menu */}
                        {assignableSubItems.length > 0 && (
                          <div className="ml-6 pl-3 border-l border-sky-100 dark:border-slate-700 space-y-1.5 pt-2 mt-2">
                            {assignableSubItems.map((sub) => {
                              const isSubChecked = activeUserPages.includes(sub.key);
                              return (
                                <div
                                  key={sub.key}
                                  onClick={() => toggleUserPage(selectedUserId, sub.key)}
                                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    {renderCatalogIcon(sub.key, "w-3.5 h-3.5 text-sky-500 shrink-0")}
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                      {sub.title}
                                    </span>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isSubChecked}
                                    onChange={() => {}}
                                    className="w-3.5 h-3.5 accent-sky-600 rounded cursor-pointer shrink-0"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Create Sub-User Modal */}
              {showCreateUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-sky-600" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Sub-User</h3>
                          <p className="text-[11px] text-slate-500">Add an operator account and assign organization-subscribed features</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCreateUserModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {createUserError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                        {createUserError}
                      </div>
                    )}

                    <form onSubmit={handleCreateSubUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                            Username *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. nitesh"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                            Password *
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Nitesh Sharma"
                            value={newFullName}
                            onChange={(e) => setNewFullName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                            Mobile No
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 9876543210"
                            value={newMobile}
                            onChange={(e) => setNewMobile(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      {/* Subscribed Feature Checklist for New User */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                          Assign Subscribed Features ({newAssignedFeatures.length} selected):
                        </label>
                        <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          {fullMenuCatalog
                            .filter(
                              (m) =>
                                m.key !== "system" &&
                                m.key !== "system.settings" &&
                                m.key !== "clients" &&
                                (menuEntitlements.enabledMenuKeys.includes(m.key) ||
                                  (m.subItems && m.subItems.some((s) => menuEntitlements.enabledMenuKeys.includes(s.key))))
                            )
                            .map((m) => {
                              const checked = newAssignedFeatures.includes(m.key);
                              return (
                                <label key={m.key} className="flex items-center justify-between p-1 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    {renderCatalogIcon(m.key, "w-3.5 h-3.5 text-sky-600 dark:text-sky-400")}
                                    <span>{m.title}</span>
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setNewAssignedFeatures((prev) =>
                                        checked ? prev.filter((k) => k !== m.key) : [...prev, m.key]
                                      );
                                    }}
                                    className="w-3.5 h-3.5 accent-sky-600 rounded"
                                  />
                                </label>
                              );
                            })}
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setShowCreateUserModal(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creatingUser}
                          className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {creatingUser ? "Creating..." : "Save Sub-User"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 3: GLOBAL MENU & ROUTE MATRIX */}
          {matrixMode === "menus" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-sky-100 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tenant Navigation & Module Entitlements
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enable or disable specific modules and navigation sub-links across the entire client tenant
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 dark:bg-sky-950 dark:text-sky-300 px-3 py-1 rounded-lg border border-sky-200 dark:border-sky-800">
                    {menuEntitlements.enabledMenuKeys.length} Modules Active
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const allKeys = fullMenuCatalog.flatMap((m) => [m.key, ...(m.subItems ? m.subItems.map((s) => s.key) : [])]);
                      setMenuEntitlements({ ...menuEntitlements, enabledMenuKeys: allKeys });
                    }}
                    className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                  >
                    Select All
                  </button>
                </div>
              </div>

              {/* Categorized Menu Catalog */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fullMenuCatalog.map((menu) => {
                  const isChecked = menuEntitlements.enabledMenuKeys.includes(menu.key);

                  return (
                    <div
                      key={menu.key}
                      className={`p-4 rounded-2xl border transition-all ${
                        isChecked
                          ? "bg-white dark:bg-slate-850 border-sky-200 dark:border-slate-700 shadow-2xs"
                          : "bg-slate-50/60 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 opacity-60"
                      }`}
                    >
                      <div
                        onClick={() => toggleMenuKey(menu.key)}
                        className="flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {renderCatalogIcon(menu.key, "w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0")}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{menu.title}</h4>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                {menu.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{menu.desc}</p>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 accent-sky-600 rounded cursor-pointer shrink-0"
                        />
                      </div>

                      {/* Sub-items */}
                      {menu.subItems && menu.subItems.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          {menu.subItems.map((sub) => {
                            const isSubChecked = menuEntitlements.enabledMenuKeys.includes(sub.key);
                            return (
                              <div
                                key={sub.key}
                                onClick={() => toggleMenuKey(sub.key)}
                                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                                  isSubChecked
                                    ? "bg-sky-50/60 border-sky-200 text-sky-900 dark:bg-slate-800 dark:text-sky-300 dark:border-slate-700"
                                    : "bg-white border-slate-200 text-slate-500 dark:bg-slate-850 dark:border-slate-800"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {renderCatalogIcon(sub.key, "w-3.5 h-3.5 text-sky-500 shrink-0")}
                                  <div>
                                    <span className="font-semibold">{sub.title}</span>
                                    <span className="block text-[10px] text-slate-400">{sub.desc}</span>
                                  </div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isSubChecked}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 accent-sky-600 rounded cursor-pointer shrink-0"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: ROLE-BASED PERMISSION MATRIX (RBAC) */}
          {matrixMode === "roles" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-sky-100 dark:border-slate-800 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Role-Based Access Control (RBAC) Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Assign module permissions across standard operational roles (Admin, Dispatcher, Billing Operator, Fleet Manager, Viewer)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sky-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-bold border-b border-sky-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Module / Route</th>
                      {standardRoles.map((role) => (
                        <th key={role} className="px-4 py-3 text-center capitalize">
                          {role.replace("_", " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {fullMenuCatalog.map((menu) => (
                      <tr key={menu.key} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          <span className="inline-flex items-center gap-2">
                            {renderCatalogIcon(menu.key, "w-4 h-4 text-sky-600 dark:text-sky-400")}
                            <span>{menu.title}</span>
                          </span>
                        </td>
                        {standardRoles.map((role) => {
                          const isAssigned = (roleOverrides[role] || []).includes(menu.key);
                          return (
                            <td key={role} className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => toggleRolePage(role, menu.key)}
                                className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 5: GRANULAR REPORTS CATALOG */}
          {matrixMode === "reports" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-sky-100 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Granular Sub-Report Entitlements
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enable or revoke specific individual business reports and financial ledgers for this tenant
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  {menuEntitlements.reports.filter((r) => r.isEnabled).length} / {menuEntitlements.reports.length} Reports Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuEntitlements.reports.map((report) => (
                  <div
                    key={report.reportKey}
                    onClick={() => toggleReportItem(report.reportKey)}
                    className={`p-4 rounded-2xl border flex items-start justify-between gap-4 cursor-pointer transition ${
                      report.isEnabled
                        ? "bg-white dark:bg-slate-850 border-emerald-300 dark:border-emerald-800 shadow-2xs"
                        : "bg-slate-50 border-slate-200 opacity-50 dark:bg-slate-900"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{report.title}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {report.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{report.description}</p>
                      <span className="inline-block font-mono text-[10px] text-sky-700 dark:text-sky-400">
                        Path: {report.path}
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={report.isEnabled}
                      onChange={() => {}}
                      className="w-4 h-4 accent-emerald-600 rounded mt-1 shrink-0 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: GENERAL & BRANDING */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs space-y-5">
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">This logo will automatically appear on all printed Bilties, GR Consignment notes, and Challans for this organization.</p>
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs space-y-5">
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
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
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Live Branding Preview
              </h3>
              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 dark:bg-slate-850 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                    {formData.general.companyName ? formData.general.companyName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "FP"}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {formData.general.companyName || "Company Name"}
                    </h4>
                    <p className="text-[11px] text-sky-700 dark:text-sky-400">
                      {formData.general.legalName || "Legal Name"}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-2 border-t border-sky-100 dark:border-slate-800">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{formData.general.supportEmail || "support@transport.com"}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{formData.general.supportPhone || "+91 98765 43210"}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{formData.general.address || "Zero Mile, Pahari, Patna-7"}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BILLING, GST & TAX */}
      {activeTab === "billing" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs space-y-6">
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-sky-500 uppercase"
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-sky-500 uppercase"
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENT SEQUENCES */}
      {activeTab === "sequences" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs space-y-6">
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
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Next Number</label>
                  <input
                    type="number"
                    value={seq.nextNumber}
                    onChange={(e) => handleSequenceChange(idx, "nextNumber", parseInt(e.target.value) || 1)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Padding Digits</label>
                  <input
                    type="number"
                    value={seq.paddingDigits}
                    onChange={(e) => handleSequenceChange(idx, "paddingDigits", parseInt(e.target.value) || 4)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sample Preview</label>
                  <span className="inline-block font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 text-xs">
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs space-y-6">
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
                      ? "bg-sky-50/50 border-sky-200 dark:bg-slate-850 dark:border-slate-700"
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
                    className="w-4 h-4 accent-sky-600 rounded cursor-pointer shrink-0"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTION & LIMITS */}
      {activeTab === "modules" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Subscription & Resource Quotas</h2>
              <p className="text-xs text-slate-500">Live usage metrics against allocated plan limits</p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200">
              Plan: {subscription?.planName || "Enterprise"} ({subscription?.planTier || "Enterprise"})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-sky-50/50 dark:bg-slate-850 border border-sky-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Vehicles Quota</span>
              <h3 className="text-2xl font-black text-sky-700 dark:text-sky-400">
                {subscription?.currentVehicles || 8} / {subscription?.maxVehicles || 25}
              </h3>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((subscription?.currentVehicles || 8) / (subscription?.maxVehicles || 25)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-sky-50/50 dark:bg-slate-850 border border-sky-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Active Users</span>
              <h3 className="text-2xl font-black text-sky-700 dark:text-sky-400">
                {subscription?.currentUsers || 3} / {subscription?.maxUsers || 10}
              </h3>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((subscription?.currentUsers || 3) / (subscription?.maxUsers || 10)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-sky-50/50 dark:bg-slate-850 border border-sky-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Monthly Shipments</span>
              <h3 className="text-2xl font-black text-sky-700 dark:text-sky-400">
                {subscription?.currentMonthlyShipments || 120} / {subscription?.maxMonthlyShipments || 1000}
              </h3>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xs space-y-6">
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
