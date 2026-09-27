"use client";

import React from "react";

export interface DataTableColumn<T> {
  /** Stable id for the column. */
  key: string;
  /** Column header content. */
  header: React.ReactNode;
  /** Text alignment for header + cells. */
  align?: "left" | "right" | "center";
  /** Optional width utility, e.g. "w-40" or "min-w-[160px]". */
  width?: string;
  /** Extra classes for the header cell. */
  headerClassName?: string;
  /** Extra classes for the body cell. */
  cellClassName?: string;
  /** Custom cell renderer; defaults to (row as any)[key]. */
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  loading?: boolean;
  loadingText?: string;
  /** Empty-state content. */
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  /** Optional card header (left) — e.g. a title + count. */
  title?: React.ReactNode;
  /** Optional card header (right) — e.g. pagination summary. */
  headerRight?: React.ReactNode;
  /** Optional footer rendered inside the card (e.g. pagination controls). */
  footer?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Sticky header (needs maxHeight to scroll within the card). */
  stickyHeader?: boolean;
  /** Max height for a vertically-scrollable body, e.g. "70vh". */
  maxHeight?: string;
  className?: string;
}

const alignClass: Record<NonNullable<DataTableColumn<any>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  loadingText = "Loading…",
  emptyIcon,
  emptyTitle = "Nothing to show yet",
  emptyMessage = "There are no records for the current filters.",
  emptyAction,
  title,
  headerRight,
  footer,
  onRowClick,
  stickyHeader = false,
  maxHeight,
  className = "",
}: DataTableProps<T>) {
  const colCount = columns.length;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden ${className}`}
    >
      {(title || headerRight) && (
        <div className="px-5 py-3.5 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-[#111827] dark:text-slate-200 truncate">{title}</div>
          {headerRight && <div className="text-xs text-[#64748B] dark:text-slate-400 font-medium shrink-0">{headerRight}</div>}
        </div>
      )}

      <div className="overflow-x-auto" style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
        <table className="w-full text-left text-sm border-collapse">
          <thead className={stickyHeader ? "sticky top-0 z-10" : undefined}>
            <tr className="bg-[#F9FAFB] dark:bg-slate-800/50 border-b border-[#E5EAEB] dark:border-slate-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400 whitespace-nowrap ${alignClass[col.align || "left"]} ${col.width || ""} ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="text-center py-16">
                  <div className="w-8 h-8 border-4 border-[#2F8E86] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-[#94A3B8] text-xs font-medium">{loadingText}</span>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="text-center py-16">
                  {emptyIcon && <div className="flex justify-center mb-3 text-[#94A3B8]">{emptyIcon}</div>}
                  <div className="text-[#111827] dark:text-slate-200 font-bold text-sm">{emptyTitle}</div>
                  <p className="text-[#64748B] dark:text-slate-400 text-xs mt-1 max-w-sm mx-auto">{emptyMessage}</p>
                  {emptyAction && <div className="mt-4 flex justify-center">{emptyAction}</div>}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={rowKey(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-[#F1F3F4] dark:border-slate-800/70 last:border-0 transition-colors hover:bg-[#F6FBFB] dark:hover:bg-slate-800/40 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-3.5 align-middle whitespace-nowrap ${alignClass[col.align || "left"]} ${col.cellClassName || ""}`}
                    >
                      {col.render ? col.render(row, index) : ((row as any)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer && <div className="border-t border-[#E5EAEB] dark:border-slate-800">{footer}</div>}
    </div>
  );
}

export default DataTable;
