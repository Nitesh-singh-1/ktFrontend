export default function DashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Title bar */}
      <div className="h-8 w-56 rounded-lg bg-[#E5EAEB] dark:bg-slate-800" />
      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800" />
        ))}
      </div>
      {/* Table/content block */}
      <div className="h-72 rounded-2xl bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800" />
    </div>
  );
}
