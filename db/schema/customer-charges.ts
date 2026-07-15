import {
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { consolidations } from "./consolidations";
import { users } from "./auth";

export const customerCharges = pgTable(
  "customer_charges",
  {
    id: text("id").primaryKey(),
    consolidationId: text("consolidation_id")
      .notNull()
      .references(() => consolidations.id, { onDelete: "cascade" }),
    customerId: text("customer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    customerNameSnapshot: text("customer_name_snapshot").notNull(),
    packageCount: numeric("package_count", { precision: 12, scale: 0 }).notNull(),
    totalWeightLb: numeric("total_weight_lb", { precision: 12, scale: 4 }).notNull(),
    freightRateUsdPerLb: numeric("freight_rate_usd_per_lb", {
      precision: 12,
      scale: 4,
    }).notNull(),
    freightUsd: numeric("freight_usd", { precision: 12, scale: 4 }).notNull(),
    usdToXcgRate: numeric("usd_to_xcg_rate", { precision: 12, scale: 4 }).notNull(),
    freightXcg: numeric("freight_xcg", { precision: 12, scale: 4 }).notNull(),
    invoiceValueUsd: numeric("invoice_value_usd", {
      precision: 12,
      scale: 4,
    }).notNull(),
    dutyUsd: numeric("duty_usd", { precision: 12, scale: 4 }).notNull(),
    dutiesXcg: numeric("duties_xcg", { precision: 12, scale: 4 }).notNull(),
    adminCostXcg: numeric("admin_cost_xcg", { precision: 12, scale: 4 }).notNull(),
    subtotalXcg: numeric("subtotal_xcg", { precision: 12, scale: 4 }).notNull(),
    taxRate: numeric("tax_rate", { precision: 12, scale: 6 }).notNull(),
    taxXcg: numeric("tax_xcg", { precision: 12, scale: 4 }).notNull(),
    finalPriceXcg: numeric("final_price_xcg", { precision: 12, scale: 4 }).notNull(),
    calculationStatus: text("calculation_status").notNull().default("pending"),
    calculationBreakdownJson: jsonb("calculation_breakdown_json"),
    calculatedAt: timestamp("calculated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    consolidationIndex: index("customer_charges_consolidation_id_idx").on(
      table.consolidationId,
    ),
  }),
);
