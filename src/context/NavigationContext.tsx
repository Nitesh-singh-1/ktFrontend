"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { navigationService, DynamicMenuItem } from "../../services/navigationService";

interface NavigationContextType {
  menu: DynamicMenuItem[];
  permissions: string[];
  isLoading: boolean;
  error: boolean;
  hasPermission: (permissionKey?: string) => boolean;
  isReportEnabled: (reportKey: string) => boolean;
  refreshNavigation: () => Promise<void>;
}

// TASK-045 Phase 3: `defaultStaticMenu` removed. The API is now authoritative;
// when it fails, the Sidebar renderer detects `error: true` + empty `menu` and
// renders the minimal fallback from `src/app/config/sidebar.ts`.

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menu, setMenu] = useState<DynamicMenuItem[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

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
        setError(false);
      } else {
        setMenu([]);
        setError(true);
      }

      if (permsRes.status === "fulfilled" && permsRes.value) {
        setPermissions(permsRes.value);
      }
    } catch (err) {
      console.warn("Navigation API failed, using fallback sidebar:", err);
      setMenu([]);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  // Phase 2 (TASK-042) onward: `permissions` contains action-split keys emitted by the
  // backend (e.g. `billing.bill_book.view`, `.create`, `.edit`, `.delete`). Callers must
  // pass the full action-split key; exact-match comparison below is unchanged.
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
        error,
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
