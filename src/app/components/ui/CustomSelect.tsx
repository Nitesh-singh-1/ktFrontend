"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface SelectOption {
  label: string;
  value: string | number;
  badge?: string | number;
  description?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  align?: "left" | "right";
  direction?: "down" | "up" | "auto";
  size?: "sm" | "md";
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select option...",
  label,
  icon,
  searchable = false,
  disabled = false,
  className = "",
  dropdownClassName = "",
  align = "left",
  direction = "auto",
  size = "md",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  }>({
    left: 0,
    width: 200,
    maxHeight: 320,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Find selected option
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Filtered options if searchable
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.description && opt.description.toLowerCase().includes(q))
    );
  });

  const isFullWidth = className.includes("w-full") || className.includes("w-");

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    const idealHeight = 320;

    // Smart direction decision:
    let shouldOpenUp = false;
    if (direction === "up") {
      shouldOpenUp = true;
    } else if (direction === "down") {
      shouldOpenUp = false;
    } else {
      // direction === "auto"
      // If there's comfortable space below (>= 260px), always prefer opening down
      if (spaceBelow >= 260) {
        shouldOpenUp = false;
      } else if (spaceAbove > spaceBelow && spaceAbove >= 200) {
        // Open up only if there is substantially more space above and at least 200px available
        shouldOpenUp = true;
      } else {
        // Otherwise, open in whichever direction offers more space
        shouldOpenUp = spaceAbove > spaceBelow;
      }
    }
    setOpenUpward(shouldOpenUp);

    const triggerWidth = rect.width;
    const popoverWidth = isFullWidth ? triggerWidth : Math.max(triggerWidth, 200);

    let left = align === "right" ? rect.right - popoverWidth : rect.left;
    if (left + popoverWidth > viewportWidth - 12) {
      left = viewportWidth - popoverWidth - 12;
    }
    if (left < 12) left = 12;

    if (shouldOpenUp) {
      // Calculate available height between trigger top and top edge of viewport (leaving 16px margin)
      const availableHeight = Math.max(140, rect.top - 16);
      const maxHeight = Math.min(idealHeight, availableHeight);

      setCoords({
        bottom: viewportHeight - rect.top + 6,
        left,
        width: popoverWidth,
        maxHeight,
      });
    } else {
      // Calculate available height between trigger bottom and bottom edge of viewport (leaving 16px margin)
      const availableHeight = Math.max(140, viewportHeight - rect.bottom - 16);
      const maxHeight = Math.min(idealHeight, availableHeight);

      setCoords({
        top: rect.bottom + 6,
        left,
        width: popoverWidth,
        maxHeight,
      });
    }
  };

  const handleToggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Recalculate on scroll / resize
  useEffect(() => {
    if (!isOpen) return;
    updateCoords();
    const handleScrollOrResize = () => updateCoords();
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen, searchable]);

  const handleSelect = (optVal: string | number) => {
    onChange(optVal);
    setIsOpen(false);
  };

  return (
    <div
      className={`relative ${isFullWidth ? "w-full" : "inline-block"} ${isOpen ? "z-[70]" : "z-auto"} ${className}`}
      ref={containerRef}
    >
      {label && (
        <label className="block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        className={`w-full ${
          size === "sm" ? "h-9 px-2.5 py-1 text-xs" : "h-10 px-3.5 py-2 text-xs"
        } rounded-lg border flex items-center justify-between gap-2 font-semibold transition cursor-pointer select-none bg-white dark:bg-slate-800 shadow-2xs ${
          isOpen
            ? "border-[#2F8E86] ring-1 ring-[#2F8E86]/30"
            : "border-[#D9E2E3] dark:border-slate-700 hover:border-[#2F8E86]/60"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-2 overflow-hidden text-left">
          {icon && <span className="text-[#2F8E86] shrink-0">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span
            className={`truncate ${
              selectedOption
                ? "text-slate-900 dark:text-slate-100 font-bold"
                : "text-slate-400 font-medium"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge !== undefined && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-teal-50 dark:bg-teal-950/40 text-[#2F8E86] border border-teal-200 dark:border-teal-800">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? "rotate-180 text-[#2F8E86]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu (Rendered in Portal at z-[99999] with clamped maxHeight and flex-col so search is NEVER clipped) */}
      {mounted && isOpen && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: coords.top !== undefined ? `${coords.top}px` : "auto",
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : "auto",
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: `${coords.maxHeight}px`,
            zIndex: 99999,
          }}
          className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#D9E2E3] dark:border-slate-800 py-1.5 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${dropdownClassName}`}
        >
          {/* Search Box - ALWAYS shrink-0 so it NEVER gets cut off or compressed */}
          {searchable && (
            <div className="shrink-0 px-2.5 pb-2 pt-1 border-b border-slate-100 dark:border-slate-800">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-[#F7F8F8] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2F8E86]"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List - fills remaining space and scrolls smoothly */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-3 py-2 text-xs font-semibold text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-teal-50 dark:bg-teal-950/40 text-[#25776F] dark:text-teal-300"
                        : "text-slate-700 dark:text-slate-200 hover:bg-[#F7F8F8] dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                      {opt.badge !== undefined && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#2F8E86] shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-center text-xs text-slate-400">
                No matching options
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
