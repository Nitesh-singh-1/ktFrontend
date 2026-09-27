import { baseService } from "./baseservice";
import { DriverLedgerEntryDto, DriverOutstandingDto } from "@/types/tms";

export const driverLedgerService = {
  getEntries: async (params?: { search?: string; driverName?: string }): Promise<DriverLedgerEntryDto[]> => {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.driverName) qs.set("driverName", params.driverName);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await baseService.get<DriverLedgerEntryDto[] | { success: boolean; data: DriverLedgerEntryDto[] }>(`/driverledger${suffix}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get driver ledger error:", err);
      return [];
    }
  },

  getOutstanding: async (): Promise<DriverOutstandingDto[]> => {
    try {
      const res = await baseService.get<DriverOutstandingDto[] | { success: boolean; data: DriverOutstandingDto[] }>("/driverledger/outstanding");
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get driver outstanding error:", err);
      return [];
    }
  },

  create: (data: Partial<DriverLedgerEntryDto>): Promise<DriverLedgerEntryDto> => baseService.post<DriverLedgerEntryDto>("/driverledger", data),
  update: (id: number, data: Partial<DriverLedgerEntryDto>): Promise<DriverLedgerEntryDto> => baseService.put<DriverLedgerEntryDto>(`/driverledger/${id}`, data),
  remove: (id: number): Promise<{ success: boolean; message?: string }> =>
    baseService.delete<{ success: boolean; message?: string }>(`/driverledger/${id}`),
};
