"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  Sun,
  Moon,
  Settings,
  SlidersHorizontal,
  LogOut,
  Check,
  UserCircle,
  ChevronDown,
  Menu,
} from "lucide-react";
import { authService } from "../../../../services/authService";
import { configService, TenantSubscription } from "../../../../services/configService";
import { useTenantConfig } from "@/context/TenantConfigContext";
import { useAppTheme, ThemeKey } from "@/context/ThemeContext";

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void } = {}) {
  const [user, setUser] = useState<{ fullName?: string; username?: string; role?: string } | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  // Hydrate synchronously from the cached user so the navbar renders "SaaS Configuration"
  // vs. "Organization Settings" correctly on first paint; /me only overrides on success.
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean>(() => authService.isPlatformAdminSync());
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme, isDark, availableThemes } = useAppTheme();
  const { config } = useTenantConfig();

  const role = (user?.role || "").toUpperCase();
  const isSuperUser = ["SUPER_USER", "ADMIN", "TENANTADMIN", "TENANT_OWNER", "SUPERADMIN"].includes(role);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    setOrgName(authService.getOrganizationName());

    const r = (currentUser?.role || "").toUpperCase();
    if (["SUPER_USER", "ADMIN", "TENANTADMIN", "TENANT_OWNER", "SUPERADMIN"].includes(r)) {
      configService.getSubscription().then((sub: TenantSubscription) => {
        if (sub?.planTier) setPlanTier(sub.planTier);
      }).catch(() => {});
    }

    authService.getMyProfile()
      .then((p) => setIsPlatformAdmin(!!p.isPlatformAdmin))
      .catch(() => { /* keep cached value — a failed /me must not strip menu items */ });

    const handleClickOutside = (event: MouseEvent) => {
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

  const companyTitle = config?.general?.companyName || orgName || "Dashboard";

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      {/* Left: active organization + plan */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile hamburger — opens the nav drawer */}
        <button
          onClick={onMenuClick}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white hover:bg-[#E7F1F2] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#25776F] dark:text-teal-300 border border-[#D9E2E3] dark:border-slate-700 transition cursor-pointer shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-[#E7F1F2] dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 flex items-center justify-center text-[#2F8E86] shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-[#111827] dark:text-white leading-tight truncate max-w-[40vw]">
            {companyTitle}
          </h1>
          {planTier && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#25776F] dark:text-teal-400">
              {planTier} plan
            </span>
          )}
        </div>
      </div>

      {/* Right: minimal actions */}
      <div className="flex items-center gap-2">
        {/* Dark / light toggle */}
        <button
          type="button"
          onClick={() => setTheme(isDark ? "fleetpulse-teal" : "dark-blue")}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white hover:bg-[#E7F1F2] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#25776F] dark:text-sky-300 border border-[#D9E2E3] dark:border-slate-700 transition cursor-pointer"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#2F8E86]" />}
        </button>

        {/* User menu — holds profile, settings, platform tools, theme, sign out */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-[#E7F1F2] dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-[#111827] dark:text-slate-200 leading-tight">
                {user?.fullName || user?.username || "User"}
              </p>
              <p className="text-[10px] text-[#2F8E86] dark:text-teal-400 font-medium capitalize">
                {user?.role || "User"}
              </p>
            </div>
            <div className="w-9 h-9 bg-[#2F8E86] text-white rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[#E5EAEB] dark:border-slate-800">
                <p className="text-xs font-bold text-[#111827] dark:text-white truncate">
                  {user?.fullName || user?.username || "User"}
                </p>
                <p className="text-[11px] text-[#64748B] capitalize">{user?.role || "User"}</p>
              </div>

              <div className="py-1 space-y-0.5">
                <MenuLink href="/profile" onClick={() => setIsUserMenuOpen(false)} icon={<UserCircle className="w-3.5 h-3.5 text-[#2F8E86]" />} label="My Profile" />
                {isSuperUser && (
                  <MenuLink
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    icon={<Settings className="w-3.5 h-3.5 text-[#2F8E86]" />}
                    label={isPlatformAdmin ? "SaaS Configuration" : "Organization Settings"}
                  />
                )}
                {isPlatformAdmin && (
                  <MenuLink href="/clients" onClick={() => setIsUserMenuOpen(false)} icon={<SlidersHorizontal className="w-3.5 h-3.5 text-[#2F8E86]" />} label="Multi-Client Manager" />
                )}
              </div>

              {/* Appearance */}
              <div className="pt-2 mt-1 border-t border-[#E5EAEB] dark:border-slate-800">
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Appearance</p>
                <div className="px-2 grid grid-cols-1 gap-0.5">
                  {availableThemes.map((t) => {
                    const selected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id as ThemeKey)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          selected ? "bg-[#E7F1F2] text-[#25776F] font-semibold" : "text-[#64748B] hover:bg-[#F5FAFA] dark:hover:bg-slate-800"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: t.primaryColor }} />
                          {t.name}
                        </span>
                        {selected && <Check className="w-3.5 h-3.5 text-[#2F8E86]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1 mt-1 border-t border-[#E5EAEB] dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#D95C5C] hover:bg-red-50 dark:hover:bg-red-950/30 transition text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#D95C5C]" />
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

function MenuLink({ href, onClick, icon, label }: { href: string; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#111827] dark:text-slate-300 hover:bg-[#E7F1F2] dark:hover:bg-slate-800 hover:text-[#25776F]"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
