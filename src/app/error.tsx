"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled UI error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F8] dark:bg-slate-950 p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-sm p-8 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-[#B76E32]">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-[#111827] dark:text-white">Something went wrong</h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400">
            An unexpected error occurred while loading this page. You can try again or head back to your dashboard.
          </p>
          {error?.digest && (
            <p className="text-[11px] text-[#94A3B8] font-mono">Ref: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-sm transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 text-[#25776F] dark:text-teal-300 font-bold rounded-xl text-sm transition cursor-pointer"
          >
            <Home className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
