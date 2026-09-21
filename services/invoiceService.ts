import { baseService } from "./baseservice";
import {
  Invoice,
  InvoiceLookupItem,
  CreateInvoiceRequest,
  RecordPaymentRequest,
  InvoicePaymentStatus,
} from "@/types/shipment";

export interface InvoiceFilterParams {
  search?: string;
  paymentStatus?: InvoicePaymentStatus | number;
  partyId?: number;
  page?: number;
  pageSize?: number;
}

export const invoiceService = {
  // Fast autocomplete lookup for invoices
  lookupInvoices: async (searchTerm: string = ""): Promise<InvoiceLookupItem[]> => {
    try {
      const endpoint = searchTerm
        ? `/invoice/lookup?q=${encodeURIComponent(searchTerm)}`
        : "/invoice/lookup";
      const res = await baseService.get<InvoiceLookupItem[] | { success: boolean; data: InvoiceLookupItem[] }>(endpoint);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Invoice lookup error:", err);
      return [];
    }
  },

  // Get filtered invoices list
  getInvoices: async (params?: InvoiceFilterParams): Promise<Invoice[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search.trim());
    if (params?.paymentStatus !== undefined && params.paymentStatus !== null) {
      query.append("paymentStatus", params.paymentStatus.toString());
    }
    if (params?.partyId) query.append("partyId", params.partyId.toString());
    if (params?.page) query.append("page", params.page.toString());
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString());

    const endpoint = query.toString() ? `/invoice?${query.toString()}` : "/invoice";
    const res = await baseService.get<Invoice[] | { success: boolean; data: Invoice[] }>(endpoint);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  },

  // Get invoice details with items and payments
  getInvoiceById: (id: number): Promise<Invoice> => {
    return baseService.get<Invoice>(`/invoice/${id}`);
  },

  // Create new freight invoice
  createInvoice: (data: CreateInvoiceRequest): Promise<{ success: boolean; data?: Invoice; message?: string }> => {
    return baseService.post<{ success: boolean; data?: Invoice; message?: string }>("/invoice", data);
  },

  // Update invoice
  updateInvoice: (id: number, data: Partial<CreateInvoiceRequest>): Promise<{ success: boolean; data?: Invoice; message?: string }> => {
    return baseService.put<{ success: boolean; data?: Invoice; message?: string }>(`/invoice/${id}`, data);
  },

  // Record payment against invoice
  recordPayment: (id: number, payment: RecordPaymentRequest): Promise<{ success: boolean; message?: string }> => {
    return baseService.post<{ success: boolean; message?: string }>(`/invoice/${id}/payments`, payment);
  },

  // Void / Cancel invoice
  deleteInvoice: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.delete<{ success: boolean; message?: string }>(`/invoice/${id}`);
  },
};
