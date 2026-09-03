import "server-only";

import { mkdir, readFile, rm, stat, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import Decimal from "decimal.js";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { consolidations, packages } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { syncConsolidationCustomerCharges } from "@/modules/consolidations/customer-summary";
import { getActiveSettings } from "@/modules/settings/queries";
import type {
  ConsolidationCustomerSummary,
  ConsolidationInvalidRow,
  ConsolidationPreviewFormValues,
  ConsolidationPreviewRow,
  StoredConsolidationImportPreview,
} from "@/modules/consolidations/types";

const previewRootDir = path.join(process.cwd(), ".tmp", "consolidation-import-previews");
const workbookRootDir = path.join(process.cwd(), ".tmp", "consolidation-workbooks");

const headerAliases = {
  warehouseReference: ["wh", "warehouse", "warehouse ref", "warehouse reference"],
  trackingNumber: ["tracking", "track", "tracking number", "tracking no", "guia", "guide"],
  customerNameRaw: ["nombre", "customer", "customer name", "consignee", "name"],
  customerEmail: ["email", "e-mail", "correo", "customer email", "mail"],
  descriptionRaw: ["description", "descripcion", "item description", "product description"],
  weightLb: ["peso", "weight", "weight lb", "weight lbs", "lbs", "lb"],
  dimensionsRaw: ["dim", "dimensions", "dimension", "medidas", "size"],
} satisfies Record<string, string[]>;

type HeaderKey = keyof typeof headerAliases;

type RowDraft = {
  sourceRowNumber: number;
  warehouseReference: string | null;
  trackingNumber: string | null;
  customerNameRaw: string | null;
  customerEmail: string | null;
  descriptionRaw: string | null;
  weightLb: string | null;
  dimensionsRaw: string | null;
};

export async function buildConsolidationImportPreview(input: {
  organizationId: string;
  actorUserId: string;
  form: ConsolidationPreviewFormValues;
  workbookBuffer: ArrayBuffer;
}) {
  const workbookBuffer = Buffer.from(input.workbookBuffer);
  const token = randomUUID();
  const workbookTempPath = await persistWorkbookBuffer(
    token,
    input.form.originalFilename,
    workbookBuffer,
  );

  const ExcelJS = await getExcelJs();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookTempPath);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new AppError("Workbook does not contain a worksheet.", {
      code: "WORKSHEET_MISSING",
      status: 400,
    });
  }

  const headerMatch = findHeaderRow(worksheet);

  if (!headerMatch) {
    throw new AppError(
      "Expected columns were not found. Check WH, Tracking, Nombre, Email, Description, Peso and Dimensions headers.",
      {
        code: "HEADERS_NOT_FOUND",
        status: 400,
      },
    );
  }

  const rowDrafts = collectRowDrafts(worksheet, headerMatch);
  const duplicateTrackingMap = buildDuplicateTrackingMap(rowDrafts);
  const duplicateTrackingNumbers = Array.from(duplicateTrackingMap.entries())
    .map(([trackingNumber, rowNumbers]) => ({
      trackingNumber,
      rowNumbers,
    }))
    .sort((left, right) => left.trackingNumber.localeCompare(right.trackingNumber));

  const validRows: ConsolidationPreviewRow[] = [];
  const invalidRows: ConsolidationInvalidRow[] = [];

  for (const row of rowDrafts) {
    const evaluation = evaluateRow(row, duplicateTrackingMap);

    if (evaluation.valid) {
      validRows.push(evaluation.row);
      continue;
    }

    invalidRows.push(evaluation.row);
  }

  if (!validRows.length) {
    throw new AppError("No valid rows were found in this workbook.", {
      code: "NO_VALID_ROWS",
      status: 400,
    });
  }

  const customerSummaries = buildCustomerSummaries(validRows);
  const totalWeightLb = validRows.reduce(
    (sum, row) => sum.plus(row.weightLb),
    new Decimal(0),
  );

  const preview: StoredConsolidationImportPreview = {
    token,
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    workbookTempPath,
    createdAt: new Date().toISOString(),
    form: input.form,
    validRows,
    invalidRows,
    duplicateTrackingNumbers,
    customerSummaries,
    totals: {
      packageCount: validRows.length,
      customerCount: customerSummaries.length,
      totalWeightLb: totalWeightLb.toFixed(4),
      invalidRowCount: invalidRows.length,
      duplicateTrackingCount: duplicateTrackingNumbers.length,
    },
  };

  await persistPreview(preview);

  logger.info("Prepared consolidation import preview", {
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    previewToken: token,
    validRows: validRows.length,
    invalidRows: invalidRows.length,
  });

  return preview;
}

export async function finalizeConsolidationImport(input: {
  previewToken: string;
  organizationId: string;
  actorUserId: string;
}) {
  const preview = await readPreview(input.previewToken);

  if (preview.organizationId !== input.organizationId) {
    throw new AppError("Preview organization mismatch.", {
      code: "PREVIEW_ORG_MISMATCH",
      status: 403,
    });
  }

  const existingConsolidation = await db.query.consolidations.findFirst({
    where: and(
      eq(consolidations.organizationId, input.organizationId),
      eq(consolidations.reference, preview.form.reference),
    ),
  });

  if (existingConsolidation) {
    throw new AppError("A consolidado with this reference already exists.", {
      code: "CONSOLIDATION_REFERENCE_EXISTS",
      status: 409,
    });
  }

  const settings = await getActiveSettings(input.organizationId);

  if (!settings) {
    throw new AppError("Active application settings are required before importing.", {
      code: "SETTINGS_REQUIRED",
      status: 400,
    });
  }

  const consolidationId = randomUUID();
  const workbookPath = await persistFinalWorkbook(
    consolidationId,
    preview.form.originalFilename,
    preview.workbookTempPath,
  );

  await db.transaction(async (tx) => {
    await tx.insert(consolidations).values({
      id: consolidationId,
      organizationId: input.organizationId,
      reference: preview.form.reference,
      carrier: preview.form.carrier,
      flightDate: new Date(preview.form.flightDate),
      status: "draft",
      sourceWorkbookBlobPath: workbookPath,
      createdBy: input.actorUserId,
      settingsSnapshotJson: {
        freightRateUsdPerLb: settings.freightRateUsdPerLb,
        usdToXcgRate: settings.usdToXcgRate,
        adminCostXcg: settings.adminCostXcg,
        taxRate: settings.taxRate,
        effectiveFrom: settings.effectiveFrom.toISOString(),
      },
    });

    await tx.insert(packages).values(
      preview.validRows.map((row) => ({
        id: randomUUID(),
        consolidationId,
        sourceRowNumber: row.sourceRowNumber,
        warehouseReference: row.warehouseReference,
        trackingNumber: row.trackingNumber,
        trackingLast4: row.trackingLast4,
        customerNameRaw: row.customerNameRaw,
        customerNameNormalized: row.customerNameNormalized,
        customerEmail: row.customerEmail,
        descriptionRaw: row.descriptionRaw,
        weightLb: row.weightLb,
        dimensionsRaw: row.dimensionsRaw,
      })),
    );
  });

  await syncConsolidationCustomerCharges(consolidationId);

  await cleanupPreviewArtifacts(preview);

  logger.info("Finalized consolidation import", {
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    consolidationId,
    importedRows: preview.validRows.length,
  });

  return {
    consolidationId,
    packageCount: preview.validRows.length,
  };
}

function findHeaderRow(worksheet: import("exceljs").Worksheet) {
  for (let rowNumber = 1; rowNumber <= Math.min(worksheet.rowCount, 12); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const headerMap = new Map<HeaderKey, number>();

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const normalized = normalizeHeader(cell.text);

      for (const [key, aliases] of Object.entries(headerAliases) as [
        HeaderKey,
        string[],
      ][]) {
        if (aliases.some((alias) => normalizeHeader(alias) === normalized)) {
          headerMap.set(key, colNumber);
        }
      }
    });

    if (
      headerMap.has("warehouseReference") &&
      headerMap.has("trackingNumber") &&
      headerMap.has("customerNameRaw") &&
      headerMap.has("weightLb")
    ) {
      return {
        rowNumber,
        headerMap,
      };
    }
  }

  return null;
}

function collectRowDrafts(
  worksheet: import("exceljs").Worksheet,
  headerMatch: {
    rowNumber: number;
    headerMap: Map<HeaderKey, number>;
  },
) {
  const drafts: RowDraft[] = [];

  for (let rowNumber = headerMatch.rowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const draft: RowDraft = {
      sourceRowNumber: rowNumber,
      warehouseReference: readCellValue(row, headerMatch.headerMap.get("warehouseReference")),
      trackingNumber: readCellValue(row, headerMatch.headerMap.get("trackingNumber")),
      customerNameRaw: readCellValue(row, headerMatch.headerMap.get("customerNameRaw")),
      customerEmail: readCellValue(row, headerMatch.headerMap.get("customerEmail")),
      descriptionRaw: readCellValue(row, headerMatch.headerMap.get("descriptionRaw")),
      weightLb: readCellValue(row, headerMatch.headerMap.get("weightLb")),
      dimensionsRaw: readCellValue(row, headerMatch.headerMap.get("dimensionsRaw")),
    };

    if (isEmptyDraft(draft)) {
      continue;
    }

    drafts.push(draft);
  }

  return drafts;
}

function evaluateRow(
  row: RowDraft,
  duplicateTrackingMap: Map<string, number[]>,
):
  | { valid: true; row: ConsolidationPreviewRow }
  | { valid: false; row: ConsolidationInvalidRow } {
  const reasons: string[] = [];
  const trackingNumber = normalizeTrackingNumber(row.trackingNumber);
  const customerNameRaw = row.customerNameRaw?.trim() ?? "";
  const customerNameNormalized = normalizeName(customerNameRaw);
  const customerEmail = normalizeEmail(row.customerEmail);
  const weightRaw = row.weightLb?.trim() ?? "";
  const weight = parseWeight(weightRaw);

  if (!trackingNumber) {
    reasons.push("Tracking number is required.");
  }

  if (!customerNameRaw) {
    reasons.push("Customer name is required.");
  }

  if (!customerNameNormalized) {
    reasons.push("Customer name could not be normalized.");
  }

  if (!weight) {
    reasons.push("Weight must be a valid number.");
  } else if (weight.lte(0)) {
    reasons.push("Weight must be greater than zero.");
  }

  if (trackingNumber && duplicateTrackingMap.has(trackingNumber)) {
    reasons.push("Duplicate tracking number found in workbook.");
  }

  if (reasons.length) {
    return {
      valid: false,
      row: {
        sourceRowNumber: row.sourceRowNumber,
        reasons,
        preview: {
          warehouseReference: row.warehouseReference?.trim() || null,
          trackingNumber: trackingNumber || null,
          customerNameRaw: customerNameRaw || null,
          customerEmail,
          descriptionRaw: row.descriptionRaw?.trim() || null,
          weightLb: weightRaw || null,
          dimensionsRaw: row.dimensionsRaw?.trim() || null,
        },
      },
    };
  }

  return {
    valid: true,
    row: {
      sourceRowNumber: row.sourceRowNumber,
      warehouseReference: row.warehouseReference?.trim() || null,
      trackingNumber,
      trackingLast4: extractTrackingLast4(trackingNumber),
      customerNameRaw,
      customerNameNormalized,
      customerEmail,
      descriptionRaw: row.descriptionRaw?.trim() || null,
      weightLb: weight!.toFixed(4),
      dimensionsRaw: row.dimensionsRaw?.trim() || null,
    },
  };
}

function buildDuplicateTrackingMap(rows: RowDraft[]) {
  const trackingMap = new Map<string, number[]>();

  for (const row of rows) {
    const trackingNumber = normalizeTrackingNumber(row.trackingNumber);

    if (!trackingNumber) {
      continue;
    }

    const rowNumbers = trackingMap.get(trackingNumber) ?? [];
    rowNumbers.push(row.sourceRowNumber);
    trackingMap.set(trackingNumber, rowNumbers);
  }

  return new Map(
    Array.from(trackingMap.entries()).filter(([, rowNumbers]) => rowNumbers.length > 1),
  );
}

function buildCustomerSummaries(rows: ConsolidationPreviewRow[]): ConsolidationCustomerSummary[] {
  const summaryMap = new Map<
    string,
    {
      label: string;
      email: string | null;
      packageCount: number;
      totalWeightLb: Decimal;
    }
  >();

  for (const row of rows) {
    const key = row.customerEmail ?? row.customerNameNormalized;
    const current = summaryMap.get(key) ?? {
      label: row.customerNameRaw,
      email: row.customerEmail,
      packageCount: 0,
      totalWeightLb: new Decimal(0),
    };

    current.packageCount += 1;
    current.totalWeightLb = current.totalWeightLb.plus(row.weightLb);

    summaryMap.set(key, current);
  }

  return Array.from(summaryMap.entries())
    .map(([key, summary]) => ({
      key,
      label: summary.label,
      email: summary.email,
      packageCount: summary.packageCount,
      totalWeightLb: summary.totalWeightLb.toFixed(4),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeTrackingNumber(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.trim().replace(/\s+/g, "");
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase() ?? "";
  return email || null;
}

function extractTrackingLast4(value: string) {
  return value.slice(-4);
}

function parseWeight(value: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/,/g, "");

  try {
    return new Decimal(normalized);
  } catch {
    return null;
  }
}

function readCellValue(
  row: import("exceljs").Row,
  columnNumber: number | undefined,
) {
  if (!columnNumber) {
    return null;
  }

  const cell = row.getCell(columnNumber);
  const text = `${cell.text ?? ""}`.trim();
  return text || null;
}

function isEmptyDraft(row: RowDraft) {
  return !row.warehouseReference &&
    !row.trackingNumber &&
    !row.customerNameRaw &&
    !row.customerEmail &&
    !row.descriptionRaw &&
    !row.weightLb &&
    !row.dimensionsRaw;
}

async function persistWorkbookBuffer(token: string, filename: string, buffer: Buffer) {
  await mkdir(previewRootDir, { recursive: true });

  const targetPath = path.join(
    previewRootDir,
    `${token}-${sanitizeFilename(filename || "consolidado")}.xlsx`,
  );

  await writeFile(targetPath, buffer);

  return targetPath;
}

async function persistPreview(preview: StoredConsolidationImportPreview) {
  await mkdir(previewRootDir, { recursive: true });

  const targetPath = path.join(previewRootDir, `${preview.token}.json`);
  await writeFile(targetPath, JSON.stringify(preview, null, 2), "utf8");
}

async function readPreview(token: string) {
  const targetPath = path.join(previewRootDir, `${token}.json`);
  const content = await readFile(targetPath, "utf8");
  return JSON.parse(content) as StoredConsolidationImportPreview;
}

async function persistFinalWorkbook(
  consolidationId: string,
  originalFilename: string,
  workbookTempPath: string,
) {
  await mkdir(workbookRootDir, { recursive: true });

  await stat(workbookTempPath);

  const targetPath = path.join(
    workbookRootDir,
    `${consolidationId}-${sanitizeFilename(originalFilename || "consolidado")}.xlsx`,
  );

  await copyFile(workbookTempPath, targetPath);

  return targetPath;
}

async function cleanupPreviewArtifacts(preview: StoredConsolidationImportPreview) {
  await rm(path.join(previewRootDir, `${preview.token}.json`), { force: true });
  await rm(preview.workbookTempPath, { force: true });
}

function sanitizeFilename(filename: string) {
  return filename
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

let excelJsModulePromise: Promise<typeof import("exceljs")> | undefined;

async function getExcelJs() {
  excelJsModulePromise ??= import("exceljs/lib/exceljs.nodejs.js").then(
    (module) => module as unknown as typeof import("exceljs"),
  );

  return excelJsModulePromise;
}
