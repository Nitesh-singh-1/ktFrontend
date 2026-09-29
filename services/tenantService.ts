import { baseService } from "./baseservice";
import { authService } from "./authService";
import { TenantOnboardingRequest, TenantOnboardingResponse } from "@/types/shipment";
import { TenantMenuEntitlements } from "./navigationService";

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
  enabledMenuKeys: string[];
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

  // Toggle active/inactive status
  updateStatus: (id: string, isActive: boolean) =>
    baseService.put<{ success: boolean; message: string }>(`/tenant/${id}/status`, { isActive }),

  // Update subscription plan tier
  updatePlan: (id: string, planTier: string) =>
    baseService.put<{ success: boolean; message: string }>(`/tenant/${id}/plan`, { planTier }),

  // Get menu entitlements for a tenant
  getEntitlements: (id: string) =>
    baseService.get<TenantMenuEntitlements>(`/tenant/${id}/entitlements`),

  // Update menu entitlements for a tenant
  updateEntitlements: (id: string, data: TenantMenuEntitlements) =>
    baseService.put<TenantMenuEntitlements>(`/tenant/${id}/entitlements`, data),

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
