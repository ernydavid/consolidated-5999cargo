"use client";

import Link from "next/link";
import {
  CloudUpload,
  Eye,
  FilePlus2,
  Package2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

type ConsolidationRow = {
  id: string;
  reference: string;
  status: string;
  carrier: string;
  createdAt: string;
};

type StatusFilter = "all" | "draft" | "in_review" | "completed";

export function ConsolidationsView({
  rows,
}: Readonly<{
  rows: ConsolidationRow[];
}>) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesQuery =
        !query ||
        row.reference.toLowerCase().includes(query.toLowerCase()) ||
        row.carrier.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || row.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [query, rows, status]);

  const activeRows = rows.filter((row) => row.status !== "completed").length;
  const visibleRows = filteredRows.length;

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article className="min-h-28 rounded-[1.35rem] border border-slate-200/80 bg-white/92 p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-[1rem] bg-slate-100 text-slate-700">
            <Package2 className="size-5" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Total records
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {rows.length}
          </p>
        </article>

        <article className="min-h-28 rounded-[1.35rem] border border-slate-200/80 bg-white/92 p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-[1rem] bg-slate-100 text-slate-700">
            <FilePlus2 className="size-5" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Active records
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {activeRows}
          </p>
        </article>

        <article className="min-h-28 rounded-[1.35rem] border border-slate-200/80 bg-white/92 p-4 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-[1rem] bg-slate-100 text-slate-700">
            <Eye className="size-5" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Visible now
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {visibleRows}
          </p>
        </article>

        <Link
          href="/customs/consolidados/new"
          className="min-h-28 rounded-[1.35rem] border border-cyan-200/70 bg-cyan-50/60 p-4 shadow-sm transition hover:bg-cyan-100/70"
        >
          <div className="flex size-11 items-center justify-center rounded-[1rem] bg-white text-cyan-700 shadow-sm">
            <FilePlus2 className="size-5" />
          </div>
          <p className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
            New consolidado
          </p>
        </Link>

        <Link
          href="/customs/consolidados/new"
          className="min-h-28 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 p-4 shadow-sm transition hover:bg-slate-100/80"
        >
          <div className="flex size-11 items-center justify-center rounded-[1rem] bg-white text-slate-700 shadow-sm">
            <CloudUpload className="size-5" />
          </div>
          <p className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
            Import shipments
          </p>
        </Link>
      </section>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-12 w-full rounded-[1rem] border border-slate-200/80 bg-white/90 pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search receipt, consolidado, sender, receiver, carrier or email"
            value={query}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-12 items-center gap-2 rounded-[1rem] border border-slate-200/80 bg-white/90 px-3 text-sm text-slate-600 shadow-sm">
            <SlidersHorizontal className="size-4 text-slate-400" />
            <select
              className="bg-transparent outline-none"
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              value={status}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="in_review">In review</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button
            className="h-12 rounded-[1rem] border border-slate-200/80 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => {
              setQuery("");
              setStatus("all");
            }}
            type="button"
          >
            Reset
          </button>
        </div>
      </div>

      <section className="overflow-x-auto rounded-[1.9rem] border border-slate-200/80 bg-white/92 shadow-sm">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[1.3fr_0.8fr_0.9fr_0.8fr] gap-4 border-b border-slate-200/80 bg-slate-50/80 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:px-6">
            <span>Reference</span>
            <span>Status</span>
            <span>Carrier</span>
            <span>Created</span>
          </div>
          {filteredRows.length ? (
            filteredRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.3fr_0.8fr_0.9fr_0.8fr] gap-4 border-b border-slate-100 px-5 py-4 text-sm text-slate-700 transition hover:bg-slate-50/70 last:border-b-0 sm:px-6"
              >
                <Link
                  href={`/customs/consolidados/${row.id}`}
                  className="min-w-0 truncate font-medium text-slate-950 transition hover:text-cyan-700"
                >
                  {row.reference}
                </Link>
                <span className="capitalize">{row.status.replaceAll("_", " ")}</span>
                <span>{row.carrier}</span>
                <span>{row.createdAt}</span>
              </div>
            ))
          ) : (
            <div className="px-6 py-14">
              <p className="text-lg font-medium text-slate-700">
                No shipments match the current filters.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Adjust the search or filters, or create the next consolidado.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <button
          className="h-10 rounded-full border border-slate-200/80 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          type="button"
        >
          Previous
        </button>
        <p className="text-sm text-slate-500">
          Showing {filteredRows.length} of {rows.length} consolidations
        </p>
        <button
          className="h-10 rounded-full border border-slate-200/80 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
