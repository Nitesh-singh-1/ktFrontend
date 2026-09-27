// src/components/ui/Select.tsx
import React from "react";
import { AlertTriangle } from "lucide-react";

type Option = {
  label: string;
  value: string | number;
};

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options?: Option[];
  label?: string;
  required?: boolean;
  error?: string;
  containerClass?: string;
  labelClass?: string;
};

export default function Select({
  options,
  label,
  required,
  error,
  containerClass = "",
  labelClass = "",
  className = "",
  children,
  ...props
}: SelectProps) {
  return (
    <div className={`flex flex-col gap-1 w-full ${containerClass}`}>
      {label && (
        <label className={`block text-xs font-semibold text-[#111827] dark:text-slate-200 mb-0.5 ${labelClass}`}>
          {label}
          {required && <span className="text-[#D95C5C] font-bold ml-0.5">*</span>}
        </label>
      )}

      <select
        className={`w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${
          error
            ? "border-[#D95C5C] focus:ring-[#D95C5C]/20 focus:border-[#D95C5C]"
            : "border-[#D9E2E3] dark:border-slate-700 focus:ring-[#47868C]/20 focus:border-[#47868C]"
        } rounded-lg text-[#111827] dark:text-slate-100 font-medium shadow-2xs focus:outline-none focus:ring-2 transition-colors cursor-pointer disabled:bg-[#F7F8F8] dark:disabled:bg-slate-800/60 disabled:text-[#94A3B8] ${className}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>

      {error && (
        <p className="mt-0.5 text-xs font-medium text-[#D95C5C] flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}