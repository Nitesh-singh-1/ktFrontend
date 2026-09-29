"use client";

import { useEffect, useState } from "react";
import { authService } from "services/authService";

export type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export interface UsernameAvailability {
  status: UsernameStatus;
  message?: string;
}

/**
 * Debounced availability probe for a candidate username. Returns a stable status the
 * caller can render inline next to the input. The probe is skipped for inputs shorter
 * than 3 characters (backend rejects them anyway) so we don't spam the endpoint while
 * the user is still typing.
 *
 * Order of concerns intentionally: the returned `status` is a UX hint, NEVER a gate on
 * form submission. The server always re-checks on register/onboard/create.
 */
export function useUsernameAvailability(candidate: string, delayMs = 400): UsernameAvailability {
  const [result, setResult] = useState<UsernameAvailability>({ status: "idle" });

  useEffect(() => {
    const clean = (candidate || "").trim();
    if (clean.length === 0) {
      setResult({ status: "idle" });
      return;
    }
    if (clean.length < 3) {
      setResult({ status: "invalid", message: "Must be at least 3 characters." });
      return;
    }

    setResult({ status: "checking" });
    let cancelled = false;

    const t = setTimeout(async () => {
      const res = await authService.checkUsernameAvailable(clean);
      if (cancelled) return;
      if (!res.valid) {
        setResult({ status: "invalid", message: res.message });
        return;
      }
      setResult({
        status: res.available ? "available" : "taken",
        message: res.available ? undefined : `Username '${clean}' is already taken.`,
      });
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [candidate, delayMs]);

  return result;
}
