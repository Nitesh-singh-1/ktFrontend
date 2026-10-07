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
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    icon: "home",
    permissionKey: "dashboard.view",
  },
  {
    id: "consignments",
    title: "Consignments (GR)",
    icon: "package",
    permissionKey: "consignments.module",
    children: [
      {
        id: "consignments.all",
        title: "All Shipments",
        path: "/shipments",
        icon: "fileText",
        permissionKey: "consignments.view",
      },
      {
        id: "consignments.create",
        title: "New Consignment",
        path: "/shipments/create",
        icon: "package",
        permissionKey: "consignments.create",
      },
    ],
  },
  {
    id: "trips",
    title: "Trip Manifests",
    path: "/trips",
    icon: "truck",
    permissionKey: "trips.view",
  },
  {
    id: "pod",
    title: "POD & Deliveries",
    path: "/pod",
    icon: "fileText",
    permissionKey: "pod.view",
  },
  {
    id: "master_data",
    title: "Master Data",
    icon: "cog",
    permissionKey: "masterdata.module",
    children: [
      {
        id: "master_data.parties",
        title: "Party Directory",
        path: "/customers",
        icon: "fileText",
        permissionKey: "parties.view",
      },
      {
        id: "master_data.fleet",
        title: "Fleet & Stations",
        path: "/fleet",
        icon: "truck",
        permissionKey: "fleet.view",
      },
    ],
  },
  {
    id: "vendors",
    title: "Market Vendors & Hire",
    path: "/vendors",
    icon: "truck",
    permissionKey: "vendors.view",
  },
  {
    id: "billing",
    title: "Billing & Invoices",
    path: "/billing",
    icon: "fileText",
    permissionKey: "billing.view",
  },
  {
    id: "claims",
    title: "Damage & Claims",
    path: "/claims",
    icon: "info",
    permissionKey: "claims.view",
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    path: "/reports",
    icon: "barChart",
    permissionKey: "reports.view",
    children: [
      {
        id: "reports.booking_register",
        title: "Booking Register",
        path: "/reports?tab=booking_register",
        icon: "fileText",
        permissionKey: "reports.booking_register",
      },
      {
        id: "reports.tax_summary",
        title: "GST Tax Summary",
        path: "/reports?tab=tax_summary",
        icon: "fileText",
        permissionKey: "reports.tax_summary",
      },
      {
        id: "reports.party_outstanding",
        title: "Customer Outstanding",
        path: "/reports?tab=party_outstanding",
        icon: "fileText",
        permissionKey: "reports.party_outstanding",
      },
      {
        id: "reports.trip_profitability",
        title: "Trip Profitability",
        path: "/reports?tab=trip_profitability",
        icon: "fileText",
        permissionKey: "reports.trip_profitability",
      },
      {
        id: "reports.vendor_payables",
        title: "Vendor Payables",
        path: "/reports?tab=vendor_payables",
        icon: "fileText",
        permissionKey: "reports.vendor_payables",
      },
    ],
  },
  {
    id: "tracking",
    title: "Live Tracker",
    path: "/tracking",
    icon: "info",
    permissionKey: "tracking.view",
  },
  {
    id: "clients",
    title: "Client Management",
    path: "/clients",
    icon: "lock",
    permissionKey: "saas.tenants.manage",
    badge: "SaaS",
  },
  {
    id: "system",
    title: "System & Settings",
    icon: "settings",
    children: [
      {
        id: "system.settings",
        title: "SaaS Configuration",
        path: "/settings",
        icon: "settings",
        permissionKey: "settings.manage",
      },
      {
        id: "system.onboard",
        title: "Tenant Onboarding",
        path: "/onboard",
        icon: "info",
        permissionKey: "tenant.onboard",
      },
      {
        id: "system.forgot_password",
        title: "Forgot Password",
        path: "/forgot-password",
        icon: "lock",
        permissionKey: "auth.password_reset",
      },
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
    if (isLoading) return false; // deny during load; consumers use isLoading to show spinner
    if (permissions.includes("*") || permissions.includes("admin")) return true;
    return permissions.some((p) => p.toLowerCase() === permissionKey.toLowerCase());
  };

  const isReportEnabled = (reportKey: string): boolean => {
    const reportMenu = menu.find((m) => m.id === "reports");
    if (!reportMenu || !reportMenu.children) return true;
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
