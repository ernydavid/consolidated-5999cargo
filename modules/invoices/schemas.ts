import { z } from "zod";

export const invoiceUploadContextSchema = z.object({
  consolidationId: z.string().trim().min(1),
});
