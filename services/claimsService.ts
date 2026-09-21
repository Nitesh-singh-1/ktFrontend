import { baseService } from "./baseservice";
import { ClaimDto, CreateClaimRequest, ClaimStatus } from "@/types/tms";

export const claimsService = {
  getClaims: async (params?: { search?: string; status?: ClaimStatus }): Promise<ClaimDto[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.status !== undefined && params.status !== null) query.append("status", params.status.toString());

    const endpoint = query.toString() ? `/claim?${query.toString()}` : "/claim";
    const res = await baseService.get<ClaimDto[] | { success: boolean; data: ClaimDto[] }>(endpoint);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  },

  createClaim: (data: CreateClaimRequest): Promise<{ success: boolean; data?: ClaimDto; message?: string }> => {
    return baseService.post<{ success: boolean; data?: ClaimDto; message?: string }>("/claim", data);
  },

  updateClaimStatus: (id: number, update: {
    status: ClaimStatus;
    settledAmount?: number;
    resolutionRemarks?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    return baseService.patch<{ success: boolean; message?: string }>(`/claim/${id}/status`, update);
  },
};
