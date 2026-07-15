import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { consolidations } from "./consolidations";

export const packages = pgTable(
  "packages",
  {
    id: text("id").primaryKey(),
    consolidationId: text("consolidation_id")
      .notNull()
      .references(() => consolidations.id, { onDelete: "cascade" }),
    sourceRowNumber: integer("source_row_number").notNull(),
    warehouseReference: text("warehouse_reference"),
    trackingNumber: text("tracking_number").notNull(),
    trackingLast4: text("tracking_last4"),
    customerNameRaw: text("customer_name_raw").notNull(),
    customerNameNormalized: text("customer_name_normalized").notNull(),
    customerEmail: text("customer_email"),
    descriptionRaw: text("description_raw"),
    weightLb: numeric("weight_lb", { precision: 12, scale: 4 }).notNull(),
    dimensionsRaw: text("dimensions_raw"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    consolidationIndex: index("packages_consolidation_id_idx").on(
      table.consolidationId,
    ),
    trackingIndex: index("packages_tracking_number_idx").on(table.trackingNumber),
  }),
);
