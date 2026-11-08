import { baseService } from "./baseservice";

// Mirrors KTransport.API/DTOs/RoleManagementDtos.cs (backend: api/roles, RoleController).
// Tenant-scoped custom role management (RBAC hardening Phase 4).

/** Summary row for the role list screen. */
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

/** Full role detail including its granted permission keys. */
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
  /** Full permission key to grant, e.g. "consignments.create.delete". */
  key: string;
  /** Action label, e.g. "View", "Create", "Edit", "Delete". */
  action: string;
}

export interface AssignablePage {
  /** The feature/page key, e.g. "consignments.create". */
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
  /** Stable lower_snake_case identifier, unique per tenant (e.g. "dispatch_lead"). */
  code: string;
  name: string;
  description?: string;
  permissionKeys: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  /** Complete desired permission set; null/undefined leaves permissions as-is. */
  permissionKeys?: string[];
}

interface RoleMutationResult {
  success: boolean;
  message: string;
  role?: RoleDetail;
}

export const roleService = {
  getRoles: () => baseService.get<RoleSummary[]>("/roles"),

  /** The pages/actions this tenant may assign to a role — bounded by the modules they paid for. */
  getAssignablePermissions: () =>
    baseService.get<AssignablePermissions>("/roles/assignable-permissions"),

  getRole: (id: number) => baseService.get<RoleDetail>(`/roles/${id}`),

  createRole: (payload: CreateRolePayload) =>
    baseService.post<RoleMutationResult>("/roles", payload),

  updateRole: (id: number, payload: UpdateRolePayload) =>
    baseService.put<RoleMutationResult>(`/roles/${id}`, payload),

  deactivateRole: (id: number) =>
    baseService.delete<{ success: boolean; message: string }>(`/roles/${id}`),
};
