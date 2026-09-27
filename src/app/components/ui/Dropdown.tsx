"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface DropdownOption {
  value: string | number;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | number | undefined | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  /** Show a search box inside the panel (auto-enabled when > 8 options unless set false). */
  searchable?: boolean;
  disabled?: boolean;
  /** Extra classes for the trigger button. */
  className?: string;
  /** Visual error state (red border). */
  error?: boolean;
  /** Message shown when the (filtered) list is empty. */
  emptyText?: string;
  id?: string;
}

/**
 * Generic, dependency-free single-select dropdown styled to match the app UI
 * (teal focus, rounded, xs text). Closes on outside-click and Escape.
 */
export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchable,
  disabled = false,
  className = "",
  error = false,
  emptyText = "No options",
  id,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const showSearch = searchable ?? options.length > 8;

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.sublabel || "").toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && showSearch) {
      setQuery("");
      setActiveIndex(0);
      // focus search shortly after the panel mounts
      const t = setTimeout(() => searchRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open, showSearch]);

  const commit = (opt: DropdownOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) commit(opt);
    }
  };

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 h-10 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold text-left transition focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
          error ? "border-red-300" : "border-[#D9E2E3] dark:border-slate-700"
        } ${open ? "ring-2 ring-[#2F8E86]/20 border-[#2F8E86]" : ""}`}
      >
        <span className={`truncate ${selected ? "text-[#111827] dark:text-white" : "text-[#94A3B8]"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[#94A3B8] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-700 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {showSearch && (
            <div className="p-2 border-b border-[#F1F3F4] dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                  onKeyDown={onKeyDown}
                  placeholder="Search…"
                  className="w-full pl-8 pr-2 py-1.5 bg-[#F7F8F8] dark:bg-slate-800 border border-[#E5EAEB] dark:border-slate-700 rounded-lg text-xs text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2F8E86]"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[#94A3B8]">{emptyText}</div>
            ) : (
              filtered.map((opt, i) => {
                const isSelected = String(opt.value) === String(value);
                const isActive = i === activeIndex;
                return (
                  <button
                    type="button"
                    key={`${opt.value}`}
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(opt)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isActive ? "bg-[#E7F1F2] dark:bg-slate-800" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className={`block text-xs font-semibold truncate ${isSelected ? "text-[#25776F]" : "text-[#111827] dark:text-slate-200"}`}>
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span className="block text-[10px] text-[#94A3B8] truncate">{opt.sublabel}</span>
                      )}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#2F8E86] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dropdown;
