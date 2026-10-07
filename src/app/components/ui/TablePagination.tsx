"use client";

import React from "react";

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

/**
 * Shared responsive pagination component for DataTable footers.
 *
 * On mobile (<640px): "Showing X to Y of Z" sits above a centered button row
 * with full-width-friendly tap targets (min-w-[88px], min-h-9).
 *
 * On >=640px: the entries text and buttons sit on one row with
 * space-between, matching the enterprise look used across the app.
 *
 * Renders nothing when totalCount <= pageSize (no need to paginate).
 */
export function TablePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Only render when there's more than one page
  if (totalCount <= pageSize || totalPages <= 1) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  const goPrev = () => onPageChange(Math.max(1, page - 1));
  const goNext = () => onPageChange(Math.min(totalPages, page + 1));

  return (
    <div className="px-5 py-3 bg-[#F7F8F8] dark:bg-slate-800/60 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-[#64748B] dark:text-slate-400 text-center sm:text-left">
        Showing {start} to {end} of {totalCount} entries
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={goPrev}
          className="min-w-[88px] min-h-9 px-3 py-1 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs font-semibold text-[#25776F] hover:bg-[#E7F1F2] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
        >
          Previous
        </button>
        <span className="text-xs font-semibold px-2 text-[#111827] dark:text-slate-300 whitespace-nowrap">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={goNext}
          className="min-w-[88px] min-h-9 px-3 py-1 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-md text-xs font-semibold text-[#25776F] hover:bg-[#E7F1F2] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default TablePagination;
