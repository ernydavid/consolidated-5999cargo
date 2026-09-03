import { z } from "zod";

export const manualInvoiceMatchSchema = z.object({
  consolidationId: z.string().trim().min(1),
  invoiceDocumentId: z.string().trim().min(1),
  packageIds: z.array(z.string().trim().min(1)).min(1),
});

export const clearManualInvoiceMatchSchema = z.object({
  consolidationId: z.string().trim().min(1),
  invoiceDocumentId: z.string().trim().min(1),
});
