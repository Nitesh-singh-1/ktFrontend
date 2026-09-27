import React from "react";
import { AlertTriangle } from "lucide-react";

export default function Input({
  label,
  required,
  error,
  helperText,
  className = "",
  containerClass = "",
  labelClass = "",
  value,
  onChange,
  ...props
}: InputProps) {
  const isControlled = value !== undefined;

  return (
    <div className={`flex flex-col gap-1 w-full ${containerClass}`}>
      {label && (
        <label className={`block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-0.5 ${labelClass}`}>
          {label}
          {required && <span className="text-[#D95C5C] font-bold ml-0.5">*</span>}
        </label>
      )}

      <input
        value={value}
        onChange={onChange}
        readOnly={isControlled && !onChange}
        className={`w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${
          error
            ? "border-[#D95C5C] focus:ring-[#D95C5C]/20 focus:border-[#D95C5C]"
            : "border-[#D9E2E3] dark:border-slate-700 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
        } rounded-xl text-[#111827] dark:text-slate-100 placeholder:text-[#94A3B8] font-medium shadow-2xs focus:outline-none focus:ring-1 transition-colors disabled:bg-[#F7F8F8] dark:disabled:bg-slate-800/60 disabled:text-[#94A3B8] disabled:cursor-not-allowed ${className}`}
        {...props}
      />

      {error && (
        <p className="mt-0.5 text-xs font-medium text-[#D95C5C] flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {helperText && !error && (
        <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  containerClass?: string;
  labelClass?: string;
};