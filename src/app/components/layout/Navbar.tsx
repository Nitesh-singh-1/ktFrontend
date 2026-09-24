"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  Building2, 
  Truck, 
  Package, 
  Sun, 
  Moon, 
  Palette, 
  Settings, 
  SlidersHorizontal, 
  LogOut, 
  Check, 
  Plus 
} from "lucide-react";
import { authService } from "../../../../services/authService";
import { configService, TenantSubscription } from "../../../../services/configService";
import { useTenantConfig } from "@/context/TenantConfigContext";
import { useAppTheme, ThemeKey } from "@/context/ThemeContext";

export default function Navbar() {
  const [user, setUser] = useState<{ fullName?: string; username?: string; role?: string } | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [isThemeOpen, setIsThemeOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  const themeRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme, isDark, availableThemes, density, setDensity } = useAppTheme();
  const { config } = useTenantConfig();

  const role = (user?.role || "").toUpperCase();
  const isSuperUser = role === "SUPER_USER" || role === "ADMIN" || role === "TENANTADMIN" || role === "TENANT_OWNER" || role === "SUPERADMIN";

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    setOrgName(authService.getOrganizationName());

    const r = (currentUser?.role || "").toUpperCase();
    const isSuper = r === "SUPER_USER" || r === "ADMIN" || r === "TENANTADMIN" || r === "TENANT_OWNER" || r === "SUPERADMIN";

    if (isSuper) {
      configService.getSubscription().then((sub) => {
        if (sub) setSubscription(sub);
      }).catch(() => {
        // Fallback
      });
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  const planTier = subscription?.planTier || "Enterprise";
  const companyTitle = config?.general?.companyName || orgName || "K-Transport";

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-sky-100 dark:border-slate-800 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30 shadow-xs">
      {/* Left: Platform Title & Active Tenant */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
              {companyTitle}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800 rounded-md">
              {planTier} SaaS
            </span>
          </div>
          <p className="text-[11px] text-sky-700/80 dark:text-sky-400 font-medium mt-0.5">
            Fleet, Bilties & Logistics Management
          </p>
        </div>

        {orgName && (
          <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 text-sky-900 dark:text-sky-200 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{orgName}</span>
          </div>
        )}
      </div>

      {/* Middle/Right: Quota Badges, Centralized Theme Setting, Quick Action & User Profile */}
      <div className="flex items-center gap-3">
        {/* SaaS Resource Quotas Quick Pill */}
        {subscription && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-sky-50/60 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <Truck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Vehicles:</span>
              <strong className="text-sky-700 dark:text-sky-400">{subscription.currentVehicles}/{subscription.maxVehicles}</strong>
            </div>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
              <Package className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Shipments:</span>
              <strong className="text-sky-700 dark:text-sky-400">{subscription.currentMonthlyShipments}/{subscription.maxMonthlyShipments}</strong>
            </div>
          </div>
        )}

        {/* Quick Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light-blue" : "dark-blue")}
          className="flex items-center justify-center w-9 h-9 bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-800 dark:text-sky-300 border border-sky-200/70 dark:border-slate-700 rounded-xl transition cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-sky-700" />
          )}
        </button>

        {/* Centralized Theme & App Appearance Settings Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            type="button"
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100/80 text-sky-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-sky-300 border border-sky-200/70 dark:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Centralized Theme & Display Settings"
          >
            <Palette className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">Theme</span>
            <svg
              className={`w-3.5 h-3.5 text-sky-600 dark:text-sky-400 transition-transform ${isThemeOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Theme Dropdown Panel */}
          {isThemeOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Application Theme</h4>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 rounded-md">
                  Active: {theme}
                </span>
              </div>

              {/* Theme Options */}
              <div className="space-y-2 mb-4">
                {availableThemes.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id as ThemeKey);
                        setIsThemeOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-sky-50 border-sky-400 text-sky-900 dark:bg-sky-950/40 dark:border-sky-500 shadow-xs"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-xs shrink-0"
                          style={{ backgroundColor: t.primaryColor }}
                        />
                        <div>
                          <div className="text-xs font-bold">{t.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{t.description}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Layout Density Controls */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Display Density:</span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDensity("comfortable")}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      density === "comfortable" ? "bg-white dark:bg-slate-700 text-sky-700 shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    Comfortable
                  </button>
                  <button
                    type="button"
                    onClick={() => setDensity("compact")}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      density === "compact" ? "bg-white dark:bg-slate-700 text-sky-700 shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    Compact
                  </button>
                </div>
              </div>

              {/* Link to Full SaaS Settings - ONLY for Super User */}
              {isSuperUser && (
                <div className="mt-3 pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href="/settings"
                    onClick={() => setIsThemeOpen(false)}
                    className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold hover:underline flex items-center justify-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Configure Permission & SaaS Matrix →</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Action Button: New Waybill */}
        <Link
          href="/shipments/create"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Bilty / GR</span>
        </Link>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* User Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {user?.fullName || user?.username || "Admin"}
              </p>
              <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium capitalize">
                {user?.role || "User"}
              </p>
            </div>

            <div className="w-9 h-9 bg-sky-600 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.fullName || user?.username || "User"}
                </p>
                <p className="text-[11px] text-slate-500 capitalize">{user?.role || "User"}</p>
              </div>

              {/* SaaS Management Links - Strictly ONLY for Super User */}
              {isSuperUser && (
                <div className="py-1 space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-700"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>SaaS Configuration</span>
                  </Link>
                  <Link
                    href="/clients"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-700"
                  >
                    <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Multi-Client Manager</span>
                  </Link>
                </div>
              )}

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}