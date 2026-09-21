import { baseService } from "./baseservice";
import {
  Shipment,
  CreateShipmentRequest,
  UpdateShipmentStatusRequest,
  ShipmentFilterParams,
  PaginatedShipmentsResponse,
} from "@/types/shipment";

export const shipmentService = {
  // Create a new consignment
  createShipment: (data: CreateShipmentRequest): Promise<{ success: boolean; data: Shipment; message?: string }> => {
    return baseService.post<{ success: boolean; data: Shipment; message?: string }>("/shipment", data);
  },

  // Get paginated and filtered list of shipments
  getShipments: (params?: ShipmentFilterParams): Promise<PaginatedShipmentsResponse> => {
    const query = new URLSearchParams();

    if (params?.status !== undefined && params?.status !== "") {
      query.append("status", params.status.toString());
    }
    if (params?.taxTreatment !== undefined && params?.taxTreatment !== "") {
      query.append("taxTreatment", params.taxTreatment.toString());
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
    const endpoint = queryString ? `/shipment?${queryString}` : "/shipment";
    return baseService.get<PaginatedShipmentsResponse>(endpoint);
  },

  // Get single shipment by ID with items, charge items, and status history
  getShipmentById: (id: number): Promise<{ success: boolean; data: Shipment; message?: string }> => {
    return baseService.get<{ success: boolean; data: Shipment; message?: string }>(`/shipment/${id}`);
  },

  // Quick lookup by GR / LR / Shipment No
  getShipmentByNo: (shipmentNo: string): Promise<{ success: boolean; data: Shipment; message?: string }> => {
    return baseService.get<{ success: boolean; data: Shipment; message?: string }>(`/shipment/by-no/${encodeURIComponent(shipmentNo)}`);
  },

  // Update shipment details and line items
  updateShipment: (id: number, data: Partial<CreateShipmentRequest>): Promise<{ success: boolean; data: Shipment; message?: string }> => {
    return baseService.put<{ success: boolean; data: Shipment; message?: string }>(`/shipment/${id}`, data);
  },

  // Update status (lifecycle transition) and audit trail
  updateShipmentStatus: (id: number, data: UpdateShipmentStatusRequest): Promise<{ success: boolean; data: Shipment; message?: string }> => {
    return baseService.patch<{ success: boolean; data: Shipment; message?: string }>(`/shipment/${id}/status`, data);
  },

  // Soft delete / Cancel shipment
  cancelShipment: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.delete<{ success: boolean; message?: string }>(`/shipment/${id}`);
  },
};
