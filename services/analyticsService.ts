import { baseService } from "./baseservice";
import { BusinessAnalytics } from "@/types/analytics";

const EMPTY: BusinessAnalytics = {
  months: 6,
  periodLabel: "",
  totalBilled: 0,
  totalCollected: 0,
  totalOutstanding: 0,
  invoiceCount: 0,
  cancelledCount: 0,
  collectionRatePct: 0,
  operatingExpenses: 0,
  grossMargin: 0,
  grossMarginPct: 0,
  totalInflow: 0,
  totalOutflow: 0,
  netCashFlow: 0,
  monthlyTrend: [],
  topCustomers: [],
  paymentStatusBreakdown: [],
  vehicleProfitability: [],
  branchProfitability: [],
  cashFlowByMode: [],
};

export const analyticsService = {
  getBusinessAnalytics: async (months: number = 6): Promise<BusinessAnalytics> => {
    try {
      const res = await baseService.get<BusinessAnalytics | { success: boolean; data: BusinessAnalytics }>(
        `/dashboard/analytics?months=${months}`
      );
      if (res && typeof (res as any).totalBilled === "number") return res as BusinessAnalytics;
      if (res && (res as any).data && typeof (res as any).data.totalBilled === "number") return (res as any).data;
      return EMPTY;
    } catch (err) {
      console.error("Get business analytics error:", err);
      return EMPTY;
    }
  },
};
