import { baseService } from "./baseservice";
import { Quotation, QuotationStatus } from "@/types/quotation";

function unwrapArray<T>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

export const quotationService = {
  getQuotations: async (params?: { search?: string; status?: QuotationStatus }): Promise<Quotation[]> => {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.status !== undefined && params?.status !== null) qs.set("status", String(params.status));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await baseService.get<Quotation[] | { data: Quotation[] }>(`/quotation${suffix}`);
      return unwrapArray<Quotation>(res);
    } catch (err) {
      console.error("Get quotations error:", err);
      return [];
    }
  },

  getQuotation: (id: number): Promise<Quotation> => {
    return baseService.get<Quotation>(`/quotation/${id}`);
  },

  createQuotation: (data: Partial<Quotation>): Promise<Quotation> => {
    return baseService.post<Quotation>("/quotation", data);
  },

  updateQuotation: (id: number, data: Partial<Quotation>): Promise<Quotation> => {
    return baseService.put<Quotation>(`/quotation/${id}`, data);
  },

  updateStatus: (id: number, status: QuotationStatus, convertedRef?: string): Promise<Quotation> => {
    return baseService.put<Quotation>(`/quotation/${id}/status`, { status, convertedRef });
  },

  deleteQuotation: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.delete<{ success: boolean; message?: string }>(`/quotation/${id}`);
  },
};
