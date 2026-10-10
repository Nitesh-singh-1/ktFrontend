import { baseService } from "./baseservice";

export interface MenuItemAdminDto {
  id: number;
  key: string;
  parentKey: string | null;
  title: string;
  path: string | null;
  icon: string | null;
  permissionKey: string | null;
  badge: string | null;
  displayOrder: number;
  visibilityRule: string | null;
  isActive: boolean;
}

export interface BatchStatusResult {
  success: boolean;
  updatedCount: number;
  updatedKeys: string[];
  isActive: boolean;
}

export interface QuickActionResult {
  success: boolean;
  message: string;
  hiddenKeys?: string[];
  activeKeys?: string[];
}

export const menuAdminService = {
  getAll: () => baseService.get<MenuItemAdminDto[]>("/admin/menu-items"),

  updateStatus: (id: number, isActive: boolean) =>
    baseService.patch<MenuItemAdminDto>(`/admin/menu-items/${id}/status`, { isActive }),

  batchUpdateStatus: (payload: { keys?: string[]; ids?: number[]; isActive: boolean }) =>
    baseService.post<BatchStatusResult>("/admin/menu-items/batch-status", payload),

  hideIncompleteMasterData: () =>
    baseService.post<QuickActionResult>("/admin/menu-items/hide-incomplete-master-data"),

  resetMasterData: () =>
    baseService.post<QuickActionResult>("/admin/menu-items/reset-master-data"),
};
