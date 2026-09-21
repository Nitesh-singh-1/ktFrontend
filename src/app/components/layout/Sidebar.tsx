"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { sidebarItems } from "@/app/config/sidebar";
import { authService } from "../../../../services/authService";
import {
  HomeIcon,
  PackageIcon,
  FileTextIcon,
  BarChartIcon,
  CogIcon,
  LogOutIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SettingsIcon,
  LockIcon,
  InfoIcon,
} from "@/app/components/ui/Icons";

const iconMap: { [key: string]: React.FC<{ className?: string; size?: number }> } = {
  home: HomeIcon,
  package: PackageIcon,
  fileText: FileTextIcon,
  barChart: BarChartIcon,
  cog: CogIcon,
  settings: SettingsIcon,
  lock: LockIcon,
  info: InfoIcon,
};

const getIcon = (iconName?: string) => {
  if (!iconName) return null;
  const IconComponent = iconMap[iconName];
  return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
};

export default function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>("Consignments (GR)");
  const [user, setUser] = useState<{ fullName?: string; username?: string; role?: string } | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    setUser(authService.getUser());
    setOrgName(authService.getOrganizationName());
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#0f172a] text-slate-300
      transition-all duration-300 z-40 border-r border-slate-800/80 flex flex-col shadow-lg
      ${isOpen ? "w-64" : "w-20"}`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-6 bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-full shadow-md transition-transform duration-200 z-50 border-2 border-[#0f172a] cursor-pointer"
        title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? (
          <ChevronLeftIcon className="w-3.5 h-3.5" />
        ) : (
          <ChevronRightIcon className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-500/20 shrink-0">
          KT
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <h1 className="font-extrabold text-sm tracking-tight text-white truncate">
              K-TRANSPORT
            </h1>
            <p className="text-[11px] font-medium text-indigo-400 truncate">
              {orgName || "Freight & Logistics TMS"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
        {sidebarItems.map((item) => {
          // Simple single link
          if (!item.children) {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.title}
                href={item.path || "#"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                }`}
                title={!isOpen ? item.title : undefined}
              >
                <div className={`shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
                  {getIcon(item.icon)}
                </div>
                {isOpen && <span className="truncate">{item.title}</span>}
              </Link>
            );
          }

          // Dropdown menu
          const isDropdownOpen = openMenu === item.title;
          const hasActiveChild = item.children.some((c) => pathname === c.path);

          return (
            <div key={item.title} className="space-y-1">
              <button
                type="button"
                onClick={() => setOpenMenu(isDropdownOpen ? null : item.title)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                  hasActiveChild
                    ? "text-white bg-slate-800/80"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
                title={!isOpen ? item.title : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className={`shrink-0 ${hasActiveChild ? "text-indigo-400" : "text-slate-400 group-hover:text-white"}`}>
                    {getIcon(item.icon)}
                  </div>
                  {isOpen && <span className="truncate">{item.title}</span>}
                </div>
                {isOpen && (
                  <ChevronDownIcon
                    className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Sub-items */}
              {isOpen && isDropdownOpen && (
                <div className="ml-5 pl-3 border-l border-slate-800 space-y-1 py-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.path;
                    return (
                      <Link
                        key={child.title}
                        href={child.path || "#"}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 ${
                          isChildActive
                            ? "bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                        <span className="truncate">{child.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile & Logout Bottom Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0b1120]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            {isOpen && (
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">
                  {user?.fullName || user?.username || "Admin"}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user?.role || "Fleet Manager"}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition"
            title="Sign Out"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}