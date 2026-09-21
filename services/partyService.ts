import { baseService } from "./baseservice";
import { Party, PartyLookupItem } from "@/types/shipment";

export interface PartyFilterParams {
  search?: string;
  partyType?: number;
  activeOnly?: boolean;
}

export const partyService = {
  // Fast autocomplete lookup for Consignor / Consignee
  lookupParties: async (searchTerm: string): Promise<PartyLookupItem[]> => {
    try {
      const endpoint = searchTerm
        ? `/party/lookup?q=${encodeURIComponent(searchTerm)}`
        : "/party/lookup";
      const res = await baseService.get<PartyLookupItem[] | { success: boolean; data: PartyLookupItem[] }>(endpoint);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Party lookup error:", err);
      return [];
    }
  },

  // Full list of parties with filtering
  getParties: async (params?: PartyFilterParams): Promise<Party[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search.trim());
    if (params?.partyType !== undefined && params.partyType !== null) {
      query.append("partyType", params.partyType.toString());
    }
    if (params?.activeOnly !== undefined) {
      query.append("activeOnly", params.activeOnly.toString());
    }

    const endpoint = query.toString() ? `/party?${query.toString()}` : "/party";
    const res = await baseService.get<Party[] | { success: boolean; data: Party[] }>(endpoint);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  },

  // Get single party by ID
  getPartyById: (id: number): Promise<Party> => {
    return baseService.get<Party>(`/party/${id}`);
  },

  // Create new party
  createParty: (data: Partial<Party>): Promise<Party> => {
    return baseService.post<Party>("/party", data);
  },

  // Update existing party
  updateParty: (id: number, data: Partial<Party>): Promise<Party> => {
    return baseService.put<Party>(`/party/${id}`, data);
  },

  // Delete party
  deleteParty: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.delete<{ success: boolean; message?: string }>(`/party/${id}`);
  },
};
