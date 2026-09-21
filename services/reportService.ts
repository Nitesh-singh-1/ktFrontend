import { baseService } from "./baseservice";
import {
  TripProfitabilityReportDto,
  TaxSummaryReportDto,
  PartyOutstandingReportDto,
  VendorPayableReportDto,
} from "@/types/tms";

export const reportService = {
  // Trip Profitability Margins & Cost breakdown
  getTripProfitabilityReport: async (params?: { fromDate?: string; toDate?: string }): Promise<TripProfitabilityReportDto> => {
    const query = new URLSearchParams();
    if (params?.fromDate) query.append("fromDate", params.fromDate);
    if (params?.toDate) query.append("toDate", params.toDate);

    const endpoint = query.toString() ? `/report/profitability?${query.toString()}` : "/report/profitability";
    try {
      const res = await baseService.get<TripProfitabilityReportDto | { success: boolean; data: TripProfitabilityReportDto }>(endpoint);
      if ((res as any)?.data) return (res as any).data;
      return res as TripProfitabilityReportDto;
    } catch (err) {
      console.error("Profitability report error:", err);
      return {
        totalTrips: 0,
        totalFreightRevenue: 0,
        totalDriverCashAdvance: 0,
        totalDieselAdvance: 0,
        totalOnRoadExpenses: 0,
        totalLorryHireVendorCost: 0,
        netTripProfit: 0,
        profitMarginPercentage: 0,
        tripDetails: [],
      };
    }
  },

  // GST Tax Summary (Taxable, Exempt, RCM)
  getTaxSummaryReport: async (params?: { fromDate?: string; toDate?: string }): Promise<TaxSummaryReportDto> => {
    const query = new URLSearchParams();
    if (params?.fromDate) query.append("fromDate", params.fromDate);
    if (params?.toDate) query.append("toDate", params.toDate);

    const endpoint = query.toString() ? `/report/gst-summary?${query.toString()}` : "/report/gst-summary";
    try {
      const res = await baseService.get<TaxSummaryReportDto | { success: boolean; data: TaxSummaryReportDto }>(endpoint);
      if ((res as any)?.data) return (res as any).data;
      return res as TaxSummaryReportDto;
    } catch (err) {
      console.error("Tax summary report error:", err);
      return {
        totalTaxableFreight: 0,
        totalNonTaxableFreight: 0,
        totalGstRcmFreight: 0,
        totalTaxCollected: 0,
        totalShipmentsCount: 0,
      };
    }
  },

  // Customer / Party Outstanding Balances
  getPartyOutstandingReport: async (): Promise<PartyOutstandingReportDto[]> => {
    try {
      const res = await baseService.get<PartyOutstandingReportDto[] | { success: boolean; data: PartyOutstandingReportDto[] }>("/report/party-outstanding");
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Party outstanding report error:", err);
      return [];
    }
  },

  // Vendor / Broker Payables
  getVendorPayableReport: async (): Promise<VendorPayableReportDto[]> => {
    try {
      const res = await baseService.get<VendorPayableReportDto[] | { success: boolean; data: VendorPayableReportDto[] }>("/report/vendor-payable");
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Vendor payable report error:", err);
      return [];
    }
  },
};
