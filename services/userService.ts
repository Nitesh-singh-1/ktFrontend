import { baseService } from "./baseservice";

export interface SubUserDetails {
  id: number;
  tenantId: string;
  username: string;
  fullName: string;
  role: string;
  mobile?: string;
  isActive: boolean;
  createdAt?: string;
  assignedFeatures: string[];
  effectiveFeatures: string[];
}

export interface CreateSubUserPayload {
  username: string;
  password: string;
  fullName: string;
  mobile?: string;
  role?: string;
  assignedFeatures: string[];
}

export interface UpdateSubUserPayload {
  fullName?: string;
  mobile?: string;
  role?: string;
  isActive?: boolean;
}

export const userService = {
  getUsers: async (): Promise<SubUserDetails[]> => {
    try {
      const res = await baseService.get<SubUserDetails[]>("/users");
      return res || [];
    } catch (e) {
      console.error("Failed to fetch tenant users:", e);
      return [];
    }
  },

  getUserById: async (id: number): Promise<SubUserDetails | null> => {
    try {
      return await baseService.get<SubUserDetails>(`/users/${id}`);
    } catch (e) {
      console.error(`Failed to fetch user ${id}:`, e);
      return null;
    }
  },

  createSubUser: async (payload: CreateSubUserPayload): Promise<{ success: boolean; message?: string; data?: SubUserDetails }> => {
    try {
      const data = await baseService.post<SubUserDetails>("/users", payload);
      return { success: true, message: "Sub-user created successfully.", data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e?.message || "Failed to create sub-user." };
    }
  },

  updateSubUser: async (id: number, payload: UpdateSubUserPayload): Promise<{ success: boolean; message?: string; data?: SubUserDetails }> => {
    try {
      const data = await baseService.put<SubUserDetails>(`/users/${id}`, payload);
      return { success: true, message: "Sub-user updated successfully.", data };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e?.message || "Failed to update sub-user." };
    }
  },

  updatePermissions: async (id: number, assignedFeatures: string[]): Promise<{ success: boolean; message?: string }> => {
    try {
      await baseService.put(`/users/${id}/permissions`, { assignedFeatures });
      return { success: true, message: "Permissions updated successfully." };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e?.message || "Failed to update permissions." };
    }
  },

  toggleStatus: async (id: number, isActive: boolean): Promise<{ success: boolean; message?: string }> => {
    try {
      await baseService.put(`/users/${id}/status`, { isActive });
      return { success: true, message: `User ${isActive ? "activated" : "deactivated"} successfully.` };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e?.message || "Failed to toggle status." };
    }
  },

  adminResetPassword: async (id: number, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await baseService.post(`/users/${id}/reset-password`, { newPassword });
      return { success: true, message: "User password reset successfully." };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e?.message || "Failed to reset password." };
    }
  },

  deleteUser: async (id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      await baseService.delete(`/users/${id}`);
      return { success: true, message: "User deleted/deactivated successfully." };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e?.message || "Failed to delete user." };
    }
  },
};
