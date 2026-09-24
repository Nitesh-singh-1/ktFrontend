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
        <label className={`block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5 ${labelClass}`}>
          {label}
          {required && <span className="text-red-500 font-bold ml-0.5">*</span>}
        </label>
      )}

      <select
        className={`w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${
          error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
        } rounded-lg text-slate-900 dark:text-slate-100 font-medium shadow-2xs focus:outline-none focus:ring-2 transition-colors cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-500 ${className}`}
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
        <p className="mt-0.5 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}