"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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

  // `background` refetches (tab focus / visibility / assign-revoke event) update the
  // data SILENTLY: they do NOT flip isLoading (so PagePermissionGuard never flashes its
  // spinner), and on failure they KEEP the current menu instead of blanking it. Only the
  // first/foreground load shows the loading state. This removes the on-focus flicker.
  const initialLoadedRef = useRef(false);
  const lastFetchRef = useRef(0);
  const inFlightRef = useRef(false);

  const fetchNavigation = useCallback(async (opts?: { background?: boolean }) => {
    const background = opts?.background === true;
    if (inFlightRef.current) return; // coalesce concurrent refetches (focus + visibilitychange fire together)
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setIsLoading(false);
      return;
    }
    inFlightRef.current = true;
    if (!background || !initialLoadedRef.current) setIsLoading(true);
    try {
      const [menuRes, permsRes] = await Promise.allSettled([
        navigationService.getMenu(),
        navigationService.getPermissions(),
      ]);

      if (menuRes.status === "fulfilled" && menuRes.value && menuRes.value.length > 0) {
        setMenu(menuRes.value);
        setError(false);
      } else if (!background) {
        // Only blank the menu on a foreground failure; a background refetch keeps what's shown.
        setMenu([]);
        setError(true);
      }

      if (permsRes.status === "fulfilled" && permsRes.value) {
        setPermissions(permsRes.value);
      }
      lastFetchRef.current = Date.now();
      initialLoadedRef.current = true;
    } catch (err) {
      console.warn("Navigation API failed:", err);
      if (!background) {
        setMenu([]);
        setError(true);
      }
    } finally {
      inFlightRef.current = false;
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
      fetchNavigation({ background: true });
    };
    window.addEventListener(NAVIGATION_REFRESH_EVENT, handler);
    return () => window.removeEventListener(NAVIGATION_REFRESH_EVENT, handler);
  }, [fetchNavigation]);

  // TASK-053: Re-pull menu + permissions when the tab regains focus OR becomes visible, so a
  // module revoked in another session/tab (platform admin flipping tenant_modules.enabled_until)
  // disappears here WITHOUT a manual reload or re-login. We listen to BOTH `focus` and
  // `visibilitychange`: `focus` alone misses the common "switch back to an already-focused tab"
  // and mobile foreground cases, whereas `visibilitychange` → visibilityState === "visible"
  // fires reliably on tab/app re-activation. Each handler re-pulls /navigation/menu (the
  // authoritative source); there is deliberately NO client-side menu cache to invalidate.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Throttle: focus + visibilitychange both fire on a tab switch, and rapid switching
    // would otherwise spam the API. Coalesce to at most one background refetch per 5s.
    const THROTTLE_MS = 5000;
    const maybeRefetch = () => {
      if (Date.now() - lastFetchRef.current < THROTTLE_MS) return;
      fetchNavigation({ background: true });
    };
    const onFocus = () => {
      maybeRefetch();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        maybeRefetch();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchNavigation]);

  // TASK-053: the backend is now authoritative. `/api/navigation/menu` already returns
  // exactly the items a user may see (structural join on menu_items.module_id ∈ enabled
  // tenant_modules), so the SIDEBAR no longer calls hasPermission on API items at all.
  // hasPermission is now ONLY for non-menu UI gating (action buttons) and route guards
  // (PagePermissionGuard), checked against `/api/navigation/permissions` — which, with the
  // backend string-drift gone, returns a CLEAN effective set: the user's granted permission
  // keys in full dotted action form (e.g. `consignments.create.create`, `billing.invoices.view`,
  // `delivery_settlement.view`, `accounting.accounts.view`) plus the injected admin-gate keys
  // (`settings.manage`, `users.manage`, `system.settings`) and `dashboard`/`dashboard.view`.
  //
  // The old `.module` prefix guesser and the large alias map only existed to paper over the old
  // backend string drift and are REMOVED. We keep: EXACT match, wildcard (`*`, scoped `x.*`), and
  // ONE base-feature prefix fallback. The single prefix fallback is retained per coordination
  // with the TASK-053 backend teammate: it is deleting the server-side prefix-hop, so the clean
  // set NO LONGER carries derived parent keys (`billing.invoices.view` no longer also emits
  // `billing.invoices`/`billing`). The base-prefix match lets a bare parent/feature query (e.g.
  // `consignments`, `billing`) still resolve when the user holds any granular key under it. It is
  // directional-safe: it only grants when the QUERY is a prefix of a HELD key (query = a parent),
  // never the reverse, so it can never grant a more-specific action than the user actually has.
  const hasPermission = (permissionKey?: string): boolean => {
    if (!permissionKey) return true;
    if (isLoading) return false; // deny during initial load
    if (permissions.includes("*")) return true;

    const lowerKey = permissionKey.toLowerCase().trim();
    if (!lowerKey) return true;

    return permissions.some((p) => {
      const pl = p.toLowerCase();
      // Exact match, or a scoped wildcard grant (e.g. a permission stored as "consignments.*").
      if (pl === lowerKey || (pl.endsWith(".*") && lowerKey.startsWith(pl.slice(0, -2)))) return true;
      // Base-feature prefix: a bare parent/feature query resolves when any granular key is held under it.
      if (pl.startsWith(lowerKey + ".")) return true;
      return false;
    });
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
