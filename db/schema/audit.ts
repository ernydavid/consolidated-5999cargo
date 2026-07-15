import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organizations } from "./organizations";
import { users } from "./auth";

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  beforeJson: jsonb("before_json"),
  afterJson: jsonb("after_json"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
