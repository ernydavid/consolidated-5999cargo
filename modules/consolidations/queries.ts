import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { consolidations, customerCharges, packages } from "@/db/schema";

export async function getConsolidations(organizationId: string) {
  return db.query.consolidations.findMany({
    where: eq(consolidations.organizationId, organizationId),
    orderBy: [desc(consolidations.createdAt)],
  });
}

export async function getConsolidationDetail(
  organizationId: string,
  consolidationId: string,
) {
  const consolidation = await db.query.consolidations.findFirst({
    where: (table, { and, eq }) =>
      and(
        eq(table.organizationId, organizationId),
        eq(table.id, consolidationId),
      ),
  });

  if (!consolidation) {
    return null;
  }

  const packageRows = await db.query.packages.findMany({
    where: eq(packages.consolidationId, consolidationId),
    orderBy: [asc(packages.sourceRowNumber)],
  });

  const customerChargeRows = await db.query.customerCharges.findMany({
    where: eq(customerCharges.consolidationId, consolidationId),
    orderBy: [asc(customerCharges.customerNameSnapshot)],
  });

  return {
    consolidation,
    packageRows,
    customerChargeRows,
  };
}
