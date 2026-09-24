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
  enabledMenuKeys: string[];
  reports: ReportEntitlementItem[];
  roleOverridesJson?: string;
  userOverridesJson?: string;
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

export const navigationService = {
  getMenu: () => baseService.get<DynamicMenuItem[]>("/navigation/menu"),

  getPermissions: () => baseService.get<string[]>("/navigation/permissions"),

  getAllTenants: () => baseService.get<TenantListItem[]>("/configuration/tenants"),

  getTenantUsers: () => baseService.get<TenantUserItem[]>("/configuration/users"),

  getMenuEntitlements: () =>
    baseService.get<TenantMenuEntitlements>("/configuration/menu-entitlements"),

  getMenuEntitlementsForTenant: (tenantId: string) =>
    baseService.get<TenantMenuEntitlements>(`/configuration/tenants/${tenantId}/menu-entitlements`),

  updateMenuEntitlements: (data: TenantMenuEntitlements) =>
    baseService.put<TenantMenuEntitlements>("/configuration/menu-entitlements", data),

  updateMenuEntitlementsForTenant: (tenantId: string, data: TenantMenuEntitlements) =>
    baseService.put<TenantMenuEntitlements>(`/configuration/tenants/${tenantId}/menu-entitlements`, data),
};
