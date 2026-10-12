"use client";

import React from "react";
import CustomSelect from "./CustomSelect";

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  alwaysShow?: boolean;
}

/**
 * Shared responsive pagination component for DataTable footers.
 *
 * Mobile-first responsive:
 * On mobile (<640px): Stacked vertical layout with centered touch-friendly buttons.
 * On desktop (>=640px): Clean space-between layout with entry count and navigation controls.
 */
export function TablePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  alwaysShow = true,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Hide only if there are 0 records
  if (totalCount === 0) {
    return null;
  }

  const goPrev = () => onPageChange(Math.max(1, page - 1));
  const goNext = () => onPageChange(Math.min(totalPages, page + 1));

  return (
    <div className="w-full px-4 sm:px-6 py-3.5 bg-[#F7F8F8] dark:bg-slate-800/60 border-t border-[#E5EAEB] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[#64748B] dark:text-slate-400 text-center sm:text-left">
        <span className="font-medium">
          Total Records:{" "}
          <strong className="text-[#111827] dark:text-slate-200 font-bold font-mono">
            {totalCount}
          </strong>
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
            <span className="text-[11px] text-[#94A3B8]">Per page:</span>
            <CustomSelect
              value={pageSize}
              onChange={(val) => onPageSizeChange(Number(val))}
              options={pageSizeOptions.map((opt) => ({
                label: `${opt} / page`,
                value: opt,
              }))}
              size="sm"
              direction="up"
              className="w-28"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 shrink-0">
        <button
          type="button"
          disabled={page <= 1}
          onClick={goPrev}
          className="min-w-[76px] sm:min-w-[84px] h-8 sm:h-9 px-3 py-1 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-semibold text-[#25776F] hover:bg-[#E7F1F2] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
        >
          Previous
        </button>
        <span className="text-xs font-semibold px-2 text-[#111827] dark:text-slate-300 whitespace-nowrap">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={goNext}
          className="min-w-[76px] sm:min-w-[84px] h-8 sm:h-9 px-3 py-1 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-semibold text-[#25776F] hover:bg-[#E7F1F2] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default TablePagination;
