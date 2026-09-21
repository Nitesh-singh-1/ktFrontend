import { baseService } from "./baseservice";
import {
  VendorDto,
  LorryHireContractDto,
  CreateLorryHireRequest,
} from "@/types/tms";

export const vendorService = {
  // --- Vendors Directory ---
  getVendors: async (query?: string): Promise<VendorDto[]> => {
    const endpoint = query ? `/vendor?search=${encodeURIComponent(query)}` : "/vendor";
    const res = await baseService.get<VendorDto[] | { success: boolean; data: VendorDto[] }>(endpoint);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  },

  createVendor: (data: Partial<VendorDto>): Promise<VendorDto> => {
    return baseService.post<VendorDto>("/vendor", data);
  },

  deleteVendor: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.delete<{ success: boolean; message?: string }>(`/vendor/${id}`);
  },

  // --- Lorry Hire Memos / Contracts ---
  getLorryHireContracts: async (params?: { search?: string; vendorId?: number }): Promise<LorryHireContractDto[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.vendorId) query.append("vendorId", params.vendorId.toString());

    const endpoint = query.toString() ? `/vendor/lorry-hire?${query.toString()}` : "/vendor/lorry-hire";
    const res = await baseService.get<LorryHireContractDto[] | { success: boolean; data: LorryHireContractDto[] }>(endpoint);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  },

  createLorryHireContract: (data: CreateLorryHireRequest): Promise<{ success: boolean; data?: LorryHireContractDto; message?: string }> => {
    return baseService.post<{ success: boolean; data?: LorryHireContractDto; message?: string }>("/vendor/lorry-hire", data);
  },

  recordBalancePayment: (contractId: number, payment: {
    amount: number;
    paymentReference?: string;
    remarks?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    return baseService.post<{ success: boolean; message?: string }>(`/vendor/lorry-hire/${contractId}/pay-balance`, payment);
  },
};
