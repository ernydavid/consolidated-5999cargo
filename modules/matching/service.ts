import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  auditLogs,
  invoiceDocuments,
  invoicePackageMatches,
  packages,
} from "@/db/schema";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  InvoiceFilenameSignals,
  InvoiceMatchCandidate,
  InvoiceMatchEvaluation,
  InvoiceMatchReason,
  InvoiceMatchStatus,
} from "@/modules/matching/types";

type PackageRow = typeof packages.$inferSelect;
type InvoiceRow = typeof invoiceDocuments.$inferSelect;
type PersistedMatchRow = typeof invoicePackageMatches.$inferSelect;

const genericFilenameWords = new Set([
  "invoice",
  "factura",
  "receipt",
  "purchase",
  "order",
  "amazon",
  "walmart",
  "ebay",
  "pdf",
  "img",
  "scan",
  "document",
  "file",
  "shipping",
  "tax",
]);

export async function syncInvoiceMatchingForConsolidation(input: {
  consolidationId: string;
  organizationId: string;
}) {
  const [documentRows, packageRows, persistedMatchRows] = await Promise.all([
    db
      .select()
      .from(invoiceDocuments)
      .where(
        and(
          eq(invoiceDocuments.consolidationId, input.consolidationId),
          eq(invoiceDocuments.organizationId, input.organizationId),
        ),
      ),
    db.select().from(packages).where(eq(packages.consolidationId, input.consolidationId)),
    db
      .select()
      .from(invoicePackageMatches)
      .where(
        inArray(
          invoicePackageMatches.invoiceDocumentId,
          db
            .select({ id: invoiceDocuments.id })
            .from(invoiceDocuments)
            .where(
              and(
                eq(invoiceDocuments.consolidationId, input.consolidationId),
                eq(invoiceDocuments.organizationId, input.organizationId),
              ),
            ),
        ),
      ),
  ]);

  if (!documentRows.length) {
    return [];
  }

  const persistedByInvoice = new Map<string, PersistedMatchRow[]>();

  for (const row of persistedMatchRows) {
    const current = persistedByInvoice.get(row.invoiceDocumentId) ?? [];
    current.push(row);
    persistedByInvoice.set(row.invoiceDocumentId, current);
  }

  const evaluations: Array<{
    document: InvoiceRow;
    evaluation: InvoiceMatchEvaluation;
    persistedMatches: PersistedMatchRow[];
  }> = [];

  for (const document of documentRows) {
    const persistedMatches = persistedByInvoice.get(document.id) ?? [];
    const evaluation = evaluateInvoiceDocument(document, packageRows);
    evaluations.push({
      document,
      evaluation:
        persistedMatches.some((row) => row.matchStatus === "manual_matched")
          ? { ...evaluation, status: "manual_matched" }
          : evaluation,
      persistedMatches,
    });
  }

  for (const item of evaluations) {
    const hasManualMatch = item.persistedMatches.some(
      (row) => row.matchStatus === "manual_matched",
    );

    if (hasManualMatch) {
      if (item.document.matchingStatus !== "manual_matched") {
        await db
          .update(invoiceDocuments)
          .set({
            matchingStatus: "manual_matched",
            updatedAt: new Date(),
          })
          .where(eq(invoiceDocuments.id, item.document.id));
      }
      continue;
    }

    await db
      .delete(invoicePackageMatches)
      .where(
        and(
          eq(invoicePackageMatches.invoiceDocumentId, item.document.id),
          eq(invoicePackageMatches.matchStatus, "auto_matched"),
        ),
      );

    if (item.evaluation.status === "auto_matched" && item.evaluation.candidates[0]) {
      const topCandidate = item.evaluation.candidates[0];

      await db.insert(invoicePackageMatches).values({
        id: randomUUID(),
        invoiceDocumentId: item.document.id,
        packageId: topCandidate.packageId,
        score: topCandidate.score,
        matchStatus: "auto_matched",
        matchMethod: "rule_engine",
        reasonsJson: topCandidate.reasons,
      });
    }

    if (item.document.matchingStatus !== item.evaluation.status) {
      await db
        .update(invoiceDocuments)
        .set({
          matchingStatus: item.evaluation.status,
          updatedAt: new Date(),
        })
        .where(eq(invoiceDocuments.id, item.document.id));
    }
  }

  logger.info("Synchronized invoice matching", {
    consolidationId: input.consolidationId,
    organizationId: input.organizationId,
    invoices: documentRows.length,
  });

  return evaluations;
}

export async function saveManualInvoiceMatch(input: {
  organizationId: string;
  actorUserId: string;
  consolidationId: string;
  invoiceDocumentId: string;
  packageIds: string[];
}) {
  if (!input.packageIds.length) {
    throw new AppError("Select at least one package for the manual match.", {
      code: "MATCH_SELECTION_REQUIRED",
      status: 400,
    });
  }

  const [document] = await db
    .select()
    .from(invoiceDocuments)
    .where(
      and(
        eq(invoiceDocuments.id, input.invoiceDocumentId),
        eq(invoiceDocuments.organizationId, input.organizationId),
        eq(invoiceDocuments.consolidationId, input.consolidationId),
      ),
    )
    .limit(1);

  if (!document) {
    throw new AppError("Invoice document not found for manual matching.", {
      code: "INVOICE_DOCUMENT_NOT_FOUND",
      status: 404,
    });
  }

  const packageRows = await db
    .select()
    .from(packages)
    .where(
      and(
        eq(packages.consolidationId, input.consolidationId),
        inArray(packages.id, input.packageIds),
      ),
    );

  if (packageRows.length !== input.packageIds.length) {
    throw new AppError("One or more selected packages are invalid for this consolidado.", {
      code: "PACKAGE_SELECTION_INVALID",
      status: 400,
    });
  }

  const evaluation = evaluateInvoiceDocument(document, packageRows);
  const candidateByPackageId = new Map(
    evaluation.candidates.map((candidate) => [candidate.packageId, candidate]),
  );

  const existingMatches = await db
    .select()
    .from(invoicePackageMatches)
    .where(eq(invoicePackageMatches.invoiceDocumentId, input.invoiceDocumentId));

  await db.transaction(async (tx) => {
    await tx
      .delete(invoicePackageMatches)
      .where(eq(invoicePackageMatches.invoiceDocumentId, input.invoiceDocumentId));

    await tx.insert(invoicePackageMatches).values(
      packageRows.map((row) => {
        const candidate = candidateByPackageId.get(row.id);

        return {
          id: randomUUID(),
          invoiceDocumentId: input.invoiceDocumentId,
          packageId: row.id,
          score: candidate?.score ?? 0,
          matchStatus: "manual_matched",
          matchMethod: "manual_review",
          reasonsJson:
            candidate?.reasons ?? [
              {
                code: "customer_name_partial",
                label: "Manual match without positive automatic score.",
                score: 0,
              },
            ],
          selectedByUserId: input.actorUserId,
        };
      }),
    );

    await tx
      .update(invoiceDocuments)
      .set({
        matchingStatus: "manual_matched",
        updatedAt: new Date(),
      })
      .where(eq(invoiceDocuments.id, input.invoiceDocumentId));

    await tx.insert(auditLogs).values({
      id: randomUUID(),
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      entityType: "invoice_document",
      entityId: input.invoiceDocumentId,
      action: "manual_match_saved",
      beforeJson: existingMatches.map((row) => ({
        packageId: row.packageId,
        matchStatus: row.matchStatus,
        matchMethod: row.matchMethod,
        score: row.score,
      })),
      afterJson: packageRows.map((row) => ({
        packageId: row.id,
        matchStatus: "manual_matched",
      })),
    });
  });
}

export async function clearManualInvoiceMatch(input: {
  organizationId: string;
  actorUserId: string;
  consolidationId: string;
  invoiceDocumentId: string;
}) {
  const [document] = await db
    .select()
    .from(invoiceDocuments)
    .where(
      and(
        eq(invoiceDocuments.id, input.invoiceDocumentId),
        eq(invoiceDocuments.organizationId, input.organizationId),
        eq(invoiceDocuments.consolidationId, input.consolidationId),
      ),
    )
    .limit(1);

  if (!document) {
    throw new AppError("Invoice document not found for clearing manual match.", {
      code: "INVOICE_DOCUMENT_NOT_FOUND",
      status: 404,
    });
  }

  const existingMatches = await db
    .select()
    .from(invoicePackageMatches)
    .where(eq(invoicePackageMatches.invoiceDocumentId, input.invoiceDocumentId));

  await db.transaction(async (tx) => {
    await tx
      .delete(invoicePackageMatches)
      .where(eq(invoicePackageMatches.invoiceDocumentId, input.invoiceDocumentId));

    await tx
      .update(invoiceDocuments)
      .set({
        matchingStatus: "queued",
        updatedAt: new Date(),
      })
      .where(eq(invoiceDocuments.id, input.invoiceDocumentId));

    await tx.insert(auditLogs).values({
      id: randomUUID(),
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      entityType: "invoice_document",
      entityId: input.invoiceDocumentId,
      action: "manual_match_cleared",
      beforeJson: existingMatches.map((row) => ({
        packageId: row.packageId,
        matchStatus: row.matchStatus,
        matchMethod: row.matchMethod,
        score: row.score,
      })),
      afterJson: [],
    });
  });
}

export function evaluateInvoiceDocument(
  document: Pick<InvoiceRow, "originalFilename" | "id">,
  packageRows: PackageRow[],
): InvoiceMatchEvaluation {
  const signals = extractFilenameSignals(document.originalFilename, packageRows);
  const allExactTrackingHits = new Set(signals.matchedTrackingNumbers);
  const allExactNameHits = new Set<string>();

  for (const row of packageRows) {
    if (
      row.customerNameNormalized &&
      containsWholePhrase(signals.normalizedFilename, row.customerNameNormalized)
    ) {
      allExactNameHits.add(row.id);
    }
  }

  const candidates = packageRows
    .map((row) =>
      scorePackageCandidate({
        packageRow: row,
        signals,
        allExactTrackingHits,
        allExactNameHits,
        packageRows,
      }),
    )
    .sort((left, right) => right.score - left.score);

  const topCandidate = candidates[0];
  const nextCandidate = candidates[1];
  const positiveCandidates = candidates.filter((candidate) => candidate.score > 0);
  const duplicatedTopLast4 =
    topCandidate?.flags.last4Match &&
    topCandidate.flags.duplicatedLast4 &&
    !topCandidate.flags.exactTracking &&
    !topCandidate.flags.emailMatch &&
    !topCandidate.flags.exactNameMatch;

  let status: InvoiceMatchStatus = "unmatched";

  if (!positiveCandidates.length) {
    status = "unmatched";
  } else if (
    topCandidate &&
    topCandidate.score >= 100 &&
    (nextCandidate ? topCandidate.score - nextCandidate.score >= 25 : true) &&
    !duplicatedTopLast4
  ) {
    status = "auto_matched";
  } else if (
    positiveCandidates.length > 1 &&
    nextCandidate &&
    topCandidate &&
    topCandidate.score - nextCandidate.score < 20
  ) {
    status = "ambiguous";
  } else if (topCandidate && topCandidate.score >= 40) {
    status = "suggested";
  } else {
    status = "unmatched";
  }

  return {
    status,
    candidates,
    signals,
  };
}

function scorePackageCandidate(input: {
  packageRow: PackageRow;
  signals: InvoiceFilenameSignals;
  allExactTrackingHits: Set<string>;
  allExactNameHits: Set<string>;
  packageRows: PackageRow[];
}) {
  const reasons: InvoiceMatchReason[] = [];
  const normalizedEmail = normalizeEmail(input.packageRow.customerEmail);
  const normalizedTracking = normalizeTracking(input.packageRow.trackingNumber);
  const filenameHasExactTracking = Boolean(
    normalizedTracking && input.signals.matchedTrackingNumbers.includes(normalizedTracking),
  );
  const filenameHasEmail = Boolean(
    normalizedEmail && input.signals.detectedEmails.includes(normalizedEmail),
  );
  const filenameHasExactName = Boolean(
    input.packageRow.customerNameNormalized &&
      containsWholePhrase(
        input.signals.normalizedFilename,
        input.packageRow.customerNameNormalized,
      ),
  );
  const filenameHasPartialName = Boolean(
    input.packageRow.customerNameNormalized &&
      containsPartialName(
        input.signals.normalizedFilename,
        input.packageRow.customerNameNormalized,
      ),
  );
  const filenameHasLast4 = Boolean(
    input.packageRow.trackingLast4 &&
      input.signals.detectedLast4.includes(input.packageRow.trackingLast4),
  );
  const duplicatedLast4 = Boolean(
    input.packageRow.trackingLast4 &&
      input.packageRows.filter((row) => row.trackingLast4 === input.packageRow.trackingLast4)
        .length > 1,
  );
  const conflictingEmail =
    input.signals.detectedEmails.length > 0 &&
    normalizedEmail &&
    !input.signals.detectedEmails.includes(normalizedEmail);
  const conflictingTracking =
    input.allExactTrackingHits.size > 0 && !filenameHasExactTracking;
  const conflictingExactName =
    input.allExactNameHits.size > 0 && !input.allExactNameHits.has(input.packageRow.id);

  if (filenameHasExactTracking) {
    reasons.push({
      code: "exact_tracking",
      label: "Filename contains the complete tracking number.",
      score: 100,
    });
  }

  if (filenameHasEmail) {
    reasons.push({
      code: "customer_email",
      label: "Filename contains the customer email.",
      score: 60,
    });
  }

  if (filenameHasExactName) {
    reasons.push({
      code: "customer_name_exact",
      label: "Filename contains the full normalized customer name.",
      score: 40,
    });
  } else if (filenameHasPartialName) {
    reasons.push({
      code: "customer_name_partial",
      label: "Filename contains a recognizable customer name fragment.",
      score: 15,
    });
  }

  if (filenameHasLast4) {
    reasons.push({
      code:
        filenameHasEmail || filenameHasExactName || filenameHasPartialName
          ? "last4_with_customer"
          : "filename_last4",
      label:
        filenameHasEmail || filenameHasExactName || filenameHasPartialName
          ? "Filename contains the last four digits plus customer evidence."
          : "Filename contains the last four tracking digits.",
      score:
        filenameHasEmail || filenameHasExactName || filenameHasPartialName ? 70 : 20,
    });
  }

  if (conflictingEmail) {
    reasons.push({
      code: "conflicting_email",
      label: "Filename includes a different customer email.",
      score: -80,
    });
  }

  if (conflictingTracking) {
    reasons.push({
      code: "conflicting_tracking",
      label: "Filename points to a different full tracking number.",
      score: -70,
    });
  }

  if (conflictingExactName) {
    reasons.push({
      code: "conflicting_customer_name",
      label: "Filename strongly matches another customer name.",
      score: -40,
    });
  }

  return {
    packageId: input.packageRow.id,
    score: reasons.reduce((sum, reason) => sum + reason.score, 0),
    reasons,
    flags: {
      exactTracking: filenameHasExactTracking,
      emailMatch: filenameHasEmail,
      exactNameMatch: filenameHasExactName,
      partialNameMatch: filenameHasPartialName,
      last4Match: filenameHasLast4,
      duplicatedLast4,
    },
  } satisfies InvoiceMatchCandidate;
}

function extractFilenameSignals(
  filename: string,
  packageRows: PackageRow[],
): InvoiceFilenameSignals {
  const baseName = path.parse(filename).name;
  const normalizedFilename = normalizeText(baseName);
  const loweredBaseName = baseName.toLowerCase();
  const detectedEmails = Array.from(
    new Set(
      Array.from(loweredBaseName.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g)).map(
        (match) => match[0],
      ),
    ),
  );
  const detectedLast4 = Array.from(
    new Set(
      Array.from(normalizedFilename.matchAll(/\b\d{4}\b/g)).map((match) => match[0]),
    ),
  );
  const matchedTrackingNumbers = packageRows
    .map((row) => normalizeTracking(row.trackingNumber))
    .filter((tracking): tracking is string => Boolean(tracking))
    .filter((tracking) => normalizeTracking(baseName).includes(tracking));

  return {
    normalizedFilename,
    detectedEmails,
    detectedLast4,
    matchedTrackingNumbers: Array.from(new Set(matchedTrackingNumbers)),
  };
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTracking(value: string | null | undefined) {
  return (value ?? "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function containsWholePhrase(haystack: string, needle: string) {
  if (!needle) {
    return false;
  }

  return haystack.includes(needle);
}

function containsPartialName(haystack: string, normalizedName: string) {
  const tokens = normalizedName
    .split(" ")
    .filter((token) => token.length >= 3 && !genericFilenameWords.has(token));

  if (tokens.length >= 2) {
    return tokens.filter((token) => haystack.includes(token)).length >= 2;
  }

  return false;
}
