import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { appSettings } from "@/db/schema";

export async function getActiveSettings(organizationId: string) {
  return db.query.appSettings.findFirst({
    where: and(
      eq(appSettings.organizationId, organizationId),
      isNull(appSettings.effectiveTo),
    ),
    orderBy: [desc(appSettings.effectiveFrom)],
  });
}
