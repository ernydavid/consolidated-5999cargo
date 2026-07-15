import { PageTopPanel } from "@/components/dashboard/page-top-panel";
import { getCurrentUser, requireSession } from "@/lib/dal";
import { requireRole } from "@/lib/permissions";

export default async function NewConsolidationPage() {
  await requireSession();
  const user = await getCurrentUser();
  requireRole(user, "customs_agent");

  return (
    <div className="space-y-6">
      <PageTopPanel
        eyebrow="Phase 2 entrypoint"
        title="New consolidado"
        description="This screen will host the import flow. For now it outlines the required metadata and file inputs."
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          "Consolidado reference",
          "Carrier",
          "Flight date",
          "Excel file upload",
        ].map((field) => (
          <div
            key={field}
            className="min-h-28 rounded-[1.25rem] border border-dashed border-slate-300 bg-white/82 p-4 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-950">{field}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Planned for the next implementation turn.
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
