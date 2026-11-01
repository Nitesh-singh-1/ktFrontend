"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ShieldAlert, RefreshCw, History } from "lucide-react";
import PagePermissionGuard from "@/app/components/ui/PagePermissionGuard";
import { DataTable, DataTableColumn } from "@/app/components/ui/DataTable";
import { TablePagination } from "@/app/components/ui/TablePagination";
import CustomSelect from "@/app/components/ui/CustomSelect";
import { auditLogService, AuditLogEntry } from "../../../../services/auditLogService";

// Curated list of the actions the backend records (see AuditLogService callers).
// "" = no filter (all actions).
const ACTION_OPTIONS = [
  { label: "All actions", value: "" },
  { label: "Record updated", value: "Update" },
  { label: "Record deleted", value: "Delete" },
  { label: "Login", value: "Login" },
  { label: "Login failed", value: "LoginFailed" },
  { label: "Account locked", value: "LoginLocked" },
  { label: "Password reset requested", value: "PasswordResetRequested" },
  { label: "Password reset", value: "PasswordReset" },
  { label: "Password reset failed", value: "PasswordResetFailed" },
  { label: "Password changed", value: "PasswordChanged" },
  { label: "Profile updated", value: "ProfileUpdated" },
  { label: "User invited", value: "UserInvited" },
  { label: "Invite accepted", value: "InviteAccepted" },
];

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function AuditLogContent() {
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditLogService.list({ page, pageSize, action: action || undefined });
      setRows(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch (e: any) {
      setRows([]);
      setTotalCount(0);
      setError(e?.message || "Could not load the audit log. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, action]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: "createdAt",
      header: "When",
      width: "min-w-[190px]",
      render: (r) => (
        <span className="font-mono text-[12px] text-[#111827] dark:text-slate-200">{formatWhen(r.createdAt)}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#111827] dark:text-slate-200">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.success ? "bg-[#2F8E86]" : "bg-red-500"}`}
          />
          <span>{r.action}</span>
        </span>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      render: (r) =>
        r.entityType ? (
          <span className="text-xs text-[#111827] dark:text-slate-200">
            {r.entityType}
            {r.entityId ? <span className="text-[#94A3B8] font-mono"> #{r.entityId}</span> : null}
          </span>
        ) : (
          <span className="text-[#94A3B8]">—</span>
        ),
    },
    {
      key: "username",
      header: "User",
      render: (r) => r.username || <span className="text-[#94A3B8]">—</span>,
    },
    {
      key: "status",
      header: "Result",
      render: (r) =>
        r.success ? (
          <span className="text-xs font-medium text-[#25776F] dark:text-teal-400">Success</span>
        ) : (
          <span className="text-xs font-semibold text-red-600 dark:text-red-400">Failed</span>
        ),
    },
    {
      key: "ipAddress",
      header: "IP address",
      render: (r) => (
        <span className="font-mono text-[12px] text-[#64748B] dark:text-slate-400">{r.ipAddress || "—"}</span>
      ),
    },
    {
      key: "details",
      header: "Details",
      width: "min-w-[220px]",
      render: (r) =>
        r.details ? (
          <span
            title={r.details}
            className="block max-w-[340px] truncate text-xs text-[#64748B] dark:text-slate-400"
          >
            {r.details}
          </span>
        ) : (
          <span className="text-[#94A3B8]">—</span>
        ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E7F1F2] dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 flex items-center justify-center text-[#2F8E86] shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111827] dark:text-white">Audit Log</h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-0.5">
              Security &amp; access events for your organization — logins, password resets, invitations and profile
              changes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-52">
            <CustomSelect
              value={action}
              onChange={(v) => {
                setPage(1);
                setAction(String(v));
              }}
              options={ACTION_OPTIONS}
              size="sm"
            />
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 text-xs font-semibold text-[#25776F] hover:bg-[#E7F1F2] dark:hover:bg-slate-700 transition shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <DataTable<AuditLogEntry>
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        loading={loading}
        loadingText="Loading audit log…"
        emptyIcon={<History className="w-8 h-8" />}
        emptyTitle="No audit events"
        emptyMessage="No security events match the current filter yet."
        footer={
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPage(1);
              setPageSize(s);
            }}
          />
        }
      />
    </div>
  );
}

export default function AuditLogPage() {
  // Backend endpoint is Super-User only (RequireSuperUser). "system.users.view" is a
  // catalog permission every tenant admin holds (same gate the Roles screen uses), so
  // the menu row and this guard stay consistent with who the API actually allows.
  return (
    <PagePermissionGuard permission="system.users.view" moduleName="Audit Log">
      <AuditLogContent />
    </PagePermissionGuard>
  );
}
