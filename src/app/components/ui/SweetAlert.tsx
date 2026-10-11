"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

// =============================================================================
// SweetAlert — centered modal alert for high-signal events.
//
// Mirrors the imperative-emitter pattern used by `ToastContext` so non-React
// code (API interceptors etc.) can trigger alerts via `sweetAlert.*(...)`.
// Mount `<SweetAlertProvider>` at the app root alongside `<ToastProvider>`.
// =============================================================================

export type SweetAlertType = "error" | "success" | "warning" | "confirm";

export interface SweetAlertOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Confirm variant only: render confirm button in rose/danger style. */
  danger?: boolean;
}

interface SweetAlertPayload extends SweetAlertOptions {
  id: number;
  type: SweetAlertType;
  resolve: (value: boolean) => void;
}

type Listener = (payload: SweetAlertPayload) => void;
const listeners = new Set<Listener>();
let seq = 0;

function emit(type: SweetAlertType, opts: SweetAlertOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const payload: SweetAlertPayload = {
      ...opts,
      id: ++seq,
      type,
      resolve,
    };
    if (listeners.size === 0) {
      // No provider mounted (SSR or very early) — degrade gracefully.
      if (typeof window !== "undefined") {
        console.warn(`[SweetAlert:${type}]`, opts.title, opts.message || "");
      }
      resolve(false);
      return;
    }
    listeners.forEach((l) => l(payload));
  });
}

export const sweetAlert = {
  error: (opts: SweetAlertOptions): Promise<void> =>
    emit("error", opts).then(() => undefined),
  success: (opts: SweetAlertOptions): Promise<void> =>
    emit("success", opts).then(() => undefined),
  warning: (opts: SweetAlertOptions): Promise<void> =>
    emit("warning", opts).then(() => undefined),
  confirm: (opts: SweetAlertOptions): Promise<boolean> => emit("confirm", opts),
};

// =============================================================================
// Visual spec
// =============================================================================

const ICON_SPEC: Record<SweetAlertType, { bg: string; fg: string; Icon: React.ElementType }> = {
  error:   { bg: "bg-rose-100 dark:bg-rose-500/15",       fg: "text-[#D95C5C]",  Icon: AlertCircle },
  success: { bg: "bg-emerald-100 dark:bg-emerald-500/15", fg: "text-[#2F9E8F]",  Icon: CheckCircle2 },
  warning: { bg: "bg-amber-100 dark:bg-amber-500/15",     fg: "text-amber-600",  Icon: AlertTriangle },
  confirm: { bg: "bg-slate-100 dark:bg-slate-800",        fg: "text-[#2F8E86]",  Icon: HelpCircle },
};

// =============================================================================
// Provider
// =============================================================================

export function SweetAlertProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<SweetAlertPayload[]>([]);
  const current = queue[0];

  useEffect(() => {
    const listener: Listener = (payload) => {
      setQueue((prev) => [...prev, payload]);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const close = useCallback(
    (payload: SweetAlertPayload, result: boolean) => {
      payload.resolve(result);
      setQueue((prev) => prev.filter((p) => p.id !== payload.id));
    },
    []
  );

  return (
    <>
      {children}
      {current && (
        <SweetAlertDialog
          key={current.id}
          payload={current}
          onClose={(result) => close(current, result)}
        />
      )}
    </>
  );
}

// =============================================================================
// Dialog
// =============================================================================

function SweetAlertDialog({
  payload,
  onClose,
}: {
  payload: SweetAlertPayload;
  onClose: (result: boolean) => void;
}) {
  const titleId = `sweet-alert-title-${payload.id}`;
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const isConfirm = payload.type === "confirm";
  const spec = ICON_SPEC[payload.type];

  // Focus the primary confirm button on open; Esc closes (= cancel for confirm).
  useEffect(() => {
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose(false);
      } else if (e.key === "Tab") {
        // Simple two-element focus trap.
        const focusables = [cancelBtnRef.current, confirmBtnRef.current].filter(
          Boolean
        ) as HTMLButtonElement[];
        if (focusables.length === 0) return;
        const active = document.activeElement as HTMLElement | null;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const confirmText = payload.confirmText ?? (isConfirm ? "Confirm" : "OK");
  const cancelText = payload.cancelText ?? "Cancel";

  const confirmClass = payload.danger
    ? "bg-[#D95C5C] hover:bg-[#B84848] focus-visible:ring-rose-300"
    : "bg-[#2F8E86] hover:bg-[#25776F] focus-visible:ring-[#2F8E86]/40";

  return (
    <div
      className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        // Click on backdrop (outside dialog) cancels.
        if (e.target === e.currentTarget) onClose(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#E5EAEB] dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${spec.bg}`}
          >
            <spec.Icon className={`w-6 h-6 ${spec.fg}`} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-lg font-bold text-[#111827] dark:text-white leading-snug"
            >
              {payload.title}
            </h2>
            {payload.message && (
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400 leading-relaxed whitespace-pre-line break-words">
                {payload.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          {isConfirm && (
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-semibold text-[#64748B] dark:text-slate-300 bg-transparent hover:bg-[#F7F8F8] dark:hover:bg-slate-800 border border-[#E5EAEB] dark:border-slate-700 rounded-lg transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8E86]/30"
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => onClose(true)}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition cursor-pointer focus:outline-none focus-visible:ring-2 ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
