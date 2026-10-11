"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  menuAdminService,
  MenuItemAdminDto,
} from "../../../../services/menuAdminService";
import { navigationService } from "../../../../services/navigationService";
import { PagePermissionGuard } from "@/app/components/ui/PagePermissionGuard";
import { sweetAlert } from "@/utils/sweetAlert";
import {
  Shield,
  Layers,
  Search,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings,
  Users,
  Building,
  Check,
  X,
  Sliders,
} from "lucide-react";

export default function MenuCatalogPage() {
  const [items, setItems] = useState<MenuItemAdminDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const data = await menuAdminService.getAll();
      setItems(data);
    } catch (err: any) {
      sweetAlert.error("Failed to Load Menu Catalog", err?.message || "Could not retrieve menu catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleToggleStatus = async (item: MenuItemAdminDto) => {
    const nextStatus = !item.isActive;
    setActionLoading(item.id);

    try {
      const updated = await menuAdminService.updateStatus(item.id, nextStatus);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: updated.isActive } : i))
      );
      // Immediately refresh the live sidebar navigation for all open layouts
      await navigationService.refreshMenu();
    } catch (err: any) {
      sweetAlert.error("Update Failed", err?.message || "Could not toggle menu item status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHideIncompleteMasterData = async () => {
    const confirmed = await sweetAlert.confirm(
      "Hide Incomplete Master Data Menus?",
      "This will hide 8 placeholder master data items (Tyres, Spares, Loans, Compliance, Driver Ledger, Claims, Rates, Vendor Rates) across all tenant sidebars. Only Party Directory and Fleet & Stations will remain visible."
    );
    if (!confirmed) return;

    setQuickActionLoading("hideMaster");
    try {
      const result = await menuAdminService.hideIncompleteMasterData();
      sweetAlert.success("Master Data Cleaned", result.message || "Incomplete items have been hidden.");
      await loadCatalog();
      await navigationService.refreshMenu();
    } catch (err: any) {
      sweetAlert.error("Action Failed", err?.message || "Could not hide incomplete master data menus.");
    } finally {
      setQuickActionLoading(null);
    }
  };

  const handleResetMasterData = async () => {
    const confirmed = await sweetAlert.confirm(
      "Unhide All Master Data Menus?",
      "This will re-enable all 10 Master Data sub-menus in the sidebar for all users with master data permissions."
    );
    if (!confirmed) return;

    setQuickActionLoading("resetMaster");
    try {
      const result = await menuAdminService.resetMasterData();
      sweetAlert.success("Master Data Restored", result.message || "All master data items are now active.");
      await loadCatalog();
      await navigationService.refreshMenu();
    } catch (err: any) {
      sweetAlert.error("Action Failed", err?.message || "Could not reset master data menus.");
    } finally {
      setQuickActionLoading(null);
    }
  };

  const handleSyncSidebar = async () => {
    setQuickActionLoading("sync");
    try {
      await navigationService.refreshMenu();
      sweetAlert.success("Sidebar Refreshed", "Live navigation menu cache has been synced across the application.");
    } catch (err: any) {
      sweetAlert.error("Sync Failed", err?.message || "Could not sync navigation.");
    } finally {
      setQuickActionLoading(null);
    }
  };

  // Groupings & Stats
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.isActive).length;
    const hidden = items.filter((i) => !i.isActive).length;
    const masterItems = items.filter((i) => i.parentKey === "master_data");
    const activeMaster = masterItems.filter((i) => i.isActive).length;

    return { total, active, hidden, activeMaster, totalMaster: masterItems.length };
  }, [items]);

  const categories = [
    { id: "all", label: "All Menus" },
    { id: "master_data", label: "Master Data" },
    { id: "consignments", label: "Bilty / GR" },
    { id: "trips", label: "Trips & Dispatch" },
    { id: "billing", label: "Billing & Finance" },
    { id: "system", label: "System & Settings" },
    { id: "top_level", label: "Top-Level Groups" },
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (categoryFilter === "top_level" && item.parentKey !== null) return false;
      if (categoryFilter !== "all" && categoryFilter !== "top_level") {
        if (item.parentKey !== categoryFilter && item.key !== categoryFilter) return false;
      }

      // Status filter
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "hidden" && item.isActive) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesKey = item.key.toLowerCase().includes(q);
        const matchesPath = (item.path || "").toLowerCase().includes(q);
        const matchesPerm = (item.permissionKey || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesKey && !matchesPath && !matchesPerm) return false;
      }

      return true;
    });
  }, [items, categoryFilter, statusFilter, searchQuery]);

  return (
    <PagePermissionGuard platformOnly={true} permission="saas.tenants.manage" moduleName="Platform Menu & Access Manager">
      <div className="space-y-6 pb-16 max-w-7xl mx-auto">
        {/* Header Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#173C38] via-[#1E4D48] to-[#255E57] text-white rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-300">
                <Shield className="w-3.5 h-3.5" />
                <span>Platform Operator Exclusive View</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Global Menu Catalog & Access Manager
              </h1>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                Manage frontend navigation visibility across all tenants without touching the database.
                Hide or unhide placeholder modules, troubleshoot 403 permission access, and sync sidebar state in real-time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSyncSidebar}
                disabled={quickActionLoading === "sync"}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${quickActionLoading === "sync" ? "animate-spin" : ""}`} />
                <span>Sync Sidebar</span>
              </button>
              <Link
                href="/users"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0F2D2A] text-xs font-bold transition shadow-xs"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manage User RBAC</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs font-medium">
              <span>Total Catalog Menus</span>
              <Layers className="w-4 h-4 text-[#2F8E86]" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-[#111827] dark:text-white">
              {stats.total}
            </div>
            <div className="mt-1 text-[11px] text-[#94A3B8]">Emitted via Postgres catalog</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs font-medium">
              <span>Active in Sidebar</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.active}
            </div>
            <div className="mt-1 text-[11px] text-[#94A3B8]">Visible when role permits</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs font-medium">
              <span>Hidden / Disabled</span>
              <EyeOff className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {stats.hidden}
            </div>
            <div className="mt-1 text-[11px] text-[#94A3B8]">Completely omitted from nav</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 text-xs font-medium">
              <span>Master Data Active</span>
              <Sliders className="w-4 h-4 text-[#2F8E86]" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-[#111827] dark:text-white">
              {stats.activeMaster} / {stats.totalMaster}
            </div>
            <div className="mt-1 text-[11px] text-[#94A3B8]">
              {stats.activeMaster === 2 ? "Party & Fleet Only (Clean)" : "Custom Configuration"}
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[#111827] dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2F8E86]" />
                One-Click Quick Actions
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Instantly clean up non-working or placeholder menu items so clients and operators never see non-functional screens.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleHideIncompleteMasterData}
                disabled={quickActionLoading === "hideMaster"}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition cursor-pointer disabled:opacity-50"
              >
                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Hide Incomplete Master Data (8 items)</span>
              </button>

              <button
                type="button"
                onClick={handleResetMasterData}
                disabled={quickActionLoading === "resetMaster"}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E7F1F2] dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 text-[#25776F] dark:text-emerald-300 text-xs font-bold hover:bg-[#D9E2E3] transition cursor-pointer disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5 text-[#2F8E86]" />
                <span>Unhide All Master Data</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTroubleshooter(!showTroubleshooter)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-300 text-xs font-medium hover:bg-slate-200 transition cursor-pointer"
              >
                <span>403 Access Help</span>
                {showTroubleshooter ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 403 Troubleshooter Accordion */}
          {showTroubleshooter && (
            <div className="mt-4 pt-4 border-t border-[#E5EAEB] dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8FAFA] dark:bg-slate-800/60 border border-[#E5EAEB] dark:border-slate-700/60 space-y-1.5">
                <div className="font-bold text-[#111827] dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Bilty Creation & View (Fixed)
                </div>
                <p className="text-[#64748B] dark:text-slate-400">
                  Users with Bilty Creation rights (<code>consignments.create.create</code>) can now view and print bilties without 403 errors.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFA] dark:bg-slate-800/60 border border-[#E5EAEB] dark:border-slate-700/60 space-y-1.5">
                <div className="font-bold text-[#111827] dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Vehicles, Drivers, Locations (Fixed)
                </div>
                <p className="text-[#64748B] dark:text-slate-400">
                  Lookup endpoints now accept Bilty and Trip operators (<code>consignments.*</code>, <code>trips.*</code>). Operators booking Bilties no longer need full fleet admin rights.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFA] dark:bg-slate-800/60 border border-[#E5EAEB] dark:border-slate-700/60 space-y-1.5">
                <div className="font-bold text-[#111827] dark:text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#2F8E86]" />
                  Frontend Control vs Database
                </div>
                <p className="text-[#64748B] dark:text-slate-400">
                  You never need to edit the database directly. Toggling the switches below updates the database catalog immediately and reloads client menus.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Filters & Search */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 p-1.5 rounded-2xl shadow-xs">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    categoryFilter === c.id
                      ? "bg-[#2F8E86] text-white shadow-xs"
                      : "text-[#64748B] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white hover:bg-[#F0F5F5] dark:hover:bg-slate-800"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter menu items by visibility status"
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 text-xs text-[#111827] dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#2F8E86]"
              >
                <option value="all">All Statuses ({items.length})</option>
                <option value="active">Active Only ({stats.active})</option>
                <option value="hidden">Hidden Only ({stats.hidden})</option>
              </select>

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search title, key, path..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 text-xs text-[#111827] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2F8E86]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#2F8E86] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#64748B]">Loading catalog items from database...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-semibold text-[#111827] dark:text-white">No menu items match your criteria</p>
              <p className="text-xs text-[#64748B]">Try clearing your search or switching categories.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5EAEB] dark:border-slate-800 bg-[#F8FAFA] dark:bg-slate-800/50 text-[#64748B] dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Menu Item & Semantic Key</th>
                    <th className="py-3 px-4">Parent Group</th>
                    <th className="py-3 px-4">Route Path</th>
                    <th className="py-3 px-4">Required Permission Key</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Visibility Switch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
                  {filteredItems.map((item) => {
                    const isMaster = item.parentKey === "master_data";
                    const isWorkingMaster = item.key === "master_data.parties" || item.key === "master_data.fleet";
                    const isToggling = actionLoading === item.id;

                    return (
                      <tr
                        key={item.id}
                        className={`transition hover:bg-[#F9FCFC] dark:hover:bg-slate-800/40 ${
                          !item.isActive ? "opacity-60 bg-slate-50/50 dark:bg-slate-900/40" : ""
                        }`}
                      >
                        {/* Title & Key */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                item.isActive
                                  ? "bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-emerald-400"
                                  : "bg-slate-100 dark:bg-slate-800 text-[#94A3B8]"
                              }`}
                            >
                              <Layers className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-[#111827] dark:text-white flex items-center gap-2">
                                <span>{item.title}</span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-[#E7F1F2] text-[#25776F] font-semibold text-[10px]">
                                    {item.badge}
                                  </span>
                                )}
                                {isMaster && !isWorkingMaster && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-semibold text-[10px]">
                                    Placeholder
                                  </span>
                                )}
                              </div>
                              <code className="text-[11px] text-[#64748B] dark:text-slate-400 font-mono">
                                {item.key}
                              </code>
                            </div>
                          </div>
                        </td>

                        {/* Parent Group */}
                        <td className="py-3 px-4 text-[#475569] dark:text-slate-300">
                          {item.parentKey ? (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                              {item.parentKey}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#94A3B8] italic">Top-level root</span>
                          )}
                        </td>

                        {/* Path */}
                        <td className="py-3 px-4 text-[#475569] dark:text-slate-300 font-mono text-[11px]">
                          {item.path ? (
                            <span className="text-[#25776F] dark:text-emerald-400">{item.path}</span>
                          ) : (
                            <span className="text-[#94A3B8] italic">Header only</span>
                          )}
                        </td>

                        {/* Permission Key */}
                        <td className="py-3 px-4">
                          {item.permissionKey ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-[#475569] dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {item.permissionKey}
                            </span>
                          ) : (
                            <span className="text-[#94A3B8] italic">Public (All Users)</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 text-center">
                          {item.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                              <Check className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#64748B] dark:text-slate-400 font-bold text-[11px]">
                              <EyeOff className="w-3 h-3" />
                              <span>Hidden</span>
                            </span>
                          )}
                        </td>

                        {/* Toggle Switch */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            disabled={isToggling}
                            title={item.isActive ? "Click to hide from sidebar" : "Click to show in sidebar"}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2F8E86] focus:ring-offset-2 ${
                              item.isActive ? "bg-[#2F8E86]" : "bg-slate-300 dark:bg-slate-700"
                            } ${isToggling ? "opacity-50 cursor-wait" : ""}`}
                          >
                            <span className="sr-only">Toggle {item.title}</span>
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                item.isActive ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PagePermissionGuard>
  );
}
