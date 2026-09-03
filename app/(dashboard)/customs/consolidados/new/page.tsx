import { PageTopPanel } from "@/components/dashboard/page-top-panel";
import { ConsolidationImportForm } from "@/components/customs/consolidation-import-form";
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
        description="Upload the source workbook, validate every package row and confirm the import only after reviewing duplicates, invalid rows and customer grouping."
      />

      <ConsolidationImportForm />
    </div>
  );
}
