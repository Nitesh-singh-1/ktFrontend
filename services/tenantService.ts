import { baseService } from "./baseservice";
import { authService } from "./authService";
import { TenantOnboardingRequest, TenantOnboardingResponse } from "@/types/shipment";
import {
  ReportEntitlementItem,
  UpdateTenantEntitlementsPayload,
} from "./navigationService";

// TASK-049b — `UpdateTenantEntitlementsPayload` is now defined in
// `./navigationService.ts` so both navigationService and tenantService can
// share one source of truth. Re-exported here for existing importers.
// @deprecated TASK-054 — new code should use `UpdateTenantEntitlements` below.
export type { UpdateTenantEntitlementsPayload };

// ────────────────────────────────────────────────────────────────────────────
// TASK-054 — clean RBAC/menu/entitlement contract types (API contract §A/§B/§C/§G).
// These are the canonical shapes frontend-ui consumes. The legacy
// `TenantMenuEntitlements` / `UpdateTenantEntitlementsPayload` (navigationService)
// are deprecated transition shims kept only until the un-migrated pages adopt these.
// ────────────────────────────────────────────────────────────────────────────

/** §A — a navigable page (menu_items row with a path, or a parent group) of a module. */
export interface PageCatalogItem {
  pageKey: string;
  title: string;
  path?: string;
  parentKey?: string;
  displayOrder: number;
}

/** §A — a module together with its page-level entitlement picker options. */
export interface ModuleWithPages {
  code: string;
  name: string;
  isPremium: boolean;
  displayOrder: number;
  pages: PageCatalogItem[];
}

/**
 * §B — the per-tenant entitlement ceiling (platform-admin controlled).
 * `GET /tenant/{id}/entitlements`. `planCode` is the plan TIER string
 * (Starter / Professional / Enterprise); undefined = custom (no plan assigned).
 * A module absent from `pageRestrictions` = ALL its pages are entitled.
 */
export interface TenantEntitlements {
  tenantId: string;
  planCode?: string;
  moduleCodes: string[];
  pageRestrictions: Record<string, string[]>;
  reports: ReportEntitlementItem[];
  /**
   * @deprecated TASK-054 transition shim — the backend no longer returns this.
   * Retained so the un-migrated `/clients` page's fallback read compiles; it is
   * always undefined at runtime now. Delete once frontend-ui drops the fallback.
   */
  enabledMenuKeys?: string[];
}

/**
 * §B — the ONLY entitlement write shape. `PUT /tenant/{id}/entitlements`.
 * Omit `pageRestrictions[moduleCode]` (or pass []) = no page restriction for
 * that module. No `enabledMenuKeys` / `roleOverrides` / `userOverrides`.
 */
export interface UpdateTenantEntitlements {
  moduleCodes: string[];
  pageRestrictions?: Record<string, string[]>;
  reports?: ReportEntitlementItem[];
}

/** §G — platform tenant console list row. */
export interface TenantSummary {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  planCode?: string;
  moduleCount: number;
  userCount: number;
  createdAt: string;
}

export interface TenantDetailModule {
  code: string;
  name: string;
  pageRestricted: boolean;
}

export interface TenantDetailRole {
  code: string;
  name: string;
  isSystem: boolean;
  userCount: number;
}

export interface TenantDetailUser {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  isActive: boolean;
  roleCodes: string[];
}

/** §G — full platform tenant console drill-down. */
export interface TenantDetail {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  planCode?: string;
  modules: TenantDetailModule[];
  roles: TenantDetailRole[];
  users: TenantDetailUser[];
}

export interface TenantAdminListItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  adminUsername?: string;
  adminFullName?: string;
  adminMobile?: string;
  userCount: number;
  subscriptionPlanTier: string;
  subscriptionStatus: string;
  monthlyPrice: number;
  enabledReportKeys: string[];
  enabledReportsCount: number;
}

export interface TenantOnboardingPayload {
  organizationName: string;
  organizationCode: string;
  adminUsername: string;
  adminPassword: string;
  adminFullName: string;
  adminMobile?: string;
  planTier?: string;
  enabledModules?: string[];
  enabledReportKeys?: string[];
  // TASK-046 Phase 1: platform-admin-only fields. Ignored on public /tenant/onboard.
  adminRoleCode?: string;
  enabledModuleCodes?: string[];
}

// TASK-046 Phase 1: GET /api/admin/roles/system-templates row.
export interface SystemRoleTemplate {
  code: string;
  name: string;
  description?: string;
}

// Phase 1 keystone follow-up: GET /api/admin/modules — the live module catalog
// from the backend `modules` table. The /clients assign/revoke UI renders its
// checklist from this (NOT a hardcoded frontend list), so a real module such as
// the paid `accounting` add-on can never be silently missing / unprovisionable.
export interface ModuleCatalogItem {
  code: string;
  name: string;
  description?: string;
  isPremium: boolean;
  displayOrder: number;
}

export interface TenantOnboardingResult {
  success: boolean;
  message: string;
  tenantId?: string;
  organizationName?: string;
  organizationCode?: string;
  token?: string;
  planTier?: string;
  enabledModules?: string[];
  adminUser?: {
    id: number;
    username: string;
    fullName: string;
    role: string;
    mobile?: string;
  };
}

export const tenantService = {
  // Public Onboarding flow with session persistence
  onboard: async (data: TenantOnboardingRequest): Promise<TenantOnboardingResponse> => {
    const res = await baseService.post<TenantOnboardingResponse>("/tenant/onboard", data);

    if (res.success && res.token) {
      authService.setSession(
        res.token,
        res.adminUser || res.user || {
          username: data.adminUsername,
          fullName: data.adminFullName,
          role: "TenantAdmin",
          mobile: data.adminMobile,
        },
        res.tenantId,
        res.organizationName || data.organizationName
      );
    }

    return res;
  },

  // Get all clients with full SaaS details
  getAllTenants: () => baseService.get<TenantAdminListItem[]>("/tenant"),

  // Get tenant by ID
  getTenantById: (id: string) => baseService.get<any>(`/tenant/${id}`),

  // Onboard new client with initial modules and admin
  onboardTenant: (data: TenantOnboardingPayload) =>
    baseService.post<TenantOnboardingResult>("/tenant/onboard", data),

  // TASK-046 Phase 1: platform-admin-only onboarding. Respects adminRoleCode
  // and the explicit enabledModuleCodes array (writes tenant_modules rows).
  onboardTenantByAdmin: (data: TenantOnboardingPayload) =>
    baseService.post<TenantOnboardingResult>("/admin/tenants", {
      organizationName: data.organizationName,
      organizationCode: data.organizationCode,
      adminUsername: data.adminUsername,
      adminPassword: data.adminPassword,
      adminFullName: data.adminFullName,
      adminMobile: data.adminMobile,
      adminEmail: (data as any).adminEmail,
      planTier: data.planTier,
      adminRoleCode: data.adminRoleCode || "admin",
      enabledModuleCodes: data.enabledModuleCodes || [],
      enabledReportKeys: data.enabledReportKeys || [],
    }),

  // TASK-046 Phase 1: fetch the 7 seeded system role templates for the admin wizard.
  getSystemRoleTemplates: () =>
    baseService.get<SystemRoleTemplate[]>("/admin/roles/system-templates"),

  // Phase 1 keystone follow-up: live module catalog for the /clients
  // assign/revoke checklist (replaces the hardcoded ALL_MODULE_CODES).
  getModuleCatalog: () =>
    baseService.get<ModuleCatalogItem[]>("/admin/modules"),

  // TASK-054 §A — module catalog WITH each module's navigable pages, for the
  // page-level entitlement picker on /clients. Source of truth for what pages
  // exist (do NOT hardcode; some modules have fewer page-restrictable pages
  // than menu rows — e.g. accounting).
  getCatalog: () =>
    baseService.get<ModuleWithPages[]>("/admin/catalog"),

  // TASK-054 §A — the navigable pages of a single module.
  getModulePages: (code: string) =>
    baseService.get<PageCatalogItem[]>(`/admin/modules/${code}/pages`),

  // Toggle active/inactive status
  updateStatus: (id: string, isActive: boolean) =>
    baseService.put<{ success: boolean; message: string }>(`/tenant/${id}/status`, { isActive }),

  // Update subscription plan tier.
  // @deprecated TASK-054 — kept for ManagePlanModal (expects { success, message }
  // from the legacy `{ planTier }` body). New code should use `assignPlan`, which
  // speaks the clean `{ planCode }` contract. Both hit PUT /tenant/{id}/plan.
  updatePlan: (id: string, planTier: string) =>
    baseService.put<{ success: boolean; message: string }>(`/tenant/${id}/plan`, { planTier }),

  // TASK-054 §B — assign a plan: seeds tenant_modules(+pages) from the plan,
  // replacing the current ceiling. `planCode` is the plan TIER string
  // (Starter/Professional/Enterprise). Caller then re-loads entitlements.
  assignPlan: (id: string, planCode: string) =>
    baseService.put<void>(`/tenant/${id}/plan`, { planCode }),

  // TASK-054 §B — the per-tenant entitlement ceiling (clean shape).
  getEntitlements: (id: string) =>
    baseService.get<TenantEntitlements>(`/tenant/${id}/entitlements`),

  // TASK-054 §B — write the entitlement ceiling. Emits ONLY the clean contract
  // body { moduleCodes, pageRestrictions?, reports? }; any legacy field a caller
  // passes is stripped. Caller then fires navigationService.refreshMenu().
  updateEntitlements: (id: string, data: UpdateTenantEntitlements) =>
    baseService.put<void>(`/tenant/${id}/entitlements`, {
      moduleCodes: data.moduleCodes,
      ...(data.pageRestrictions ? { pageRestrictions: data.pageRestrictions } : {}),
      ...(data.reports ? { reports: data.reports } : {}),
    }),

  // TASK-054 §G — platform tenant console: list every tenant (traceability).
  getTenants: () => baseService.get<TenantSummary[]>("/admin/tenants"),

  // TASK-054 §G — platform tenant console: one tenant's modules/roles/users.
  getTenantDetail: (id: string) =>
    baseService.get<TenantDetail>(`/admin/tenants/${id}`),

  // TASK-054 §G — platform-admin: set a tenant user's assigned role codes.
  setTenantUserRoles: (id: string, userId: string, roleCodes: string[]) =>
    baseService.put<void>(`/admin/tenants/${id}/users/${userId}/roles`, { roleCodes }),

  // Platform-operator: list a tenant's users
  getTenantUsers: (id: string) =>
    baseService.get<TenantUser[]>(`/tenant/${id}/users`),

  // Platform-operator: set a tenant user's role (promote to admin / demote to standard user)
  setTenantUserRole: (id: string, userId: number, role: "admin" | "SUB_USER") =>
    baseService.put<{ success: boolean; message: string }>(`/tenant/${id}/users/${userId}/role`, { userId, role }),

  // Current tenant's usage snapshot vs. plan limits (TASK-007 slice 1). Any authenticated
  // user of the tenant can call this — the server derives tenant scope from the JWT.
  getMyUsage: () => baseService.get<TenantUsageDto>("/tenant/usage"),

  // Platform-operator view of another tenant's usage (TASK-009). Requires platform-admin
  // JWT — a regular tenant admin gets 403.
  getUsageFor: (id: string) => baseService.get<TenantUsageDto>(`/tenant/${id}/usage`),
};

export interface ResourceUsageDto {
  current: number;
  max: number;
  percent: number;
  isCritical: boolean;
}

export interface TenantUsageDto {
  planTier: string;
  planStatus: string;
  expiresAt?: string;
  vehicles: ResourceUsageDto;
  users: ResourceUsageDto;
  monthlyShipments: ResourceUsageDto;
  /** Pre-computed human-readable strings; empty when nothing to warn about. */
  warnings: string[];
}

export interface TenantUser {
  id: number;
  username: string;
  fullName: string;
  role: string;
  mobile?: string;
  email?: string;
  isActive: boolean;
  isAdmin: boolean;
}
