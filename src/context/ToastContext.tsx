"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X, Copy } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
  /** Optional server-side correlation id (X-Request-Id). Rendered as a small copy-able
   *  reference at the bottom of the toast so users can hand it to support. */
  traceId?: string;
}

/** Optional payload for the imperative toast helpers.
 *  Passing a plain number keeps backwards compatibility with the old
 *  `toast.error(msg, 6000)` call sites. */
export type ToastOptions = number | { duration?: number; traceId?: string };

// Module-level emitter so toasts can be fired imperatively from anywhere — including non-React code
// (e.g. the API client) — via `toast.success(...)`, not just from components through `useToast()`.
type Listener = (t: Omit<ToastItem, "id">) => void;
const listeners = new Set<Listener>();
let seq = 0;

function normaliseOptions(opts?: ToastOptions): { duration: number; traceId?: string } {
  if (typeof opts === "number") return { duration: opts };
  return { duration: opts?.duration ?? 4000, traceId: opts?.traceId };
}

function emit(type: ToastType, message: string, opts?: ToastOptions) {
  const { duration, traceId } = normaliseOptions(opts);
  const payload: Omit<ToastItem, "id"> = { type, message, duration, traceId };
  if (listeners.size === 0) {
    // No provider mounted (SSR or very early) — degrade gracefully.
    if (type === "error" && typeof window !== "undefined") console.error(message, traceId ? `(traceId: ${traceId})` : "");
    return;
  }
  listeners.forEach((l) => l(payload));
}

export const toast = {
  success: (message: string, opts?: ToastOptions) => emit("success", message, opts),
  error: (message: string, opts?: ToastOptions) => emit("error", message, opts),
  info: (message: string, opts?: ToastOptions) => emit("info", message, opts),
  show: (message: string, opts?: ToastOptions) => emit("info", message, opts),
};

interface ToastContextValue {
  success: (m: string, opts?: ToastOptions) => void;
  error: (m: string, opts?: ToastOptions) => void;
  info: (m: string, opts?: ToastOptions) => void;
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
            className={`pointer-events-auto flex flex-col gap-1.5 bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 border-l-4 ${STYLES[t.type].border} rounded-xl shadow-lg p-3.5 animate-in slide-in-from-right-4 fade-in duration-200`}
          >
            <div className="flex items-start gap-3">
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
            {t.traceId && (
              <button
                type="button"
                onClick={() => {
                  try { navigator.clipboard?.writeText(t.traceId!); } catch { /* clipboard blocked — ignore */ }
                }}
                title="Copy reference ID for support"
                className="self-start ml-8 inline-flex items-center gap-1 text-[10px] font-mono text-[#94A3B8] hover:text-[#64748B] bg-[#F7F8F8] dark:bg-slate-800 border border-[#E5EAEB] dark:border-slate-700 rounded px-1.5 py-0.5 cursor-pointer transition"
              >
                <Copy className="w-2.5 h-2.5" />
                <span>Ref: {t.traceId}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
