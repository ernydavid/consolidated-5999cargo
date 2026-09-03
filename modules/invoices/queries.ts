import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { invoiceDocuments } from "@/db/schema";

export async function getInvoiceDocumentsForConsolidation(consolidationId: string) {
  return db
    .select()
    .from(invoiceDocuments)
    .where(eq(invoiceDocuments.consolidationId, consolidationId))
    .orderBy(asc(invoiceDocuments.createdAt));
}
