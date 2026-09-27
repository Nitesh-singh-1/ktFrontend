import { baseService } from "./baseservice";
import {
  RateCardDto,
  CalculateFreightRequest,
  CalculatedFreightResponse,
} from "@/types/tms";

export const rateCardService = {
  // Get all rate cards (optional search / party filter)
  getRateCards: async (params?: { search?: string; partyId?: number }): Promise<RateCardDto[]> => {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.partyId != null) qs.set("partyId", String(params.partyId));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await baseService.get<RateCardDto[] | { success: boolean; data: RateCardDto[] }>(`/ratecard${suffix}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get rate cards error:", err);
      return [];
    }
  },

  // Create rate card
  createRateCard: (data: Partial<RateCardDto>): Promise<RateCardDto> => {
    return baseService.post<RateCardDto>("/ratecard", data);
  },

  // Update rate card
  updateRateCard: (id: number, data: Partial<RateCardDto>): Promise<RateCardDto> => {
    return baseService.put<RateCardDto>(`/ratecard/${id}`, data);
  },

  // Delete (deactivate) rate card
  deleteRateCard: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.delete<{ success: boolean; message?: string }>(`/ratecard/${id}`);
  },

  // Calculate freight estimation using party tariff or standard route rate card
  calculateFreight: async (req: CalculateFreightRequest): Promise<CalculatedFreightResponse> => {
    try {
      const res = await baseService.post<CalculatedFreightResponse | { success: boolean; data: CalculatedFreightResponse }>("/ratecard/calculate", req);
      if ((res as any)?.data) return (res as any).data;
      return res as CalculatedFreightResponse;
    } catch (err) {
      console.error("Calculate freight error:", err);
      // Fallback calculation if rate card engine is offline
      const base = req.weightKg * 1.5;
      const hamali = req.includeHamali ? Math.max(50, req.weightKg * 0.1) : 0;
      const dd = req.includeDoorDelivery ? 200 : 0;
      return {
        matchedRateCard: false,
        baseRate: 1.5,
        rateType: 0,
        freightAmount: base,
        hamaliAmount: hamali,
        doorDeliveryAmount: dd,
        stationaryAmount: 50,
        totalEstimatedFreight: base + hamali + dd + 50,
        calculationBreakdown: `Estimated: ₹${base.toFixed(2)} freight + ₹${hamali.toFixed(2)} hamali + ₹${dd} DD + ₹50 stationary`,
      };
    }
  },
};
