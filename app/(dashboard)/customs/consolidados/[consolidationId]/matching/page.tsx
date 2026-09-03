import Link from "next/link";
import { notFound } from "next/navigation";

import { PageTopPanel } from "@/components/dashboard/page-top-panel";
import { getCurrentUser, requireSession } from "@/lib/dal";
import { requireRole } from "@/lib/permissions";
import { getConsolidationDetail } from "@/modules/consolidations/queries";
import {
  clearManualInvoiceMatchAction,
  saveManualInvoiceMatchAction,
} from "@/modules/matching/actions";
import { syncInvoiceMatchingForConsolidation } from "@/modules/matching/service";

export default async function ConsolidationMatchingPage({
  params,
}: Readonly<{
  params: Promise<{
    consolidationId: string;
  }>;
}>) {
  await requireSession();
  const user = await getCurrentUser();
  const currentUser = requireRole(user, "viewer");

  if (!currentUser.organizationId) {
    notFound();
  }

  const { consolidationId } = await params;
  const detail = await getConsolidationDetail(
    currentUser.organizationId,
    consolidationId,
  );

  if (!detail) {
    notFound();
  }

  const evaluations = await syncInvoiceMatchingForConsolidation({
    consolidationId,
    organizationId: currentUser.organizationId,
  });
  const packageById = new Map(detail.packageRows.map((row) => [row.id, row]));
  const stats = {
    total: evaluations.length,
    autoMatched: evaluations.filter((item) => item.evaluation.status === "auto_matched")
      .length,
    manualMatched: evaluations.filter(
      (item) => item.evaluation.status === "manual_matched",
    ).length,
    suggested: evaluations.filter((item) => item.evaluation.status === "suggested")
      .length,
    ambiguous: evaluations.filter((item) => item.evaluation.status === "ambiguous")
      .length,
    unmatched: evaluations.filter((item) => item.evaluation.status === "unmatched")
      .length,
  };

  return (
    <div className="space-y-6">
      <PageTopPanel
        eyebrow="Matching review"
        title={`Invoice matching · ${detail.consolidation.reference}`}
        description="Review deterministic candidates from filename, tracking, customer email and customer-name signals. Auto-match is only persisted when the score is clearly ahead."
        actions={
          <>
            <Link
              className="inline-flex h-12 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              href={`/customs/consolidados/${consolidationId}/invoices`}
            >
              Open invoices
            </Link>
            <Link
              className="inline-flex h-12 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              href={`/customs/consolidados/${consolidationId}`}
            >
              Back to consolidado
            </Link>
          </>
        }
        stats={[
          { label: "Invoices", value: String(stats.total) },
          { label: "Auto", value: String(stats.autoMatched) },
          { label: "Manual", value: String(stats.manualMatched) },
          { label: "Suggested", value: String(stats.suggested) },
          { label: "Ambiguous", value: String(stats.ambiguous) },
          {
            label: "Unmatched",
            value: String(stats.unmatched),
            tone: "emphasis",
          },
        ]}
      />

      <section className="space-y-4">
        {evaluations.length ? (
          evaluations.map((item) => {
            const selectedPackageIds = new Set(
              item.persistedMatches.map((row) => row.packageId),
            );

            return (
              <article
                key={item.document.id}
                className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={statusBadgeClassName(item.evaluation.status)}>
                        {formatStatus(item.evaluation.status)}
                      </span>
                      <p className="text-sm text-slate-500">
                        {item.document.originalFilename}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <SignalCard
                        label="Emails"
                        value={
                          item.evaluation.signals.detectedEmails.join(", ") || "None detected"
                        }
                      />
                      <SignalCard
                        label="Full tracking"
                        value={
                          item.evaluation.signals.matchedTrackingNumbers.join(", ") ||
                          "None detected"
                        }
                      />
                      <SignalCard
                        label="Last four"
                        value={item.evaluation.signals.detectedLast4.join(", ") || "None detected"}
                      />
                    </div>
                  </div>

                  {item.persistedMatches.some(
                    (row) => row.matchStatus === "manual_matched",
                  ) ? (
                    <form action={clearManualInvoiceMatchAction}>
                      <input
                        name="consolidationId"
                        type="hidden"
                        value={consolidationId}
                      />
                      <input
                        name="invoiceDocumentId"
                        type="hidden"
                        value={item.document.id}
                      />
                      <button
                        className="inline-flex h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        type="submit"
                      >
                        Clear manual match
                      </button>
                    </form>
                  ) : null}
                </div>

                <form action={saveManualInvoiceMatchAction} className="mt-5 space-y-4">
                  <input name="consolidationId" type="hidden" value={consolidationId} />
                  <input name="invoiceDocumentId" type="hidden" value={item.document.id} />

                  <div className="overflow-x-auto rounded-[1.25rem] border border-slate-200/80">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Select</th>
                          <th className="px-4 py-3">Package</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Score</th>
                          <th className="px-4 py-3">Reasons</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.evaluation.candidates.map((candidate) => {
                          const packageRow = packageById.get(candidate.packageId);

                          if (!packageRow) {
                            return null;
                          }

                          return (
                            <tr key={candidate.packageId} className="border-t border-slate-100 align-top">
                              <td className="px-4 py-4">
                                <input
                                  defaultChecked={selectedPackageIds.has(candidate.packageId)}
                                  name="packageIds"
                                  type="checkbox"
                                  value={candidate.packageId}
                                />
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                <p className="font-medium text-slate-950">
                                  {packageRow.trackingNumber}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Last 4: {packageRow.trackingLast4 ?? "N/A"} · Row {packageRow.sourceRowNumber}
                                </p>
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                <p>{packageRow.customerNameRaw}</p>
                                <p className="text-xs text-slate-500">
                                  {packageRow.customerEmail ?? "No email"}
                                </p>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-lg font-semibold text-slate-950">
                                  {candidate.score}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-slate-700">
                                <div className="flex flex-wrap gap-2">
                                  {candidate.reasons.length ? (
                                    candidate.reasons.map((reason) => (
                                      <span
                                        key={`${candidate.packageId}-${reason.code}`}
                                        className={
                                          reason.score >= 0
                                            ? "inline-flex min-h-8 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                                            : "inline-flex min-h-8 items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                                        }
                                      >
                                        {reason.label} ({reason.score > 0 ? "+" : ""}
                                        {reason.score})
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-sm text-slate-500">
                                      No positive or negative rule fired.
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      className="inline-flex h-12 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      type="submit"
                    >
                      Save manual match
                    </button>
                  </div>
                </form>
              </article>
            );
          })
        ) : (
          <section className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm">
            <p className="text-sm text-slate-600">
              No invoice documents are available for matching yet.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}

function SignalCard({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-[1rem] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
    </div>
  );
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function statusBadgeClassName(status: string) {
  const baseClassName =
    "inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-medium";

  if (status === "auto_matched" || status === "manual_matched") {
    return `${baseClassName} border-emerald-200 bg-emerald-50 text-emerald-700`;
  }

  if (status === "suggested") {
    return `${baseClassName} border-cyan-200 bg-cyan-50 text-cyan-700`;
  }

  if (status === "ambiguous") {
    return `${baseClassName} border-amber-200 bg-amber-50 text-amber-700`;
  }

  return `${baseClassName} border-rose-200 bg-rose-50 text-rose-700`;
}
