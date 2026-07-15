import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { consolidations } from "@/db/schema";

export async function getConsolidations(organizationId: string) {
  return db.query.consolidations.findMany({
    where: eq(consolidations.organizationId, organizationId),
    orderBy: [desc(consolidations.createdAt)],
  });
}
