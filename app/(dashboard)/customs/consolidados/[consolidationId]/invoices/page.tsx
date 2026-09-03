import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceUploadForm } from "@/components/customs/invoice-upload-form";
import { PageTopPanel } from "@/components/dashboard/page-top-panel";
import { getCurrentUser, requireSession } from "@/lib/dal";
import { requireRole } from "@/lib/permissions";
import { getConsolidationDetail } from "@/modules/consolidations/queries";
import { getInvoiceDocumentsForConsolidation } from "@/modules/invoices/queries";

export default async function ConsolidationInvoicesPage({
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

  const documents = await getInvoiceDocumentsForConsolidation(consolidationId);
  const queuedCount = documents.filter((doc) => doc.extractionStatus === "queued").length;
  const duplicateSafeCount = documents.length;

  return (
    <div className="space-y-6">
      <PageTopPanel
        eyebrow="Invoice intake"
        title={`Invoices · ${detail.consolidation.reference}`}
        description="Upload individual PDFs or ZIP files, persist the originals and detect duplicates before extraction or matching."
        actions={
          <>
            <Link
              className="inline-flex h-12 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              href={`/customs/consolidados/${consolidationId}/matching`}
            >
              Review matching
            </Link>
            <Link
              className="inline-flex h-12 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              href={`/customs/consolidados/${consolidationId}`}
            >
              Back to consolidado
            </Link>
          </>
        }
        stats={[
          { label: "Documents", value: String(documents.length) },
          { label: "Queued extraction", value: String(queuedCount) },
          { label: "Ready for matching", value: String(duplicateSafeCount) },
        ]}
      />

      <InvoiceUploadForm consolidationId={consolidationId} />

      <section className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Invoice processing status
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Uploaded originals are stored and queued for later extraction and matching phases.
          </p>
        </div>

        <div className="mt-5 overflow-x-auto rounded-[1.25rem] border border-slate-200/80">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Filename</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Extraction</th>
                <th className="px-4 py-3">Matching</th>
                <th className="px-4 py-3">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.length ? (
                documents.map((document) => (
                  <tr key={document.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-950">
                      {document.originalFilename}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {document.source.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {document.extractionStatus.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {document.matchingStatus.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {document.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-sm text-slate-600" colSpan={5}>
                    No invoice documents uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
