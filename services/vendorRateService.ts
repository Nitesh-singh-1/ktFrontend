import { baseService } from "./baseservice";
import { VendorRateContractDto } from "@/types/tms";

export const vendorRateService = {
  getContracts: async (params?: { search?: string; vendorId?: number }): Promise<VendorRateContractDto[]> => {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.vendorId != null) qs.set("vendorId", String(params.vendorId));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await baseService.get<VendorRateContractDto[] | { success: boolean; data: VendorRateContractDto[] }>(
        `/vendorratecontract${suffix}`
      );
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get vendor rate contracts error:", err);
      return [];
    }
  },

  create: (data: Partial<VendorRateContractDto>): Promise<VendorRateContractDto> => {
    return baseService.post<VendorRateContractDto>("/vendorratecontract", data);
  },

  update: (id: number, data: Partial<VendorRateContractDto>): Promise<VendorRateContractDto> => {
    return baseService.put<VendorRateContractDto>(`/vendorratecontract/${id}`, data);
  },

  remove: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.delete<{ success: boolean; message?: string }>(`/vendorratecontract/${id}`);
  },
};
