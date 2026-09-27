"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { sidebarItems, SidebarItem } from "@/app/config/sidebar";
import { authService } from "../../../../services/authService";
import { useTenantConfig } from "@/context/TenantConfigContext";
import { useNavigation } from "@/context/NavigationContext";
import { DynamicMenuItem } from "../../../../services/navigationService";
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
  TruckIcon,
} from "@/app/components/ui/Icons";

const iconMap: { [key: string]: React.FC<{ className?: string; size?: number }> } = {
  home: HomeIcon,
  package: PackageIcon,
  truck: TruckIcon,
  fileText: FileTextIcon,
  barChart: BarChartIcon,
  cog: CogIcon,
  settings: SettingsIcon,
  lock: LockIcon,
  info: InfoIcon,
  list: FileTextIcon,
  plusCircle: PackageIcon,
};

const getIcon = (iconName?: string) => {
  if (!iconName) return <FileTextIcon className="w-4 h-4" />;
  const IconComponent = iconMap[iconName] || FileTextIcon;
  return <IconComponent className="w-4 h-4" />;
};

export default function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>("consignments");
  const [user, setUser] = useState<{ fullName?: string; username?: string; role?: string } | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    setUser(authService.getUser());
    setOrgName(authService.getOrganizationName());
  }, []);

  // Auto-expand menu containing the active page
  useEffect(() => {
    if (!pathname) return;
    for (const item of sidebarItems) {
      if (item.children?.some((c) => c.path === pathname || (c.path && c.path !== "/" && pathname.startsWith(c.path)))) {
        setOpenMenu(item.id || item.title);
        break;
      }
    }
  }, [pathname]);

  let companyName = orgName || "K-Transport";
  let dynamicMenu: (DynamicMenuItem | SidebarItem)[] = [];

  try {
    const configCtx = useTenantConfig();
    if (configCtx?.companyName) {
      companyName = configCtx.companyName;
    }
  } catch {
    // Context fallback
  }

  try {
    const navCtx = useNavigation();
    if (navCtx?.menu && navCtx.menu.length > 0) {
      dynamicMenu = navCtx.menu;
    }
  } catch {
    // Context fallback
  }

  // Fallback to static sidebar items if dynamic menu is not populated
  const displayItems = dynamicMenu.length > 0 ? dynamicMenu : sidebarItems;

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white dark:bg-slate-900 text-[#64748B] dark:text-slate-300
      transition-all duration-300 z-40 border-r border-[#E5EAEB] dark:border-slate-800 flex flex-col shadow-xs
      ${isOpen ? "w-64" : "w-20"}`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-6 bg-white hover:bg-[#E7F1F2] text-[#64748B] hover:text-[#3F7C82] p-1.5 rounded-full shadow-sm transition-transform duration-200 z-50 border border-[#D9E2E3] cursor-pointer"
        title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? (
          <ChevronLeftIcon className="w-3.5 h-3.5" />
        ) : (
          <ChevronRightIcon className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
        <div className="w-9 h-9 rounded-xl bg-[#47868C] flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
          <TruckIcon className="w-4 h-4 text-white" />
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm tracking-tight text-[#111827] dark:text-white truncate" title={companyName || "FleetPulse TMS"}>
              {companyName || "FleetPulse TMS"}
            </h1>
            <p className="text-[11px] font-medium text-[#47868C] dark:text-teal-400 truncate">
              {orgName || "Enterprise Logistics Cloud"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
        {displayItems.map((item) => {
          // Simple single link
          if (!item.children || item.children.length === 0) {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.id || item.title}
                href={item.path || "#"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 group ${
                  isActive
                    ? "bg-[#E7F1F2] text-[#3F7C82] font-semibold border-l-3 border-[#47868C]"
                    : "text-[#64748B] hover:text-[#111827] hover:bg-[#F5FAFA] dark:hover:bg-slate-800/60 font-medium"
                }`}
                title={!isOpen ? item.title : undefined}
              >
                <div className={`shrink-0 ${isActive ? "text-[#47868C]" : "text-[#64748B] group-hover:text-[#111827]"}`}>
                  {getIcon(item.icon)}
                </div>
                {isOpen && (
                  <div className="flex items-center justify-between w-full overflow-hidden">
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E7F1F2] text-[#3F7C82]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          }

          // Dropdown menu
          const isDropdownOpen = openMenu === (item.id || item.title);
          const hasActiveChild = item.children.some((c) => pathname === c.path);

          return (
            <div key={item.id || item.title} className="space-y-0.5">
              <button
                type="button"
                onClick={() => setOpenMenu(isDropdownOpen ? null : (item.id || item.title))}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 group cursor-pointer ${
                  hasActiveChild
                    ? "text-[#3F7C82] bg-[#E7F1F2]/60 font-semibold"
                    : "text-[#64748B] hover:text-[#111827] hover:bg-[#F5FAFA] dark:hover:bg-slate-800/50 font-medium"
                }`}
                title={!isOpen ? item.title : undefined}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`shrink-0 ${hasActiveChild ? "text-[#47868C]" : "text-[#64748B] group-hover:text-[#111827]"}`}>
                    {getIcon(item.icon)}
                  </div>
                  {isOpen && <span className="truncate">{item.title}</span>}
                </div>
                {isOpen && (
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E7F1F2] text-[#3F7C82]">
                        {item.badge}
                      </span>
                    )}
                    <ChevronDownIcon
                      className={`w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#64748B] transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                )}
              </button>

              {/* Sub-items */}
              {isOpen && isDropdownOpen && (
                <div className="ml-5 pl-3 border-l border-[#E5EAEB] dark:border-slate-800 space-y-0.5 py-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.path;
                    return (
                      <Link
                        key={child.id || child.title}
                        href={child.path || "#"}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-150 ${
                          isChildActive
                            ? "bg-[#E7F1F2] text-[#3F7C82] font-semibold border-l-2 border-[#47868C]"
                            : "text-[#64748B] hover:text-[#111827] hover:bg-[#F5FAFA] dark:hover:bg-slate-800/60 font-medium"
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isChildActive ? "bg-[#47868C]" : "bg-[#94A3B8]"}`} />
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
      <div className="p-3 border-t border-[#E5EAEB] dark:border-slate-800 bg-[#F7F8F8] dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#E7F1F2] border border-[#D9E2E3] flex items-center justify-center text-[#3F7C82] font-bold text-xs shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            {isOpen && (
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-[#111827] dark:text-white truncate">
                  {user?.fullName || user?.username || "Admin"}
                </div>
                <div className="text-[10px] text-[#64748B] truncate">
                  {user?.role || "Fleet Manager"}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-[#94A3B8] hover:text-[#D95C5C] hover:bg-white rounded-lg transition cursor-pointer"
            title="Sign Out"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}