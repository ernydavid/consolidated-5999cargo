import { notFound } from "next/navigation";
import Decimal from "decimal.js";
import Link from "next/link";

import { PageTopPanel } from "@/components/dashboard/page-top-panel";
import { getCurrentUser, requireSession } from "@/lib/dal";
import { roundCurrency } from "@/lib/money";
import { requireRole } from "@/lib/permissions";
import { syncConsolidationCustomerCharges } from "@/modules/consolidations/customer-summary";
import { getConsolidationDetail } from "@/modules/consolidations/queries";

export default async function ConsolidationDetailPage({
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
  let detail = await getConsolidationDetail(
    currentUser.organizationId,
    consolidationId,
  );

  if (!detail) {
    notFound();
  }

  if (!detail.customerChargeRows.length && detail.packageRows.length) {
    await syncConsolidationCustomerCharges(consolidationId);
    detail = await getConsolidationDetail(
      currentUser.organizationId,
      consolidationId,
    );
  }

  if (!detail) {
    notFound();
  }

  const totalWeight = detail.packageRows.reduce(
    (sum, row) => sum.plus(row.weightLb),
    new Decimal(0),
  );
  const uniqueCustomers = detail.customerChargeRows.length;
  const totalFreightUsd = detail.customerChargeRows.reduce(
    (sum, row) => sum.plus(row.freightUsd),
    new Decimal(0),
  );
  const totalFreightXcg = detail.customerChargeRows.reduce(
    (sum, row) => sum.plus(row.freightXcg),
    new Decimal(0),
  );

  return (
    <div className="space-y-6">
      <PageTopPanel
        eyebrow="Consolidado detail"
        title={detail.consolidation.reference}
        description={`${detail.consolidation.carrier ?? "Carrier pending"} · ${detail.consolidation.status.replaceAll("_", " ")}`}
        actions={
          <>
            <Link
              className="inline-flex h-12 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              href={`/customs/consolidados/${consolidationId}/matching`}
            >
              Review matching
            </Link>
            <Link
              className="inline-flex h-12 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              href={`/customs/consolidados/${consolidationId}/invoices`}
            >
              Open invoices
            </Link>
          </>
        }
        stats={[
          { label: "Packages", value: String(detail.packageRows.length) },
          { label: "Customers", value: String(uniqueCustomers) },
          { label: "Weight lb", value: totalWeight.toFixed(4) },
          { label: "Freight USD", value: roundCurrency(totalFreightUsd).toFixed(2) },
          { label: "Freight XCG", value: roundCurrency(totalFreightXcg).toFixed(2) },
          {
            label: "Flight date",
            value: detail.consolidation.flightDate
              ? detail.consolidation.flightDate.toLocaleDateString()
              : "Pending",
            tone: "emphasis",
          },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <section className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Customer freight summary
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Customers are grouped by exact normalized email first, and by normalized name only when email is absent.
              </p>
            </div>

            <div className="mt-5 overflow-x-auto rounded-[1.25rem] border border-slate-200/80">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Packages</th>
                    <th className="px-4 py-3">Weight lb</th>
                    <th className="px-4 py-3">Freight USD</th>
                    <th className="px-4 py-3">Freight XCG</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.customerChargeRows.map((row) => {
                    const breakdown = row.calculationBreakdownJson as
                      | { customerEmail?: string | null; trackingNumbers?: string[] }
                      | null;

                    return (
                      <tr key={row.id} className="border-t border-slate-100 align-top">
                        <td className="px-4 py-3 text-slate-700">
                          <p className="font-medium text-slate-950">
                            {row.customerNameSnapshot}
                          </p>
                          <p className="text-xs text-slate-500">
                            {breakdown?.customerEmail ?? "No email"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {breakdown?.trackingNumbers?.join(", ") ?? "No tracking list"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{row.packageCount}</td>
                        <td className="px-4 py-3 text-slate-700">{row.totalWeightLb}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {roundCurrency(row.freightUsd).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-950">
                          {roundCurrency(row.freightXcg).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Imported package rows
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Every valid workbook row was preserved as an individual package.
              </p>
            </div>

            <div className="mt-5 overflow-x-auto rounded-[1.25rem] border border-slate-200/80">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Row</th>
                    <th className="px-4 py-3">Tracking</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Weight lb</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.packageRows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-500">{row.sourceRowNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-950">
                        <p>{row.trackingNumber}</p>
                        <p className="text-xs text-slate-500">
                          Last 4: {row.trackingLast4 ?? "N/A"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p>{row.customerNameRaw}</p>
                        <p className="text-xs text-slate-500">
                          {row.customerEmail ?? "No email"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.weightLb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Import snapshot
            </h2>
            <div className="mt-5 space-y-3">
              <DetailField label="Reference" value={detail.consolidation.reference} />
              <DetailField
                label="Carrier"
                value={detail.consolidation.carrier ?? "Pending"}
              />
              <DetailField
                label="Status"
                value={detail.consolidation.status.replaceAll("_", " ")}
              />
              <DetailField
                label="Flight date"
                value={
                  detail.consolidation.flightDate
                    ? detail.consolidation.flightDate.toLocaleDateString()
                    : "Pending"
                }
              />
              <DetailField
                label="Imported at"
                value={detail.consolidation.createdAt.toLocaleString()}
              />
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              Freight rule
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Freight is currently calculated as total customer weight in pounds
              multiplied by the consolidado snapshot rate, then converted to XCG
              using the stored exchange rate.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}

function DetailField({
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
