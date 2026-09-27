import { baseService } from "./baseservice";
import { VehicleLoanDto } from "@/types/tms";

export const vehicleLoanService = {
  getLoans: async (params?: { search?: string; activeOnly?: boolean }): Promise<VehicleLoanDto[]> => {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.activeOnly) qs.set("activeOnly", "true");
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await baseService.get<VehicleLoanDto[] | { success: boolean; data: VehicleLoanDto[] }>(`/vehicleloan${suffix}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get vehicle loans error:", err);
      return [];
    }
  },

  create: (data: Partial<VehicleLoanDto>): Promise<VehicleLoanDto> => baseService.post<VehicleLoanDto>("/vehicleloan", data),
  update: (id: number, data: Partial<VehicleLoanDto>): Promise<VehicleLoanDto> => baseService.put<VehicleLoanDto>(`/vehicleloan/${id}`, data),
  payEmi: (id: number): Promise<VehicleLoanDto> => baseService.post<VehicleLoanDto>(`/vehicleloan/${id}/pay-emi`, {}),
  remove: (id: number): Promise<{ success: boolean; message?: string }> =>
    baseService.delete<{ success: boolean; message?: string }>(`/vehicleloan/${id}`),
};
