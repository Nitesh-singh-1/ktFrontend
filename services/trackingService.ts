import { baseService } from "./baseservice";
import { PublicTrackingDto } from "@/types/tms";

export const trackingService = {
  // Anonymous Public Tracking
  getPublicTracking: async (lrNo: string): Promise<PublicTrackingDto> => {
    return baseService.get<PublicTrackingDto>(`/tracking/${encodeURIComponent(lrNo.trim())}`);
  },
};
