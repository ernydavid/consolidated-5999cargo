import { ConsolidationsView } from "@/components/dashboard/consolidations-view";
import { getCurrentUser, requireSession } from "@/lib/dal";
import { requireRole } from "@/lib/permissions";
import { getConsolidations } from "@/modules/consolidations/queries";

export default async function ConsolidationsPage() {
  await requireSession();
  const user = await getCurrentUser();
  const currentUser = requireRole(user, "viewer");

  const rows = currentUser.organizationId
    ? await getConsolidations(currentUser.organizationId)
    : [];

  return (
    <div className="space-y-6">
      <ConsolidationsView
        rows={rows.map((row) => ({
          id: row.id,
          reference: row.reference,
          status: row.status,
          carrier: row.carrier ?? "Pending",
          createdAt: row.createdAt.toLocaleDateString(),
        }))}
      />
    </div>
  );
}
