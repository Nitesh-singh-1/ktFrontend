import { sweetAlert as modal } from "@/app/components/ui/SweetAlert";

/**
 * Positional-argument adapter over the app's single themed alert modal
 * (`@/app/components/ui/SweetAlert`). Historically this file wrapped the
 * sweetalert2 library, which did NOT match the app theme (no dark mode, default
 * green buttons). It now delegates to the in-app modal so every call site —
 * whether it uses this positional API or the object API — renders the same
 * teal/dark-mode-aware popup.
 *
 * Prefer the object API from `@/app/components/ui/SweetAlert` in new code; this
 * positional shim exists so older call sites keep working unchanged.
 *
 * For routine, non-blocking notifications (save succeeded, list refreshed),
 * prefer `toast` from `@/context/ToastContext` instead.
 */
export const sweetAlert = {
  error: (title: string, text?: string) => modal.error({ title, message: text }),
  success: (title: string, text?: string) => modal.success({ title, message: text }),
  warning: (title: string, text?: string) => modal.warning({ title, message: text }),
  info: (title: string, text?: string) => modal.info({ title, message: text }),
  /** Authentication / permission failure popup (401/403). */
  unauthorized: (title?: string, text?: string) => modal.unauthorized({ title, message: text }),
  /**
   * Returns a Promise<boolean> — true if the user confirmed. Rendered with the
   * destructive (rose) confirm button, matching this shim's historical look.
   */
  confirm: (title: string, text?: string, confirmButtonText = "Yes, continue") =>
    modal.confirm({ title, message: text, confirmText: confirmButtonText, danger: true }),
};
