import { z } from "zod";

export const consolidationImportFormSchema = z.object({
  reference: z.string().trim().min(1, "Reference is required."),
  carrier: z.string().trim().min(1, "Carrier is required."),
  flightDate: z
    .string()
    .trim()
    .min(1, "Flight date is required.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid flight date."),
});

export const consolidationImportConfirmationSchema = z.object({
  previewToken: z.string().trim().min(1, "Preview token is required."),
});
