import { baseService } from "./baseservice";

export interface RoleSummary {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissionCount: number;
  assignedUserCount: number;
}

export interface RoleDetail {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissionKeys: string[];
}

export interface AssignableAction {
  key: string;
  action: string;
}
export interface AssignablePage {
  featureKey: string;
  actions: AssignableAction[];
}
export interface AssignableModule {
  moduleCode: string;
  moduleName: string;
  pages: AssignablePage[];
}
export interface AssignablePermissions {
  modules: AssignableModule[];
}

export interface CreateRolePayload {
  code: string;
  name: string;
  description?: string;
  permissionKeys: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissionKeys?: string[];
}

type MutationResult = { success: boolean; message?: string; role?: RoleDetail };

export const roleService = {
  getRoles: async (): Promise<RoleSummary[]> => {
    try {
      return (await baseService.get<RoleSummary[]>("/roles")) || [];
    } catch (e) {
      console.error("Failed to fetch roles:", e);
      return [];
    }
  },

  getAssignablePermissions: async (): Promise<AssignablePermissions> => {
    try {
      return (await baseService.get<AssignablePermissions>("/roles/assignable-permissions")) || { modules: [] };
    } catch (e) {
      console.error("Failed to fetch assignable permissions:", e);
      return { modules: [] };
    }
  },

  getRole: async (id: number): Promise<RoleDetail | null> => {
    try {
      return await baseService.get<RoleDetail>(`/roles/${id}`);
    } catch (e) {
      console.error(`Failed to fetch role ${id}:`, e);
      return null;
    }
  },

  createRole: async (payload: CreateRolePayload): Promise<MutationResult> => {
    try {
      return await baseService.post<MutationResult>("/roles", payload);
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e?.message || "Failed to create role." };
    }
  },

  updateRole: async (id: number, payload: UpdateRolePayload): Promise<MutationResult> => {
    try {
      return await baseService.put<MutationResult>(`/roles/${id}`, payload);
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e?.message || "Failed to update role." };
    }
  },

  deactivateRole: async (id: number): Promise<MutationResult> => {
    try {
      return await baseService.delete<MutationResult>(`/roles/${id}`);
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || e?.message || "Failed to deactivate role." };
    }
  },
};
