"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { navigationService, DynamicMenuItem, NAVIGATION_REFRESH_EVENT } from "../../services/navigationService";

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

  // TASK-048: Platform-admin assign/revoke flows call navigationService.refreshMenu(),
  // which dispatches NAVIGATION_REFRESH_EVENT. Re-pull the menu so the sidebar
  // reflects the new tenant_entitlement_subscriptions state without a hard reload.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      fetchNavigation();
    };
    window.addEventListener(NAVIGATION_REFRESH_EVENT, handler);
    return () => window.removeEventListener(NAVIGATION_REFRESH_EVENT, handler);
  }, [fetchNavigation]);

  // Phase 2 (TASK-042) & TASK-047: `permissions` contains action-split keys (e.g. `consignments.view`, `billing.view`, `master_data.parties.view`).
  // hasPermission supports exact keys, wildcard `*`, base-feature prefixes (`consignments.create`), parent `.module` keys, and legacy aliases.
  const hasPermission = (permissionKey?: string): boolean => {
    if (!permissionKey) return true;
    if (isLoading) return false; // deny during initial load
    if (permissions.includes("*")) return true;

    const lowerKey = permissionKey.toLowerCase().trim();
    if (!lowerKey) return true;

    // 1. Direct exact match or wildcard prefix (e.g. "consignments.*")
    if (
      permissions.some((p) => {
        const pl = p.toLowerCase();
        return pl === lowerKey || (pl.endsWith(".*") && lowerKey.startsWith(pl.slice(0, -2)));
      })
    ) {
      return true;
    }

    // 2. Parent module key check (e.g. "consignments.module", "masterdata.module", "billing.module")
    if (lowerKey.endsWith(".module")) {
      const modPrefix = lowerKey.replace(".module", "");
      const normalizedPrefix = modPrefix === "masterdata" ? "master_data" : modPrefix;
      return permissions.some((p) => {
        const pl = p.toLowerCase();
        return (
          pl.startsWith(modPrefix + ".") ||
          pl.startsWith(normalizedPrefix + ".") ||
          pl === modPrefix ||
          pl === normalizedPrefix
        );
      });
    }

    // 3. Base Feature Key check (e.g. "consignments.create", "reports.booking_register", "trips", "consignments")
    // If user has any granular action key under this feature (e.g. "consignments.create.view", "consignments.create.create", "reports.booking_register.view")
    if (
      permissions.some((p) => {
        const pl = p.toLowerCase();
        return pl.startsWith(lowerKey + ".") || pl === lowerKey;
      })
    ) {
      return true;
    }

    // 4. Legacy and shorthand aliases:
    const aliasMap: Record<string, string[]> = {
      "parties.view": ["master_data.parties.view", "master_data.parties", "parties.view"],
      "master_data.parties.view": ["master_data.parties.view", "master_data.parties", "parties.view"],
      "fleet.view": ["master_data.fleet.view", "master_data.fleet", "fleet.view"],
      "master_data.fleet.view": ["master_data.fleet.view", "master_data.fleet", "fleet.view"],
      "master_data.compliance.view": ["master_data.compliance.view", "master_data.compliance"],
      "master_data.tyres.view": ["master_data.tyres.view", "master_data.tyres"],
      "master_data.spares.view": ["master_data.spares.view", "master_data.spares"],
      "master_data.loans.view": ["master_data.loans.view", "master_data.loans"],
      "rates.view": ["master_data.rates.view", "master_data.rates", "rates.view"],
      "master_data.rates.view": ["master_data.rates.view", "master_data.rates", "rates.view"],
      "users.manage": ["system.users.view", "system.users.create", "system.users.edit", "system.users.delete", "users.manage"],
      "settings.manage": ["system.settings.view", "system.settings.edit", "settings.manage"],
      "saas.tenants.manage": ["system.clients.view", "system.clients", "saas.tenants.manage"],
    };

    const aliases = aliasMap[lowerKey];
    if (aliases) {
      if (
        permissions.some((p) => {
          const pl = p.toLowerCase();
          return aliases.some((a) => pl === a || pl.startsWith(a + ".") || a.startsWith(pl + "."));
        })
      ) {
        return true;
      }
    }

    return false;
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
