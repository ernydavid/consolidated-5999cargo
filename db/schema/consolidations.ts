import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organizations } from "./organizations";
import { users } from "./auth";

export const consolidations = pgTable(
  "consolidations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    reference: text("reference").notNull(),
    carrier: text("carrier"),
    flightDate: timestamp("flight_date", { withTimezone: true }),
    status: text("status").notNull().default("draft"),
    sourceWorkbookBlobPath: text("source_workbook_blob_path"),
    exportWorkbookBlobPath: text("export_workbook_blob_path"),
    settingsSnapshotJson: jsonb("settings_snapshot_json"),
    createdBy: text("created_by").references(() => users.id, {
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
    orgIndex: index("consolidations_organization_id_idx").on(table.organizationId),
    statusIndex: index("consolidations_status_idx").on(table.status),
  }),
);
