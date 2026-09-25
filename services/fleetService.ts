import { baseService } from "./baseservice";
import {
  VehicleMaster,
  VehicleLookupItem,
  DriverMaster,
  DriverLookupItem,
  LocationMaster,
  LocationLookupItem,
} from "@/types/shipment";

export const fleetService = {
  // --- Vehicles (Trucks) ---
  lookupVehicles: async (query: string = ""): Promise<VehicleLookupItem[]> => {
    try {
      const endpoint = query
        ? `/fleet/vehicles/lookup?q=${encodeURIComponent(query)}`
        : "/fleet/vehicles/lookup";
      const res = await baseService.get<VehicleLookupItem[] | { success: boolean; data: VehicleLookupItem[] }>(endpoint);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Vehicle lookup error:", err);
      return [];
    }
  },

  getVehicles: async (): Promise<VehicleMaster[]> => {
    try {
      const res = await baseService.get<VehicleMaster[] | { success: boolean; data: VehicleMaster[] }>("/fleet/vehicles");
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get vehicles error:", err);
      return [];
    }
  },

  createVehicle: (data: Partial<VehicleMaster>): Promise<VehicleMaster> => {
    return baseService.post<VehicleMaster>("/fleet/vehicles", data);
  },

  updateVehicle: (id: number, data: Partial<VehicleMaster>): Promise<VehicleMaster> => {
    return baseService.put<VehicleMaster>(`/fleet/vehicles/${id}`, data);
  },

  deleteVehicle: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.delete<{ success: boolean; message?: string }>(`/fleet/vehicles/${id}`);
  },

  // --- Drivers ---
  lookupDrivers: async (query: string = ""): Promise<DriverLookupItem[]> => {
    try {
      const endpoint = query
        ? `/fleet/drivers/lookup?q=${encodeURIComponent(query)}`
        : "/fleet/drivers/lookup";
      const res = await baseService.get<DriverLookupItem[] | { success: boolean; data: DriverLookupItem[] }>(endpoint);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Driver lookup error:", err);
      return [];
    }
  },

  getDrivers: async (): Promise<DriverMaster[]> => {
    try {
      const res = await baseService.get<DriverMaster[] | { success: boolean; data: DriverMaster[] }>("/fleet/drivers");
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get drivers error:", err);
      return [];
    }
  },

  createDriver: (data: Partial<DriverMaster>): Promise<DriverMaster> => {
    return baseService.post<DriverMaster>("/fleet/drivers", data);
  },

  updateDriver: (id: number, data: Partial<DriverMaster>): Promise<DriverMaster> => {
    return baseService.put<DriverMaster>(`/fleet/drivers/${id}`, data);
  },

  deleteDriver: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.delete<{ success: boolean; message?: string }>(`/fleet/drivers/${id}`);
  },

  // --- Locations / Stations ---
  lookupLocations: async (query: string = ""): Promise<LocationLookupItem[]> => {
    try {
      const endpoint = query
        ? `/fleet/locations/lookup?q=${encodeURIComponent(query)}`
        : "/fleet/locations/lookup";
      const res = await baseService.get<LocationLookupItem[] | { success: boolean; data: LocationLookupItem[] }>(endpoint);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Location lookup error:", err);
      return [];
    }
  },

  getLocations: async (): Promise<LocationMaster[]> => {
    try {
      const res = await baseService.get<LocationMaster[] | { success: boolean; data: LocationMaster[] }>("/fleet/locations");
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as any).data)) return (res as any).data;
      return [];
    } catch (err) {
      console.error("Get locations error:", err);
      return [];
    }
  },

  createLocation: (data: Partial<LocationMaster>): Promise<LocationMaster> => {
    return baseService.post<LocationMaster>("/fleet/locations", data);
  },

  updateLocation: (id: number, data: Partial<LocationMaster>): Promise<LocationMaster> => {
    return baseService.put<LocationMaster>(`/fleet/locations/${id}`, data);
  },

  deleteLocation: (id: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.delete<{ success: boolean; message?: string }>(`/fleet/locations/${id}`);
  },
};
