"use client";

export default function DashboardError({
  error,
  reset,
}: Readonly<{
  error: Error;
  reset: () => void;
}>) {
  return (
    <div className="rounded-[28px] border border-rose-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <p className="text-sm font-medium text-rose-700">Something went wrong</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">
        The dashboard could not be loaded.
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{error.message}</p>
      <button
        className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}
