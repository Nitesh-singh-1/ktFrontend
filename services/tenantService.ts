import { baseService } from "./baseservice";
import { authService } from "./authService";
import { TenantOnboardingRequest, TenantOnboardingResponse } from "@/types/shipment";

export const tenantService = {
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
};
