import { baseService } from "./baseservice";
import { TyreDto, TyreStatus } from "@/types/tms";

export const tyreService = {
  getTyres: async (params?: { search?: string; status?: TyreStatus; vehicleId?: number }): Promise<TyreDto[]> => {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.status !== undefined && params?.status !== null) qs.set("status", String(params.status));
      if (params?.vehicleId != null) qs.set("vehicleId", String(params.vehicleId));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await baseService.get<TyreDto[] | { success: boolean; data: TyreDto[] }>(`/tyre${suffix}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get tyres error:", err);
      return [];
    }
  },

  create: (data: Partial<TyreDto>): Promise<TyreDto> => baseService.post<TyreDto>("/tyre", data),
  update: (id: number, data: Partial<TyreDto>): Promise<TyreDto> => baseService.put<TyreDto>(`/tyre/${id}`, data),
  remove: (id: number): Promise<{ success: boolean; message?: string }> =>
    baseService.delete<{ success: boolean; message?: string }>(`/tyre/${id}`),
};
