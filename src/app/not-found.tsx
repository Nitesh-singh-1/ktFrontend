import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F8] dark:bg-slate-950 p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-sm p-8 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E7F1F2] dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 flex items-center justify-center text-[#2F8E86]">
          <Compass className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black text-[#111827] dark:text-white tracking-tight">404</h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400">
            We couldn't find the page you're looking for. It may have been moved or no longer exists.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-sm transition cursor-pointer"
        >
          <Home className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
