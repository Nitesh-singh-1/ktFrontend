"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

// Module-level emitter so toasts can be fired imperatively from anywhere — including non-React code
// (e.g. the API client) — via `toast.success(...)`, not just from components through `useToast()`.
type Listener = (t: Omit<ToastItem, "id">) => void;
const listeners = new Set<Listener>();
let seq = 0;

function emit(type: ToastType, message: string, duration = 4000) {
  const payload = { type, message, duration };
  if (listeners.size === 0) {
    // No provider mounted (SSR or very early) — degrade gracefully.
    if (type === "error" && typeof window !== "undefined") console.error(message);
    return;
  }
  listeners.forEach((l) => l(payload));
}

export const toast = {
  success: (message: string, duration?: number) => emit("success", message, duration),
  error: (message: string, duration?: number) => emit("error", message, duration),
  info: (message: string, duration?: number) => emit("info", message, duration),
  show: (message: string, duration?: number) => emit("info", message, duration),
};

interface ToastContextValue {
  success: (m: string, d?: number) => void;
  error: (m: string, d?: number) => void;
  info: (m: string, d?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({
  success: toast.success,
  error: toast.error,
  info: toast.info,
});

export const useToast = () => useContext(ToastContext);

const STYLES: Record<ToastType, { border: string; icon: React.ReactNode }> = {
  success: { border: "border-l-[#2F9E8F]", icon: <CheckCircle2 className="w-5 h-5 text-[#2F9E8F]" /> },
  error: { border: "border-l-[#D95C5C]", icon: <AlertCircle className="w-5 h-5 text-[#D95C5C]" /> },
  info: { border: "border-l-[#2F8E86]", icon: <Info className="w-5 h-5 text-[#2F8E86]" /> },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const listener: Listener = (t) => {
      const id = ++seq;
      setToasts((prev) => [...prev, { ...t, id }]);
      if (t.duration > 0) {
        setTimeout(() => remove(id), t.duration);
      }
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [remove]);

  return (
    <ToastContext.Provider value={{ success: toast.success, error: toast.error, info: toast.info }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 w-[92vw] max-w-sm pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 border-l-4 ${STYLES[t.type].border} rounded-xl shadow-lg p-3.5 animate-in slide-in-from-right-4 fade-in duration-200`}
          >
            <span className="shrink-0 mt-0.5">{STYLES[t.type].icon}</span>
            <p className="flex-1 text-sm font-medium text-[#111827] dark:text-slate-200 leading-snug break-words">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              aria-label="Dismiss"
              className="shrink-0 text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
