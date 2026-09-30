"use client";

import React, { useEffect, useState } from "react";
import { Clock, ShieldAlert, AlertTriangle } from "lucide-react";

// Preview-build kill switch. Originally set for 2026-09-30 IST as a licensing hold on
// pilot deployments; pushed to end of 2027 because the app is now in real B2B production
// use and a client-side date lockout would hard-block every paying tenant — including any
// enterprise customer we can't reach on the night it fires.
//
// TODO: rip this guard out entirely. Legitimate license enforcement belongs on the server
// (see TenantSubscription.ExpiresAt + PlanUsageBanner from TASK-007), not a hard-coded
// client date any user can bypass by resetting their system clock.
const EXPIRY_DATE = new Date("2027-12-31T23:59:59+05:30");

export default function BuildExpiryGuard({ children }: { children: React.ReactNode }) {
  const [isExpired, setIsExpired] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    const checkExpiry = () => {
      const now = new Date();
      if (now >= EXPIRY_DATE) {
        setIsExpired(true);
      } else {
        const diffTime = EXPIRY_DATE.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950 text-white p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-rose-800/80 rounded-3xl p-8 text-center shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>Validity Expired</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Build Validity Expired
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              This preview build of <strong className="text-slate-200">K-Transport / FleetPulse TMS</strong> was licensed for testing through{" "}
              <strong className="text-rose-300">
                {EXPIRY_DATE.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </strong>{" "}
              and has reached its expiration date.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 space-y-2 text-left">
            <div className="font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>How to renew access:</span>
            </div>
            <p className="text-slate-400">
              Please contact your system administrator or software provider to obtain the latest production release.
            </p>
          </div>

          <p className="text-[11px] text-slate-500 font-mono">
            Build Version: 1.0.1 • License End:{" "}
            {EXPIRY_DATE.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {daysRemaining !== null && daysRemaining <= 5 && (
        <div className="fixed bottom-3 right-3 z-50 px-3.5 py-2 bg-amber-500/90 text-slate-950 font-bold text-xs rounded-xl shadow-lg border border-amber-400/50 flex items-center gap-2 backdrop-blur-xs">
          <Clock className="w-4 h-4" />
          <span>
            Build validity expires in {daysRemaining} day{daysRemaining === 1 ? "" : "s"} (
            {EXPIRY_DATE.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})
          </span>
        </div>
      )}
    </>
  );
}
