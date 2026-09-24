import { baseService } from "./baseservice";
import {
  TripDto,
  CreateTripRequest,
  TripExpenseDto,
  TripExpenseType,
  ShipmentDto,
} from "@/types/tms";

export const tripService = {
  // Get all trips
  getTrips: async (params?: { search?: string; status?: number; fromDate?: string; toDate?: string }): Promise<TripDto[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search.trim());
    if (params?.status !== undefined && params.status !== null) query.append("status", params.status.toString());
    if (params?.fromDate) query.append("fromDate", params.fromDate);
    if (params?.toDate) query.append("toDate", params.toDate);

    const endpoint = query.toString() ? `/trip?${query.toString()}` : "/trip";
    const res = await baseService.get<TripDto[] | { success: boolean; data: TripDto[] }>(endpoint);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  },

  // Get trip by ID
  getTripById: (id: number): Promise<TripDto> => {
    return baseService.get<TripDto>(`/trip/${id}`);
  },

  // Create Trip Manifest & Load Shipments
  createTrip: async (data: CreateTripRequest): Promise<{ success: boolean; data?: TripDto; message?: string }> => {
    const res = await baseService.post<any>("/trip", data);
    if (res && (res.id || res.tripNo)) {
      return { success: true, data: res };
    }
    if (res && typeof res.success === "boolean") {
      return res;
    }
    return { success: !!res, data: res };
  },

  // Dispatch Trip (Transitions trip to Dispatched and shipments to InTransit)
  dispatchTrip: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.post<{ success: boolean; message?: string }>(`/trip/${id}/dispatch`);
  },

  // Arrive Trip at destination (Transitions trip to Arrived and shipments to OutForDelivery)
  arriveTrip: (id: number, endOdometer?: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.post<{ success: boolean; message?: string }>(`/trip/${id}/arrive`, { endOdometer });
  },

  // Complete Trip
  completeTrip: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.post<{ success: boolean; message?: string }>(`/trip/${id}/complete`);
  },

  // Record On-Road Trip Expense
  addExpense: (tripId: number, expense: {
    expenseType: TripExpenseType;
    amount: number;
    receiptNo?: string;
    paymentMode?: string;
    paidTo?: string;
    remarks?: string;
    expenseDate?: string;
  }): Promise<{ success: boolean; data?: TripExpenseDto; message?: string }> => {
    return baseService.post<{ success: boolean; data?: TripExpenseDto; message?: string }>(`/trip/${tripId}/expenses`, expense);
  },

  // Get Unmanifested Booked Shipments for loading
  getUnmanifestedShipments: async (params?: { origin?: string; destination?: string }): Promise<ShipmentDto[]> => {
    const query = new URLSearchParams();
    query.append("status", "1"); // Booked
    if (params?.origin) query.append("search", params.origin);

    const res = await baseService.get<{ success: boolean; data: ShipmentDto[] } | ShipmentDto[]>(`/shipment?${query.toString()}`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  },
};
