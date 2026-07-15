import { decimal, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organizations } from "./organizations";
import { users } from "./auth";

export const appSettings = pgTable(
  "app_settings",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    freightRateUsdPerLb: decimal("freight_rate_usd_per_lb", {
      precision: 12,
      scale: 4,
    }).notNull(),
    usdToXcgRate: decimal("usd_to_xcg_rate", {
      precision: 12,
      scale: 4,
    }).notNull(),
    adminCostXcg: decimal("admin_cost_xcg", {
      precision: 12,
      scale: 4,
    }).notNull(),
    taxRate: decimal("tax_rate", {
      precision: 12,
      scale: 6,
    }).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIndex: index("app_settings_organization_id_idx").on(table.organizationId),
  }),
);
