"use client";

import { useEffect, useRef } from "react";
import { authService } from "../../services/authService";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://81.0.248.82:8080/api";

const CHECK_INTERVAL_MS = 30_000; // every 30s
const PREEMPTIVE_WINDOW_MS = 60_000; // refresh when < 60s remains

/**
 * TASK-039 — Session heartbeat.
 *
 * Mounted from the dashboard layout so it runs for every authenticated page.
 * Every 30 seconds it reads the JWT's `exp` claim via `authService.getTokenExpiryMs`:
 *   - If the token is already expired → logout and bounce to /login?reason=session_expired.
 *   - If less than 60s remains → preemptively hit /auth/refresh with the stored
 *     refreshToken, persist the new access+refresh pair; on failure, logout + redirect.
 *
 * This runs independently of API traffic, so an idle user (no XHR activity) can't
 * silently sit past their JWT lifetime. The 401 interceptor in baseservice.ts is
 * the backstop for the inverse case (traffic without the heartbeat having fired).
 */
export function useSessionHeartbeat(): void {
  // Guard against re-entry when a check is still in-flight.
  const runningRef = useRef(false);

  useEffect(() => {
    const expireAndRedirect = () => {
      authService.logout();
      if (typeof window !== "undefined") {
        const current = window.location.pathname;
        // Don't bounce if we're already on an auth-flow page — the user is in the
        // middle of signing in / resetting a password and a hard redirect would
        // interrupt them.
        if (
          !current.startsWith("/login") &&
          !current.startsWith("/register") &&
          !current.startsWith("/onboard") &&
          !current.startsWith("/accept-invite") &&
          !current.startsWith("/forgot-password")
        ) {
          window.location.href = "/login?reason=session_expired";
        }
      }
    };

    const check = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const exp = authService.getTokenExpiryMs();
        if (exp == null) return; // no token or no exp claim — leave it to login flow
        const now = Date.now();

        if (now >= exp) {
          expireAndRedirect();
          return;
        }

        if (exp - now <= PREEMPTIVE_WINDOW_MS) {
          const refreshToken =
            typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
          if (!refreshToken) {
            expireAndRedirect();
            return;
          }
          try {
            const res = await fetch(`${BASE_URL}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            });
            if (!res.ok) {
              expireAndRedirect();
              return;
            }
            const data = await res.json();
            if (data?.success && data?.token) {
              localStorage.setItem("token", data.token);
              if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
            } else {
              expireAndRedirect();
            }
          } catch {
            expireAndRedirect();
          }
        }
      } finally {
        runningRef.current = false;
      }
    };

    // Fire once immediately so a page loaded with an already-expired token logs
    // out on mount rather than waiting 30s.
    void check();
    const id = window.setInterval(() => {
      void check();
    }, CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);
}

export default useSessionHeartbeat;
