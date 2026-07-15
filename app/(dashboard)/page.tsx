import Link from "next/link";
import { ArrowRight, Settings2 } from "lucide-react";

import { PageTopPanel } from "@/components/dashboard/page-top-panel";
import { getCurrentUser, requireSession } from "@/lib/dal";
import { requireRole } from "@/lib/permissions";

const cards = [
  {
    label: "Auth & RBAC",
    value: "Ready",
    copy: "Supabase auth, session checks and role-aware dashboard access are in place.",
  },
  {
    label: "Settings Snapshot",
    value: "Ready",
    copy: "Calculation defaults are persisted and editable from the admin settings page.",
  },
  {
    label: "Consolidation Flow",
    value: "Next",
    copy: "The next phase starts from the new consolidado upload flow and preview import.",
  },
];

export default async function DashboardPage() {
  await requireSession();
  const user = await getCurrentUser();
  requireRole(user, "viewer");

  return (
    <div className="space-y-6">
      <PageTopPanel
        eyebrow="Foundation phase"
        title="Operational baseline"
        description="The shell, auth, route protection and settings workflow are ready. The next delivery layer starts with consolidado import and review."
        stats={cards.map((card, index) => ({
          label: card.label,
          value: card.value,
          tone: index === 2 ? "emphasis" : "default",
        }))}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/customs/consolidados"
          className="group min-h-28 rounded-[1.25rem] border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm transition hover:bg-cyan-100/80"
        >
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-[1rem] bg-white text-cyan-700 shadow-sm">
                <ArrowRight className="size-5" />
              </div>
              <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Open
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Go to consolidados
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Review active rows and enter the next import flow.
              </p>
            </div>
          </div>
        </Link>
        <Link
          href="/customs/settings"
          className="group min-h-28 rounded-[1.25rem] border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:bg-slate-50"
        >
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-[1rem] bg-slate-100 text-slate-700">
                <Settings2 className="size-5" />
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Settings
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Adjust baseline rates
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Maintain the default values used in customs calculations.
              </p>
            </div>
          </div>
        </Link>
        {cards.map((card) => (
          <article
            key={card.label}
            className="min-h-28 rounded-[1.25rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.copy}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
