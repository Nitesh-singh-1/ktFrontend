export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F8] dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-4 border-[#2F8E86] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-[#64748B] dark:text-slate-400">Loading…</p>
      </div>
    </div>
  );
}
