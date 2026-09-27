import { baseService } from "./baseservice";
import {
  PodRecordDto,
  UploadPodRequest,
  PodStatus,
  PodPendingShipmentDto,
} from "@/types/tms";

export const podService = {
  // Get POD records
  getPods: async (params?: { search?: string; status?: PodStatus }): Promise<PodRecordDto[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.status !== undefined && params.status !== null) query.append("status", params.status.toString());

    const endpoint = query.toString() ? `/pod?${query.toString()}` : "/pod";
    const res = await baseService.get<PodRecordDto[] | { success: boolean; data: PodRecordDto[] }>(endpoint);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  },

  // Consignments still awaiting a POD (for the upload dropdown)
  getPendingShipments: async (): Promise<PodPendingShipmentDto[]> => {
    const res = await baseService.get<PodPendingShipmentDto[] | { success: boolean; data: PodPendingShipmentDto[] }>("/pod/pending-shipments");
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  },

  // Upload POD with signature and document proof.
  // The API returns the bare PodRecordDto on success (200); normalize to a {success,data} envelope
  // so callers get a reliable success flag (this was causing false "upload failed" messages).
  uploadPod: async (data: UploadPodRequest): Promise<{ success: boolean; data?: PodRecordDto; message?: string }> => {
    const res = await baseService.post<any>("/pod/upload", data);
    if (res && typeof res === "object") {
      if (typeof res.id !== "undefined") return { success: true, data: res as PodRecordDto };
      if (res.data && typeof res.data.id !== "undefined") return { success: true, data: res.data as PodRecordDto };
      if (res.success) return res;
    }
    return { success: false, message: res?.message || "Failed to upload Proof of Delivery." };
  },

  // Verify POD (Transitions shipment to Delivered)
  verifyPod: (podId: number): Promise<{ success: boolean; message?: string }> => {
    return baseService.post<{ success: boolean; message?: string }>(`/pod/${podId}/verify`);
  },

  // Reject POD
  rejectPod: (podId: number, rejectionReason: string): Promise<{ success: boolean; message?: string }> => {
    return baseService.post<{ success: boolean; message?: string }>(`/pod/${podId}/reject`, { rejectionReason });
  },
};
