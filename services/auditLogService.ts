import { baseService } from "./baseservice";

/**
 * One row from the security audit log (GET /api/auditlog). Mirrors the projection
 * the AuditLogController returns — see kt_backend AuditLogController.GetAuditLogs.
 * Super-User only; the backend scopes rows to the caller's tenant.
 */
export interface AuditLogEntry {
  id: number;
  userId: number | null;
  username: string | null;
  action: string;
  success: boolean;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: AuditLogEntry[];
}

export const auditLogService = {
  /**
   * Fetch one page of the current tenant's audit log, most recent first.
   * `action` optionally filters to a single action type (exact match).
   */
  list: async (params: { page?: number; pageSize?: number; action?: string } = {}): Promise<AuditLogPage> => {
    const q = new URLSearchParams();
    q.set("page", String(params.page ?? 1));
    q.set("pageSize", String(params.pageSize ?? 25));
    if (params.action) q.set("action", params.action);
    return await baseService.get<AuditLogPage>(`/auditlog?${q.toString()}`);
  },
};
