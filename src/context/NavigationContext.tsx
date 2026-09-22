"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { navigationService, DynamicMenuItem } from "../../services/navigationService";

interface NavigationContextType {
  menu: DynamicMenuItem[];
  permissions: string[];
  isLoading: boolean;
  hasPermission: (permissionKey?: string) => boolean;
  isReportEnabled: (reportKey: string) => boolean;
  refreshNavigation: () => Promise<void>;
}

const defaultStaticMenu: DynamicMenuItem[] = [
  { id: "dashboard", title: "Dashboard", path: "/dashboard", icon: "home", permissionKey: "dashboard.view" },
  {
    id: "gr",
    title: "GR / Consignments",
    icon: "package",
    permissionKey: "gr.module",
    children: [
      { id: "gr.list", title: "View Bills", path: "/dashboard/gr-list", icon: "list", permissionKey: "gr.view" },
      { id: "gr.entry", title: "GR Entry", path: "/dashboard/gr-entry", icon: "plusCircle", permissionKey: "gr.create" },
    ],
  },
  {
    id: "challan",
    title: "Challan",
    icon: "truck",
    permissionKey: "challan.module",
    children: [
      { id: "challan.list", title: "View Challans", path: "/dashboard/challan-list", icon: "list", permissionKey: "challan.view" },
      { id: "challan.entry", title: "Challan Entry", path: "/dashboard/challan-entry", icon: "plusCircle", permissionKey: "challan.create" },
    ],
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    path: "/reports",
    icon: "barChart",
    permissionKey: "reports.view",
    children: [
      { id: "reports.booking_register", title: "Booking Register", path: "/reports?tab=booking_register", icon: "fileText", permissionKey: "reports.booking_register" },
      { id: "reports.tax_summary", title: "GST Tax Summary", path: "/reports?tab=tax_summary", icon: "fileText", permissionKey: "reports.tax_summary" },
      { id: "reports.party_outstanding", title: "Customer Outstanding", path: "/reports?tab=party_outstanding", icon: "fileText", permissionKey: "reports.party_outstanding" },
      { id: "reports.trip_profitability", title: "Trip Profitability", path: "/reports?tab=trip_profitability", icon: "fileText", permissionKey: "reports.trip_profitability" },
      { id: "reports.vendor_payables", title: "Vendor Payables", path: "/reports?tab=vendor_payables", icon: "fileText", permissionKey: "reports.vendor_payables" },
    ],
  },
  {
    id: "system",
    title: "System & SaaS",
    icon: "cog",
    children: [
      { id: "system.settings", title: "Settings & Config", path: "/settings", icon: "settings", permissionKey: "settings.manage" },
      { id: "system.forgot_password", title: "Forgot Password", path: "/forgot-password", icon: "lock", permissionKey: "auth.password_reset" },
      { id: "system.about", title: "About", path: "/about", icon: "info", permissionKey: "general.about" },
    ],
  },
];

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menu, setMenu] = useState<DynamicMenuItem[]>(defaultStaticMenu);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNavigation = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setIsLoading(false);
        return;
      }

      const [menuRes, permsRes] = await Promise.allSettled([
        navigationService.getMenu(),
        navigationService.getPermissions(),
      ]);

      if (menuRes.status === "fulfilled" && menuRes.value && menuRes.value.length > 0) {
        setMenu(menuRes.value);
      }

      if (permsRes.status === "fulfilled" && permsRes.value) {
        setPermissions(permsRes.value);
      }
    } catch (err) {
      console.warn("Navigation API failed, using configuration defaults:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  const hasPermission = (permissionKey?: string): boolean => {
    if (!permissionKey) return true;
    if (permissions.length === 0) return true; // Default permissive until permissions load
    return permissions.some((p) => p.toLowerCase() === permissionKey.toLowerCase());
  };

  const isReportEnabled = (reportKey: string): boolean => {
    const reportMenu = menu.find((m) => m.id === "reports");
    if (!reportMenu || !reportMenu.children) return false;
    return reportMenu.children.some(
      (c) => c.id.toLowerCase() === `reports.${reportKey.toLowerCase()}` || c.id.toLowerCase() === reportKey.toLowerCase()
    );
  };

  return (
    <NavigationContext.Provider
      value={{
        menu,
        permissions,
        isLoading,
        hasPermission,
        isReportEnabled,
        refreshNavigation: fetchNavigation,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
