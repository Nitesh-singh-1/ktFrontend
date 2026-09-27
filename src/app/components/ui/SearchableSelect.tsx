"use client";

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface SearchableSelectProps<T> {
  value?: string;
  placeholder?: string;
  onSearch: (query: string) => Promise<T[]>;
  onSelect: (item: T) => void;
  onChangeText?: (text: string) => void;
  getItemLabel: (item: T) => string;
  getItemKey: (item: T) => string | number;
  renderItem?: (item: T) => React.ReactNode;
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
  badge?: string;
  icon?: string;
  required?: boolean;
}

export default function SearchableSelect<T>({
  value = "",
  placeholder = "Search or type...",
  onSearch,
  onSelect,
  onChangeText,
  getItemLabel,
  getItemKey,
  renderItem,
  allowCustom = true,
  disabled = false,
  className = "",
  badge,
  icon,
  required = false,
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchTerm(text);
    if (onChangeText) onChangeText(text);

    if (!isOpen) setIsOpen(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await onSearch(text);
        setResults(data);
      } catch (err) {
        console.error("SearchableSelect search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const handleFocus = async () => {
    if (disabled) return;
    setIsOpen(true);
    try {
      setLoading(true);
      const data = await onSearch(searchTerm || "");
      setResults(data);
    } catch (err) {
      console.error("SearchableSelect focus error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: T) => {
    const label = getItemLabel(item);
    setSearchTerm(label);
    if (onChangeText) onChangeText(label);
    onSelect(item);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchTerm("");
    if (onChangeText) onChangeText("");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-slate-400 text-sm pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required && !searchTerm}
          className={`w-full rounded-lg border border-[#D9E2E3] bg-white py-2 text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:border-[#47868C] focus:outline-none focus:ring-1 focus:ring-[#47868C]/30 transition disabled:bg-[#F7F8F8] disabled:text-[#94A3B8]
          ${icon ? "pl-9" : "pl-3"}
          ${searchTerm && !disabled ? "pr-14" : "pr-8"}`}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {loading && (
            <div className="animate-spin h-3.5 w-3.5 border-2 border-[#47868C] border-t-transparent rounded-full" />
          )}

          {searchTerm && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#94A3B8] hover:text-[#64748B] dark:hover:text-slate-200 p-0.5 rounded cursor-pointer transition"
              title="Clear"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="text-[#94A3B8] hover:text-[#64748B] p-0.5 rounded cursor-pointer"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#E5EAEB] bg-white shadow-md z-50 py-1 divide-y divide-[#F7F8F8]">
          {results.length > 0 ? (
            results.map((item) => (
              <div
                key={getItemKey(item)}
                onClick={() => handleSelect(item)}
                className="px-3 py-2 text-xs text-[#111827] hover:bg-[#E7F1F2] hover:text-[#3F7C82] cursor-pointer transition flex items-center justify-between gap-2"
              >
                {renderItem ? (
                  renderItem(item)
                ) : (
                  <span className="font-semibold">{getItemLabel(item)}</span>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-3 text-center text-xs text-[#64748B]">
              {loading ? (
                <span>Searching masters...</span>
              ) : allowCustom && searchTerm ? (
                <div className="space-y-1">
                  <p className="text-[#64748B]">No exact match for <span className="font-bold">"{searchTerm}"</span></p>
                  <p className="text-[10px] text-[#47868C] font-medium">Using custom entered value</p>
                </div>
              ) : (
                <span>No records found</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
