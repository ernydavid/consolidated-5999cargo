import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";

import JSZip from "jszip";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs, consolidations, invoiceDocuments } from "@/db/schema";
import { storeInvoiceOriginalFile } from "@/lib/document-storage";
import { AppError } from "@/lib/errors";
import { sha256FromBuffer } from "@/lib/hashing";
import { logger } from "@/lib/logger";
import type { PreparedInvoiceFile } from "@/modules/invoices/types";

const maxFileBytes = 8 * 1024 * 1024;
const allowedPdfMimeTypes = new Set([
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
]);

export async function uploadInvoiceDocuments(input: {
  organizationId: string;
  actorUserId: string;
  consolidationId: string;
  files: File[];
}) {
  const consolidation = await db.query.consolidations.findFirst({
    where: and(
      eq(consolidations.id, input.consolidationId),
      eq(consolidations.organizationId, input.organizationId),
    ),
  });

  if (!consolidation) {
    throw new AppError("Consolidation not found for invoice upload.", {
      code: "CONSOLIDATION_NOT_FOUND",
      status: 404,
    });
  }

  const preparedFiles = await expandUploadFiles(input.files);
  const duplicates: string[] = [];
  const rejected: Array<{ filename: string; reason: string }> = [];
  let created = 0;

  for (const file of preparedFiles) {
    const sha256 = await sha256FromBuffer(file.buffer);
    const [duplicate] = await db
      .select()
      .from(invoiceDocuments)
      .where(
        and(
          eq(invoiceDocuments.organizationId, input.organizationId),
          eq(invoiceDocuments.sha256, sha256),
        ),
      )
      .limit(1);

    if (duplicate) {
      duplicates.push(file.filename);
      continue;
    }

    try {
      const storedPath = await storeInvoiceOriginalFile({
        organizationId: input.organizationId,
        consolidationId: input.consolidationId,
        filename: file.filename,
        buffer: file.buffer,
      });

      const invoiceId = randomUUID();

      await db.insert(invoiceDocuments).values({
        id: invoiceId,
        organizationId: input.organizationId,
        consolidationId: input.consolidationId,
        source: file.source,
        originalFilename: file.filename,
        blobPath: storedPath,
        mimeType: file.mimeType,
        sha256,
        extractionStatus: "queued",
        matchingStatus: "queued",
      });

      await db.insert(auditLogs).values({
        id: randomUUID(),
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        entityType: "invoice_document",
        entityId: invoiceId,
        action: "uploaded",
        beforeJson: null,
        afterJson: {
          consolidationId: input.consolidationId,
          filename: file.filename,
          source: file.source,
          sha256,
        },
      });

      created += 1;
    } catch (error) {
      rejected.push({
        filename: file.filename,
        reason:
          error instanceof Error ? error.message : "Failed to store invoice document.",
      });
    }
  }

  logger.info("Processed invoice uploads", {
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    consolidationId: input.consolidationId,
    created,
    duplicates: duplicates.length,
    rejected: rejected.length,
  });

  return {
    created,
    duplicates,
    rejected,
  };
}

async function expandUploadFiles(files: File[]) {
  const preparedFiles: PreparedInvoiceFile[] = [];

  for (const file of files) {
    if (!file.size) {
      continue;
    }

    if (isZipFile(file)) {
      const zipEntries = await expandZipFile(file);
      preparedFiles.push(...zipEntries);
      continue;
    }

    preparedFiles.push(await toPreparedPdfFile(file, "manual_upload"));
  }

  return preparedFiles;
}

async function expandZipFile(file: File) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const preparedFiles: PreparedInvoiceFile[] = [];

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) {
      continue;
    }

    if (isUnsafeZipPath(entry.name)) {
      throw new AppError(`Unsafe ZIP path detected: ${entry.name}`, {
        code: "UNSAFE_ZIP_PATH",
        status: 400,
      });
    }

    const filename = path.basename(entry.name);

    if (!filename.toLowerCase().endsWith(".pdf")) {
      throw new AppError(`Unsupported ZIP entry: ${filename}`, {
        code: "UNSUPPORTED_ZIP_ENTRY",
        status: 400,
      });
    }

    const buffer = Buffer.from(await entry.async("nodebuffer"));

    if (buffer.length > maxFileBytes) {
      throw new AppError(`ZIP entry exceeds file size limit: ${filename}`, {
        code: "ZIP_ENTRY_TOO_LARGE",
        status: 400,
      });
    }

    preparedFiles.push({
      filename,
      mimeType: "application/pdf",
      source: "zip_upload",
      buffer,
    });
  }

  return preparedFiles;
}

async function toPreparedPdfFile(
  file: File,
  source: PreparedInvoiceFile["source"],
): Promise<PreparedInvoiceFile> {
  validatePdfFile(file);

  return {
    filename: file.name,
    mimeType: file.type || "application/pdf",
    source,
    buffer: Buffer.from(await file.arrayBuffer()),
  };
}

function validatePdfFile(file: File) {
  if (file.size > maxFileBytes) {
    throw new AppError(`${file.name} exceeds the 8 MB limit.`, {
      code: "FILE_TOO_LARGE",
      status: 400,
    });
  }

  const looksLikePdf = file.name.toLowerCase().endsWith(".pdf");
  const mimeAllowed = !file.type || allowedPdfMimeTypes.has(file.type.toLowerCase());

  if (!looksLikePdf || !mimeAllowed) {
    throw new AppError(`${file.name} is not a supported PDF upload.`, {
      code: "UNSUPPORTED_FILE_TYPE",
      status: 400,
    });
  }
}

function isZipFile(file: File) {
  return (
    file.name.toLowerCase().endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed"
  );
}

function isUnsafeZipPath(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("\\") ||
    value.includes("..\\") ||
    value.includes("../")
  );
}
