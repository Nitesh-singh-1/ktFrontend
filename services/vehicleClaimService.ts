import { baseService } from "./baseservice";
import { VehicleInsuranceClaimDto, VehicleClaimStatus } from "@/types/tms";

export const vehicleClaimService = {
  getClaims: async (params?: { search?: string; status?: VehicleClaimStatus }): Promise<VehicleInsuranceClaimDto[]> => {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.status !== undefined && params?.status !== null) qs.set("status", String(params.status));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await baseService.get<VehicleInsuranceClaimDto[] | { success: boolean; data: VehicleInsuranceClaimDto[] }>(`/vehicleinsuranceclaim${suffix}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get vehicle claims error:", err);
      return [];
    }
  },

  create: (data: Partial<VehicleInsuranceClaimDto>): Promise<VehicleInsuranceClaimDto> => baseService.post<VehicleInsuranceClaimDto>("/vehicleinsuranceclaim", data),
  update: (id: number, data: Partial<VehicleInsuranceClaimDto>): Promise<VehicleInsuranceClaimDto> => baseService.put<VehicleInsuranceClaimDto>(`/vehicleinsuranceclaim/${id}`, data),
  remove: (id: number): Promise<{ success: boolean; message?: string }> =>
    baseService.delete<{ success: boolean; message?: string }>(`/vehicleinsuranceclaim/${id}`),
};
