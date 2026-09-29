import Swal from "sweetalert2";

/**
 * Thin wrapper around SweetAlert2 so every call site gets the same look
 * (teal accent matching the app palette, dark-mode aware) without repeating
 * config. Used for flows where a blocking, hard-to-miss confirmation is
 * warranted — e.g. a multi-step wizard's validation errors, where a toast
 * can get lost behind the modal it's layered under.
 *
 * For routine background notifications (save succeeded, list refreshed),
 * prefer the existing `toast` from `@/context/ToastContext` — it's
 * non-blocking and won't interrupt the user's flow.
 */
const swalError = (title: string, text?: string) =>
  Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#2F8E86",
    confirmButtonText: "OK",
  });

const swalSuccess = (title: string, text?: string) =>
  Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: "#2F8E86",
    confirmButtonText: "OK",
  });

const swalWarning = (title: string, text?: string) =>
  Swal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonColor: "#2F8E86",
    confirmButtonText: "OK",
  });

const swalConfirm = (title: string, text?: string, confirmButtonText = "Yes, continue") =>
  Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: "#D95C5C",
    cancelButtonColor: "#94A3B8",
    confirmButtonText,
    cancelButtonText: "Cancel",
  }).then((result) => result.isConfirmed);

export const sweetAlert = {
  error: swalError,
  success: swalSuccess,
  warning: swalWarning,
  /** Returns a Promise<boolean> — true if the user confirmed. */
  confirm: swalConfirm,
};
