import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { organizations } from "./organizations";
import { consolidations } from "./consolidations";
import { packages } from "./packages";

export const invoiceDocuments = pgTable(
  "invoice_documents",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    consolidationId: text("consolidation_id")
      .notNull()
      .references(() => consolidations.id, { onDelete: "cascade" }),
    customerId: text("customer_id"),
    purchaseId: text("purchase_id"),
    source: text("source").notNull(),
    originalFilename: text("original_filename").notNull(),
    blobPath: text("blob_path").notNull(),
    mimeType: text("mime_type").notNull(),
    sha256: text("sha256").notNull(),
    vendorName: text("vendor_name"),
    vendorOrderNumber: text("vendor_order_number"),
    invoiceNumber: text("invoice_number"),
    invoiceDate: text("invoice_date"),
    subtotalUsd: numeric("subtotal_usd", { precision: 12, scale: 4 }),
    salesTaxUsd: numeric("sales_tax_usd", { precision: 12, scale: 4 }),
    shippingUsd: numeric("shipping_usd", { precision: 12, scale: 4 }),
    grandTotalUsd: numeric("grand_total_usd", { precision: 12, scale: 4 }),
    currency: text("currency"),
    extractionStatus: text("extraction_status").notNull().default("queued"),
    matchingStatus: text("matching_status").notNull().default("queued"),
    extractedJson: jsonb("extracted_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    organizationShaUnique: uniqueIndex("invoice_documents_org_sha256_unique").on(
      table.organizationId,
      table.sha256,
    ),
    organizationIndex: index("invoice_documents_organization_id_idx").on(
      table.organizationId,
    ),
    consolidationIndex: index("invoice_documents_consolidation_id_idx").on(
      table.consolidationId,
    ),
    extractionStatusIndex: index("invoice_documents_extraction_status_idx").on(
      table.extractionStatus,
    ),
  }),
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: text("id").primaryKey(),
    invoiceDocumentId: text("invoice_document_id")
      .notNull()
      .references(() => invoiceDocuments.id, { onDelete: "cascade" }),
    lineNumber: text("line_number"),
    descriptionRaw: text("description_raw").notNull(),
    descriptionNormalized: text("description_normalized"),
    quantity: numeric("quantity", { precision: 12, scale: 4 }),
    unitPriceUsd: numeric("unit_price_usd", { precision: 12, scale: 4 }),
    lineTotalUsd: numeric("line_total_usd", { precision: 12, scale: 4 }),
    brand: text("brand"),
    model: text("model"),
    material: text("material"),
    intendedUse: text("intended_use"),
    countryOfOrigin: text("country_of_origin"),
    extractedJson: jsonb("extracted_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    invoiceDocumentIndex: index("invoice_items_invoice_document_id_idx").on(
      table.invoiceDocumentId,
    ),
  }),
);

export const invoicePackageMatches = pgTable(
  "invoice_package_matches",
  {
    id: text("id").primaryKey(),
    invoiceDocumentId: text("invoice_document_id")
      .notNull()
      .references(() => invoiceDocuments.id, { onDelete: "cascade" }),
    packageId: text("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    matchStatus: text("match_status").notNull(),
    matchMethod: text("match_method").notNull(),
    reasonsJson: jsonb("reasons_json").notNull(),
    selectedByUserId: text("selected_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    invoicePackageUnique: uniqueIndex("invoice_package_matches_invoice_package_unique").on(
      table.invoiceDocumentId,
      table.packageId,
    ),
    invoiceDocumentIndex: index("invoice_package_matches_invoice_document_id_idx").on(
      table.invoiceDocumentId,
    ),
    packageIndex: index("invoice_package_matches_package_id_idx").on(table.packageId),
    statusIndex: index("invoice_package_matches_status_idx").on(table.matchStatus),
  }),
);
