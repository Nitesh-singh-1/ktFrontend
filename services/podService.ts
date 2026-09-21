import { baseService } from "./baseservice";
import {
  PodRecordDto,
  UploadPodRequest,
  PodStatus,
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

  // Upload POD with signature and document proof
  uploadPod: (data: UploadPodRequest): Promise<{ success: boolean; data?: PodRecordDto; message?: string }> => {
    return baseService.post<{ success: boolean; data?: PodRecordDto; message?: string }>("/pod/upload", data);
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
