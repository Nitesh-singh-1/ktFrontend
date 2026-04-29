"use client";

import Link from "next/link";
import { useState } from "react";
import { sidebarItems } from "@/app/config/sidebar";
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

// Icon mapping
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
  return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
};

export default function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/login";
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white
      transition-all duration-300 z-40 shadow-2xl border-r border-slate-700/50 flex flex-col
      ${isOpen ? "w-64" : "w-20"}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 p-2 rounded-full shadow-lg transition-all duration-200 z-50 group"
        title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? (
          <ChevronLeftIcon className="w-4 h-4" />
        ) : (
          <ChevronRightIcon className="w-4 h-4" />
        )}
      </button>

      {/* Logo & Branding */}
      <div className="p-5 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {isOpen && (
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">K-Transport</h1>
              <p className="text-xs text-slate-400">Logistics Pro</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {sidebarItems.map((item) => {
          // 🔹 Simple link
          if (!item.children) {
            return (
              <Link
                key={item.title}
                href={item.path || "#"}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gradient-to-r hover:from-indigo-600/20 hover:to-purple-600/20 transition-all duration-200 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 to-purple-600/0 group-hover:from-indigo-600/10 group-hover:to-purple-600/10 transition-all duration-200"></div>
                <div className="relative z-10 flex items-center gap-3 w-full">
                  <div className="text-slate-300 group-hover:text-white group-hover:scale-110 transition-all duration-200">
                    {getIcon(item.icon)}
                  </div>
                  {isOpen && (
                    <span className="font-medium text-sm text-slate-300 group-hover:text-white transition-colors duration-200">
                      {item.title}
                    </span>
                  )}
                </div>
              </Link>
            );
          }

          // 🔹 Dropdown menu
          const isDropdownOpen = openMenu === item.title;
          return (
            <div key={item.title}>
              <button
                onClick={() => setOpenMenu(isDropdownOpen ? null : item.title)}
                className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gradient-to-r hover:from-indigo-600/20 hover:to-purple-600/20 transition-all duration-200 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 to-purple-600/0 group-hover:from-indigo-600/10 group-hover:to-purple-600/10 transition-all duration-200"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="text-slate-300 group-hover:text-white group-hover:scale-110 transition-all duration-200">
                    {getIcon(item.icon)}
                  </div>
                  {isOpen && (
                    <span className="font-medium text-sm text-slate-300 group-hover:text-white transition-colors duration-200">
                      {item.title}
                    </span>
                  )}
                </div>
                {isOpen && (
                  <ChevronDownIcon
                    className={`w-4 h-4 text-slate-400 group-hover:text-white transition-all duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Children */}
              {isOpen && isDropdownOpen && (
                <div className="mt-1 ml-8 space-y-1 border-l-2 border-slate-700/50 pl-4">
                  {item.children.map((child) => (
                    <Link
                      key={child.title}
                      href={child.path || "#"}
                      className="block px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-md transition-all duration-150 group"
                    >
                      <div className="flex items-center gap-2">
                        {child.icon && (
                          <div className="text-slate-400 group-hover:text-white transition-colors">
                            {getIcon(child.icon)}
                          </div>
                        )}
                        <span>{child.title}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout Button at Bottom */}
      <div className="p-3 border-t border-slate-700/50 bg-slate-900/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl group relative overflow-hidden"
          title="Logout"
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200"></div>
          <div className="relative z-10 flex items-center gap-3 w-full">
            <LogOutIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            {isOpen && <span className="text-sm">Logout</span>}
          </div>
        </button>
      </div>
    </aside>
  );
}