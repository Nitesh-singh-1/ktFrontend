import { baseService } from "./baseservice";
import { SparePartDto } from "@/types/tms";

export const sparePartService = {
  getSpareParts: async (params?: { search?: string; category?: string; lowStockOnly?: boolean }): Promise<SparePartDto[]> => {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.category) qs.set("category", params.category);
      if (params?.lowStockOnly) qs.set("lowStockOnly", "true");
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await baseService.get<SparePartDto[] | { success: boolean; data: SparePartDto[] }>(`/sparepart${suffix}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get spare parts error:", err);
      return [];
    }
  },

  create: (data: Partial<SparePartDto>): Promise<SparePartDto> => baseService.post<SparePartDto>("/sparepart", data),
  update: (id: number, data: Partial<SparePartDto>): Promise<SparePartDto> => baseService.put<SparePartDto>(`/sparepart/${id}`, data),
  adjustStock: (id: number, quantityDelta: number, reason?: string): Promise<SparePartDto> =>
    baseService.post<SparePartDto>(`/sparepart/${id}/adjust-stock`, { quantityDelta, reason }),
  remove: (id: number): Promise<{ success: boolean; message?: string }> =>
    baseService.delete<{ success: boolean; message?: string }>(`/sparepart/${id}`),
};
