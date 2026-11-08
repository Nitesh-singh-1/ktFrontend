import { baseService } from "./baseservice";

// Mirrors KTransport.API/Controllers/AuditLogController.cs (backend: api/auditlog).
// Read-only, tenant-scoped, Super User only. Most recent first.

export interface AuditLogItem {
  id: number;
  userId?: number | null;
  username?: string | null;
  action: string;
  success: boolean;
  entityType?: string | null;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: AuditLogItem[];
}

export interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  action?: string;
}

export const auditLogService = {
  getAuditLogs: ({ page = 1, pageSize = 25, action }: AuditLogQuery = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (action && action.trim()) params.set("action", action.trim());
    return baseService.get<AuditLogPage>(`/auditlog?${params.toString()}`);
  },
};
