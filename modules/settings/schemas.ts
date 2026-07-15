import { z } from "zod";

export const settingsFormSchema = z.object({
  freightRateUsdPerLb: z.coerce.number().positive(),
  usdToXcgRate: z.coerce.number().positive(),
  adminCostXcg: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(1),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
