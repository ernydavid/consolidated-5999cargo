export default function DashboardLoading() {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-56 rounded-full bg-slate-200" />
        <div className="h-28 rounded-3xl bg-slate-100" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-36 rounded-3xl bg-slate-100" />
          <div className="h-36 rounded-3xl bg-slate-100" />
          <div className="h-36 rounded-3xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
