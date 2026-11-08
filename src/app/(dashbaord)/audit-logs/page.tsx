"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  auditLogService,
  AuditLogItem,
  AuditLogPage,
} from "../../../../services/auditLogService";
import { DataTable, DataTableColumn } from "@/app/components/ui/DataTable";
import { TablePagination } from "@/app/components/ui/TablePagination";
import CustomSelect from "@/app/components/ui/CustomSelect";
import { PagePermissionGuard } from "@/app/components/ui/PagePermissionGuard";
import { sweetAlert } from "@/utils/sweetAlert";
import {
  ScrollText,
  ShieldCheck,
  RefreshCw,
  Filter,
  User as UserIcon,
  Globe,
} from "lucide-react";

function errMsg(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

function formatTimestamp(iso: string): string {
  if (!iso) return "—";
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
  const [data, setData] = useState<AuditLogPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [actionFilter, setActionFilter] = useState<string>("");
  // Distinct actions discovered across loads — drives the filter dropdown.
  const [knownActions, setKnownActions] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await auditLogService.getAuditLogs({
        page,
        pageSize,
        action: actionFilter || undefined,
      });
      setData(res);
      setKnownActions((prev) => {
        const next = new Set(prev);
        (res.items || []).forEach((i) => i.action && next.add(i.action));
        return Array.from(next).sort();
      });
    } catch (err) {
      sweetAlert.error(
        "Failed to Load Audit Log",
        errMsg(err, "Could not retrieve the audit log for this organization.")
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const actionOptions = useMemo(
    () => [
      { label: "All actions", value: "" },
      ...knownActions.map((a) => ({ label: a, value: a })),
    ],
    [knownActions]
  );

  const columns: DataTableColumn<AuditLogItem>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      width: "min-w-[180px]",
      render: (row) => (
        <span className="font-mono text-xs text-[#111827] dark:text-slate-200">
          {formatTimestamp(row.createdAt)}
        </span>
      ),
    },
    {
      key: "username",
      header: "User",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#111827] dark:text-slate-200">
          <UserIcon className="w-3.5 h-3.5 text-[#94A3B8]" />
          {row.username || (row.userId ? `#${row.userId}` : "system")}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono bg-[#E7F1F2] text-[#25776F] dark:bg-slate-800 dark:text-teal-300 border border-[#D9E2E3] dark:border-slate-700">
          {row.action}
        </span>
      ),
    },
    {
      key: "success",
      header: "Status",
      render: (row) =>
        row.success ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#25776F] dark:text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F8E86] shrink-0" />
            <span>Success</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span>Failed</span>
          </span>
        ),
    },
    {
      key: "entity",
      header: "Entity",
      render: (row) =>
        row.entityType ? (
          <span className="text-xs text-[#64748B] dark:text-slate-400">
            {row.entityType}
            {row.entityId ? (
              <span className="font-mono text-[#111827] dark:text-slate-200"> #{row.entityId}</span>
            ) : null}
          </span>
        ) : (
          <span className="text-[#94A3B8]">—</span>
        ),
    },
    {
      key: "ipAddress",
      header: "IP Address",
      render: (row) =>
        row.ipAddress ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#64748B] dark:text-slate-400">
            <Globe className="w-3.5 h-3.5 text-[#94A3B8]" />
            {row.ipAddress}
          </span>
        ) : (
          <span className="text-[#94A3B8]">—</span>
        ),
    },
    {
      key: "details",
      header: "Details",
      width: "max-w-[260px]",
      render: (row) =>
        row.details ? (
          <span
            className="block max-w-[260px] truncate text-xs text-[#64748B] dark:text-slate-400"
            title={row.details}
          >
            {row.details}
          </span>
        ) : (
          <span className="text-[#94A3B8]">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2F8E86] dark:text-teal-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Superadmin Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tracking-tight flex items-center gap-2">
            <ScrollText className="w-7 h-7 text-[#2F8E86]" />
            Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Immutable, append-only record of security and data events for your organization — most recent first.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => load()}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 text-[#111827] dark:text-slate-200 text-xs font-semibold hover:bg-[#F5FAFA] dark:hover:bg-slate-700/60 shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] dark:text-slate-400">
          <Filter className="w-4 h-4" />
          <span>Filter by action</span>
        </div>
        <div className="w-full sm:w-64">
          <CustomSelect
            value={actionFilter}
            onChange={(v) => {
              setPage(1);
              setActionFilter(String(v));
            }}
            options={actionOptions}
            searchable
            placeholder="All actions"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<AuditLogItem>
        columns={columns}
        data={data?.items || []}
        rowKey={(row) => row.id}
        loading={loading}
        loadingText="Loading audit entries…"
        emptyIcon={<ScrollText className="w-8 h-8" />}
        emptyTitle="No audit entries"
        emptyMessage={
          actionFilter
            ? `No events recorded for the "${actionFilter}" action.`
            : "No security or data events have been recorded for this organization yet."
        }
        footer={
          data && data.totalCount > 0 ? (
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalCount={data.totalCount}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPage(1);
                setPageSize(size);
              }}
            />
          ) : undefined
        }
      />
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <PagePermissionGuard permission="system.users.view" moduleName="Audit Log">
      <AuditLogContent />
    </PagePermissionGuard>
  );
}
