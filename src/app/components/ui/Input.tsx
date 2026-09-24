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
        <label className={`block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5 ${labelClass}`}>
          {label}
          {required && <span className="text-red-500 font-bold ml-0.5">*</span>}
        </label>
      )}

      <input
        value={value}
        onChange={onChange}
        readOnly={isControlled && !onChange}
        className={`w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${
          error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
        } rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium shadow-2xs focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed ${className}`}
        {...props}
      />

      {error && (
        <p className="mt-0.5 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {helperText && !error && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
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