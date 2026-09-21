"use client";

import React, { useState, useEffect, useRef } from "react";

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
          className={`w-full rounded-lg border border-slate-300 bg-white py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition disabled:bg-slate-100 disabled:text-slate-500
          ${icon ? "pl-9" : "pl-3"}
          ${searchTerm && !disabled ? "pr-14" : "pr-8"}`}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {loading && (
            <div className="animate-spin h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent rounded-full" />
          )}

          {searchTerm && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition"
              title="Clear"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
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
        <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg z-50 py-1 divide-y divide-slate-100">
          {results.length > 0 ? (
            results.map((item) => (
              <div
                key={getItemKey(item)}
                onClick={() => handleSelect(item)}
                className="px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-900 cursor-pointer transition flex items-center justify-between gap-2"
              >
                {renderItem ? (
                  renderItem(item)
                ) : (
                  <span className="font-semibold">{getItemLabel(item)}</span>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-3 text-center text-xs text-slate-500">
              {loading ? (
                <span>Searching masters...</span>
              ) : allowCustom && searchTerm ? (
                <div className="space-y-1">
                  <p className="text-slate-600">No exact match for <span className="font-bold">"{searchTerm}"</span></p>
                  <p className="text-[10px] text-blue-600 font-medium">Using custom entered value</p>
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
