import { baseService } from "./baseservice";

export interface DynamicMenuItem {
  id: string;
  title: string;
  path?: string;
  icon?: string;
  permissionKey?: string;
  badge?: string;
  children?: DynamicMenuItem[];
}

export interface ReportEntitlementItem {
  reportKey: string;
  title: string;
  description: string;
  category: string;
  path: string;
  isEnabled: boolean;
}

export interface TenantMenuEntitlements {
  tenantId: string;
  planTier?: string; // Starter, Professional, Enterprise, Custom
  // TASK-049 — `moduleCodes` is the new canonical shape (returned alongside the
  // legacy `enabledMenuKeys` during the one-release transition window).
  // Readers should prefer `moduleCodes` and fall back to `enabledMenuKeys`.
  moduleCodes?: string[];
  enabledMenuKeys: string[];
  reports: ReportEntitlementItem[];
  // TASK-049b — `roleOverridesJson` and `userOverridesJson` DTO string fields
  // deleted; the backend no longer round-trips the override maps. On save the
  // frontend sends `roleOverrides` / `userOverrides` as `Record<string,string[]>`
  // via `UpdateTenantEntitlementsPayload` below.
}

// TASK-049 / TASK-049b — canonical PUT shape for both
// `/configuration/menu-entitlements` (self) and
// `/configuration/tenants/{id}/menu-entitlements` (another tenant) as well
// as `/tenant/{id}/entitlements` (platform-admin /clients). Backend reads
// `moduleCodes` as the single source of truth and writes `tenant_modules`
// rows from it. NEVER include `enabledMenuKeys`, legacy aliases (`gr`,
// `challan`), or dotted strings (`system.settings`, `gr.list`) here.
export interface UpdateTenantEntitlementsPayload {
  moduleCodes: string[];
  reports?: ReportEntitlementItem[];
  roleOverrides?: Record<string, string[]>;
  userOverrides?: Record<string, string[]>;
}

export interface TenantListItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface TenantUserItem {
  id: number;
  username: string;
  fullName?: string;
  role?: string;
  mobile?: string;
  isActive?: boolean;
}

// TASK-048: Shared browser event the NavigationContext listens to so any
// caller (e.g. the platform-admin clients page after a successful assign/revoke)
// can force the sidebar to re-pull /api/navigation/menu without a hard refresh.
export const NAVIGATION_REFRESH_EVENT = "kt:navigation:refresh";

export const navigationService = {
  getMenu: () => baseService.get<DynamicMenuItem[]>("/navigation/menu"),

  getPermissions: () => baseService.get<string[]>("/navigation/permissions"),

  /**
   * TASK-048 — Force the sidebar to re-fetch its menu after a per-tenant
   * entitlement change. Fire-and-forget: dispatches a window event the
   * NavigationContext listens to, and also returns the fresh /navigation/menu
   * payload so callers may await it if they need to confirm the new state.
   *
   * This never touches the global menu_items catalog — visibility is driven
   * purely by GET /api/navigation/menu, which resolves tenant_entitlement_subscriptions
   * on the backend. No local cache layer exists today; if one is added later,
   * invalidate it here before the refetch.
   */
  refreshMenu: async (): Promise<DynamicMenuItem[]> => {
    const fresh = await baseService.get<DynamicMenuItem[]>("/navigation/menu");
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent(NAVIGATION_REFRESH_EVENT));
      } catch {
        // non-browser env — context will re-fetch on next mount
      }
    }
    return fresh;
  },

  getAllTenants: () => baseService.get<TenantListItem[]>("/configuration/tenants"),

  getTenantUsers: () => baseService.get<TenantUserItem[]>("/configuration/users"),

  getMenuEntitlements: () =>
    baseService.get<TenantMenuEntitlements>("/configuration/menu-entitlements"),

  getMenuEntitlementsForTenant: (tenantId: string) =>
    baseService.get<TenantMenuEntitlements>(`/configuration/tenants/${tenantId}/menu-entitlements`),

  updateMenuEntitlements: (data: UpdateTenantEntitlementsPayload) =>
    baseService.put<TenantMenuEntitlements>("/configuration/menu-entitlements", data),

  updateMenuEntitlementsForTenant: (tenantId: string, data: UpdateTenantEntitlementsPayload) =>
    baseService.put<TenantMenuEntitlements>(`/configuration/tenants/${tenantId}/menu-entitlements`, data),
};
