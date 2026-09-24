import { baseService } from "./baseservice";
import {
  Manifest,
  CreateManifestRequest,
  UpdateManifestRequest,
  UnloadManifestRequest,
  ManifestFilterRequest,
} from "@/types/manifest";
import { Shipment } from "@/types/shipment";

export interface PaginatedManifestsResponse {
  success: boolean;
  message?: string;
  totalCount: number;
  data: Manifest[];
}

export const manifestService = {
  // Create a new loading sheet / manifest
  createManifest: (data: CreateManifestRequest): Promise<{ success: boolean; data: Manifest; message?: string }> => {
    return baseService.post<{ success: boolean; data: Manifest; message?: string }>("/manifest", data);
  },

  // Get paginated and filtered list of manifests
  getManifests: (params?: ManifestFilterRequest): Promise<PaginatedManifestsResponse> => {
    const query = new URLSearchParams();

    if (params?.status !== undefined && params?.status !== null) {
      query.append("status", params.status.toString());
    }
    if (params?.originHubId) {
      query.append("originHubId", params.originHubId.toString());
    }
    if (params?.destinationHubId) {
      query.append("destinationHubId", params.destinationHubId.toString());
    }
    if (params?.tripId) {
      query.append("tripId", params.tripId.toString());
    }
    if (params?.fromDate) {
      query.append("fromDate", params.fromDate);
    }
    if (params?.toDate) {
      query.append("toDate", params.toDate);
    }
    if (params?.search) {
      query.append("search", params.search.trim());
    }
    if (params?.page) {
      query.append("page", params.page.toString());
    }
    if (params?.pageSize) {
      query.append("pageSize", params.pageSize.toString());
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/manifest?${queryString}` : "/manifest";
    return baseService.get<PaginatedManifestsResponse>(endpoint);
  },

  // Get single manifest by ID with loaded LRs and destination hubs
  getManifestById: (id: number): Promise<{ success: boolean; data: Manifest; message?: string }> => {
    return baseService.get<{ success: boolean; data: Manifest; message?: string }>(`/manifest/${id}`);
  },

  // Quick lookup by Manifest No
  getManifestByNo: (manifestNo: string): Promise<{ success: boolean; data: Manifest; message?: string }> => {
    return baseService.get<{ success: boolean; data: Manifest; message?: string }>(`/manifest/by-no/${encodeURIComponent(manifestNo)}`);
  },

  // Update manifest details
  updateManifest: (id: number, data: UpdateManifestRequest): Promise<{ success: boolean; data: Manifest; message?: string }> => {
    return baseService.put<{ success: boolean; data: Manifest; message?: string }>(`/manifest/${id}`, data);
  },

  // Assign Trip to Manifest
  assignTrip: (manifestId: number, tripId: number): Promise<{ success: boolean; data: Manifest; message?: string }> => {
    return baseService.post<{ success: boolean; data: Manifest; message?: string }>(`/manifest/${manifestId}/assign-trip`, { tripId });
  },

  // Mark Manifest as Dispatched
  dispatchManifest: (manifestId: number): Promise<{ success: boolean; data: Manifest; message?: string }> => {
    return baseService.post<{ success: boolean; data: Manifest; message?: string }>(`/manifest/${manifestId}/dispatch`, {});
  },

  // Record Unloading and Shortage/Damage Discrepancies at a Hub
  unloadManifest: (manifestId: number, data: UnloadManifestRequest): Promise<{ success: boolean; data: Manifest; message?: string }> => {
    return baseService.post<{ success: boolean; data: Manifest; message?: string }>(`/manifest/${manifestId}/unload`, data);
  },

  // Cancel Manifest
  cancelManifest: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.delete<{ success: boolean; message?: string }>(`/manifest/${id}`);
  },

  // Get available booked LRs waiting to be manifested
  getAvailableShipments: (originHubId?: number, destinationHubId?: number): Promise<Shipment[]> => {
    const query = new URLSearchParams();
    if (originHubId) query.append("originHubId", originHubId.toString());
    if (destinationHubId) query.append("destinationHubId", destinationHubId.toString());
    const queryString = query.toString();
    const endpoint = queryString ? `/manifest/available-shipments?${queryString}` : "/manifest/available-shipments";
    return baseService.get<Shipment[]>(endpoint);
  },
};
