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
};
