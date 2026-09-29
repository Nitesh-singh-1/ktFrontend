"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { tenantService, TenantUsageDto } from "../../../../services/tenantService";

const DISMISS_KEY = "kt.plan_usage_banner_dismissed";
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Small orange strip that surfaces the tenant's plan-usage warnings above the dashboard
 * content. Reads a pre-computed `warnings` array from `GET /api/tenant/usage`, so the
 * component itself has no threshold logic — the backend decides what to warn about.
 *
 * The banner is dismissible per-session (sessionStorage). Signing out or opening a new
 * tab resets the dismissal so a critical warning can't be silenced forever.
 */
export default function PlanUsageBanner() {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // sessionStorage blocked (private mode, etc.) — treat as not-dismissed and carry on.
    }

    let cancelled = false;
    const fetchUsage = async () => {
      try {
        const snapshot: TenantUsageDto = await tenantService.getMyUsage();
        if (!cancelled) setWarnings(snapshot.warnings || []);
      } catch {
        // Silent failure — the banner is a nice-to-have; a failed poll shouldn't
        // interrupt the dashboard. Try again on the next tick.
      }
    };

    fetchUsage();
    const timer = setInterval(fetchUsage, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (dismissed || warnings.length === 0) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Non-fatal — the in-memory state still hides it for this render.
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-[#F4A261]/40 bg-[#FFF7ED] dark:bg-amber-950/30 dark:border-[#F4A261]/50 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-[#B76E32] shrink-0 mt-0.5" />
      <div className="flex-1 text-xs text-[#7C2D12] dark:text-amber-100 font-semibold">
        <div className="uppercase tracking-wider text-[10px] text-[#B76E32] mb-1">Plan usage warning</div>
        <ul className="list-disc pl-4 space-y-0.5 font-medium">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-[#B76E32] hover:text-[#7C2D12] p-1 rounded-md hover:bg-[#F4A261]/20 transition cursor-pointer"
        aria-label="Dismiss plan usage warnings"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
