"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
} from "lucide-react";

export interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  minDate?: string;
  maxDate?: string;
  className?: string;
  disabled?: boolean;
  align?: "left" | "right";
  direction?: "down" | "up" | "auto";
  disableFutureDates?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  label,
  minDate,
  maxDate,
  className = "",
  disabled = false,
  align = "right",
  direction = "auto",
  disableFutureDates = true,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayStr = today.toISOString().slice(0, 10);

  const effectiveMaxDate = maxDate ?? (disableFutureDates ? todayStr : undefined);

  // Active view month & year
  const initialDate = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Determine upward opening on trigger click or direction prop
  const handleToggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      if (direction === "up") {
        setOpenUpward(true);
      } else if (direction === "down") {
        setOpenUpward(false);
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If less than 320px below container, open upward
        setOpenUpward(spaceBelow < 320);
      }
      setViewMode("days");
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode("days");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (effectiveMaxDate) {
      const maxD = new Date(effectiveMaxDate + "T00:00:00");
      if (viewYear === maxD.getFullYear() && viewMonth >= maxD.getMonth()) {
        return;
      }
    }
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const toYmd = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const handleDayClick = (dayStr: string) => {
    if (effectiveMaxDate && dayStr > effectiveMaxDate) return;
    if (minDate && dayStr < minDate) return;

    onChange(dayStr);
    setIsOpen(false);
    setViewMode("days");
  };

  const handleSelectMonth = (monthIndex: number) => {
    setViewMonth(monthIndex);
    setViewMode("days");
  };

  const handleSelectYear = (year: number) => {
    setViewYear(year);
    if (effectiveMaxDate) {
      const maxD = new Date(effectiveMaxDate + "T00:00:00");
      if (year === maxD.getFullYear() && viewMonth > maxD.getMonth()) {
        setViewMonth(maxD.getMonth());
      }
    }
    setViewMode("months");
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange("");
    setIsOpen(false);
    setViewMode("days");
  };

  const handleSelectToday = () => {
    onChange(todayStr);
    setIsOpen(false);
    setViewMode("days");
  };

  // Build calendar matrix
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startOffset = firstDayOfMonth(viewYear, viewMonth);
  const calendarCells = [];

  for (let i = 0; i < startOffset; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push(toYmd(viewYear, viewMonth, d));
  }

  // Next month disabled check
  const isNextMonthDisabled = effectiveMaxDate
    ? (() => {
        const maxD = new Date(effectiveMaxDate + "T00:00:00");
        return (
          viewYear > maxD.getFullYear() ||
          (viewYear === maxD.getFullYear() && viewMonth >= maxD.getMonth())
        );
      })()
    : false;

  // Year choices (2020 to todayYear)
  const yearsList = Array.from(
    { length: Math.max(1, todayYear - 2019) },
    (_, i) => 2020 + i
  ).reverse();

  return (
    <div className={`relative ${className.includes("w-") ? "" : "inline-block"} ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Input Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        className={`w-full h-10 px-3 py-2 rounded-lg border flex items-center justify-between gap-2 text-xs font-semibold transition cursor-pointer select-none bg-white dark:bg-slate-800 shadow-2xs ${
          isOpen
            ? "border-[#2F8E86] ring-1 ring-[#2F8E86]/30"
            : "border-[#D9E2E3] dark:border-slate-700 hover:border-[#2F8E86]/60"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-2 overflow-hidden text-left">
          <CalendarIcon className="w-3.5 h-3.5 text-[#2F8E86] shrink-0" />
          <span
            className={`truncate ${
              value ? "text-[#111827] dark:text-white font-semibold" : "text-[#94A3B8] font-normal"
            }`}
          >
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>

        {value && !disabled && (
          <div
            onClick={handleClear}
            className="p-0.5 rounded-md text-[#94A3B8] hover:text-[#64748B] dark:hover:text-slate-200 transition ml-1"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </div>
        )}
      </button>

      {/* Calendar Popover (Z-index 100 with auto upward/downward smart positioning) */}
      {isOpen && (
        <div
          className={`absolute ${
            align === "left" ? "left-0" : "right-0"
          } ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } z-[100] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#D9E2E3] dark:border-slate-800 p-3.5 w-[280px] animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header Navigation */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            {viewMode === "days" && (
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Clickable Month & Year Trigger */}
            <button
              type="button"
              onClick={() => {
                if (viewMode === "days") setViewMode("months");
                else if (viewMode === "months") setViewMode("years");
                else setViewMode("days");
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 transition cursor-pointer"
            >
              <span>
                {viewMode === "years"
                  ? "Select Year"
                  : `${MONTH_NAMES[viewMonth]} ${viewYear}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#2F8E86]" />
            </button>

            {viewMode === "days" && (
              <button
                type="button"
                onClick={handleNextMonth}
                disabled={isNextMonthDisabled}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title={isNextMonthDisabled ? "Future month disabled" : "Next Month"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 1. DAYS VIEW */}
          {viewMode === "days" && (
            <div>
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAYS_SHORT.map((d) => (
                  <span key={d} className="text-[10px] font-bold text-slate-400">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarCells.map((dayStr, idx) => {
                  if (!dayStr) {
                    return <div key={`empty-${idx}`} className="h-7 w-full" />;
                  }

                  const dayNum = parseInt(dayStr.split("-")[2], 10);
                  const isFuture = effectiveMaxDate ? dayStr > effectiveMaxDate : false;
                  const isPastMin = minDate ? dayStr < minDate : false;
                  const isDisabled = isFuture || isPastMin;
                  const isSelected = value === dayStr;
                  const isCurrentDay = todayStr === dayStr;

                  if (isDisabled) {
                    return (
                      <div
                        key={dayStr}
                        className="h-7 w-full rounded-lg text-xs font-medium flex items-center justify-center text-slate-300 dark:text-slate-700 cursor-not-allowed select-none"
                      >
                        {dayNum}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={dayStr}
                      type="button"
                      onClick={() => handleDayClick(dayStr)}
                      className={`h-7 w-full rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                        isSelected
                          ? "bg-[#2F8E86] text-white font-bold shadow-xs"
                          : isCurrentDay
                          ? "border border-[#2F8E86] text-[#2F8E86] font-bold hover:bg-teal-50 dark:hover:bg-teal-950/40"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. MONTHS GRID VIEW (12-Month Grid) */}
          {viewMode === "months" && (
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {MONTH_SHORT.map((m, idx) => {
                const isSelected = viewMonth === idx;
                const isFutureMonth =
                  effectiveMaxDate &&
                  (() => {
                    const maxD = new Date(effectiveMaxDate + "T00:00:00");
                    return viewYear === maxD.getFullYear() && idx > maxD.getMonth();
                  })();

                if (isFutureMonth) {
                  return (
                    <div
                      key={m}
                      className="py-2.5 rounded-xl text-center text-xs font-medium text-slate-300 dark:text-slate-700 cursor-not-allowed select-none"
                    >
                      {m}
                    </div>
                  );
                }

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMonth(idx)}
                    className={`py-2.5 rounded-xl text-center text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? "bg-[#2F8E86] text-white shadow-xs"
                        : "text-slate-700 dark:text-slate-200 hover:bg-[#E7F1F2] dark:hover:bg-slate-800 hover:text-[#25776F]"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. YEARS GRID VIEW */}
          {viewMode === "years" && (
            <div className="grid grid-cols-3 gap-1.5 py-1 max-h-48 overflow-y-auto scrollbar-thin">
              {yearsList.map((y) => {
                const isSelected = viewYear === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => handleSelectYear(y)}
                    className={`py-2.5 rounded-xl text-center text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? "bg-[#2F8E86] text-white shadow-xs"
                        : "text-slate-700 dark:text-slate-200 hover:bg-[#E7F1F2] dark:hover:bg-slate-800 hover:text-[#25776F]"
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom Shortcuts */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[#2F8E86] font-bold hover:underline cursor-pointer"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => handleClear()}
                className="text-rose-600 font-semibold hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
