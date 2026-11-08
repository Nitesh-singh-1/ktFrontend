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

/**
 * @deprecated TASK-054 transition shim. The clean canonical entitlement read
 * shape is `TenantEntitlements` in `tenantService.ts` (API contract §B:
 * `{ tenantId, planCode?, moduleCodes, pageRestrictions, reports }`).
 *
 * This legacy interface is retained ONLY so the not-yet-migrated
 * `/settings` + `/clients` pages (owned by frontend-ui) still compile during
 * the migration window. `enabledMenuKeys` and `planTier` are NO LONGER
 * returned by the backend — they remain here as optional read-fallbacks until
 * frontend-ui drops those reads, after which this interface is deleted.
 */
export interface TenantMenuEntitlements {
  tenantId: string;
  /** @deprecated use `planCode` (the plan tier string). */
  planTier?: string;
  planCode?: string;
  moduleCodes?: string[];
  pageRestrictions?: Record<string, string[]>;
  /** @deprecated no longer served by the backend; transition fallback only. */
  enabledMenuKeys?: string[];
  reports: ReportEntitlementItem[];
}

/**
 * @deprecated TASK-054 transition shim. The clean canonical write shape is
 * `UpdateTenantEntitlements` in `tenantService.ts` (API contract §B:
 * `{ moduleCodes, pageRestrictions?, reports? }`).
 *
 * `roleOverrides` / `userOverrides` are REMOVED from the clean contract and are
 * NEVER emitted on the wire — the `updateMenuEntitlements*` service functions
 * strip them before the PUT. They remain as optional, ignored fields here only
 * so the un-migrated `/settings` page literal still compiles. Delete once
 * frontend-ui stops populating them.
 */
export interface UpdateTenantEntitlementsPayload {
  moduleCodes: string[];
  pageRestrictions?: Record<string, string[]>;
  reports?: ReportEntitlementItem[];
  /** @deprecated ignored/stripped before the PUT — not part of the clean contract. */
  roleOverrides?: Record<string, string[]>;
  /** @deprecated ignored/stripped before the PUT — not part of the clean contract. */
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
    baseService.put<TenantMenuEntitlements>(
      "/configuration/menu-entitlements",
      toCleanEntitlementBody(data),
    ),

  updateMenuEntitlementsForTenant: (tenantId: string, data: UpdateTenantEntitlementsPayload) =>
    baseService.put<TenantMenuEntitlements>(
      `/configuration/tenants/${tenantId}/menu-entitlements`,
      toCleanEntitlementBody(data),
    ),
};

/**
 * TASK-054 — strip the legacy `roleOverrides` / `userOverrides` / `enabledMenuKeys`
 * fields from an entitlement write payload so the clean contract body
 * (`{ moduleCodes, pageRestrictions?, reports? }`) is the ONLY thing that ever
 * reaches the backend, regardless of what an un-migrated caller passes.
 */
function toCleanEntitlementBody(data: UpdateTenantEntitlementsPayload): {
  moduleCodes: string[];
  pageRestrictions?: Record<string, string[]>;
  reports?: ReportEntitlementItem[];
} {
  return {
    moduleCodes: data.moduleCodes,
    ...(data.pageRestrictions ? { pageRestrictions: data.pageRestrictions } : {}),
    ...(data.reports ? { reports: data.reports } : {}),
  };
}
