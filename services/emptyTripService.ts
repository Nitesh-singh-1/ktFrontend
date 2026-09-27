import { baseService } from "./baseservice";
import { EmptyTripLogDto } from "@/types/tms";

export const emptyTripService = {
  getLogs: async (search?: string): Promise<EmptyTripLogDto[]> => {
    try {
      const suffix = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await baseService.get<EmptyTripLogDto[] | { success: boolean; data: EmptyTripLogDto[] }>(`/emptytriplog${suffix}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get empty trip logs error:", err);
      return [];
    }
  },

  create: (data: Partial<EmptyTripLogDto>): Promise<EmptyTripLogDto> => baseService.post<EmptyTripLogDto>("/emptytriplog", data),
  update: (id: number, data: Partial<EmptyTripLogDto>): Promise<EmptyTripLogDto> => baseService.put<EmptyTripLogDto>(`/emptytriplog/${id}`, data),
  remove: (id: number): Promise<{ success: boolean; message?: string }> =>
    baseService.delete<{ success: boolean; message?: string }>(`/emptytriplog/${id}`),
};
