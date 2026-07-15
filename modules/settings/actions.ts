"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { getCurrentUser, requireSession } from "@/lib/dal";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { requireRole } from "@/lib/permissions";
import { settingsFormSchema } from "@/modules/settings/schemas";

type SettingsActionState =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export async function updateSettings(
  _state: SettingsActionState | undefined,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireSession();
  const user = await getCurrentUser();
  requireRole(user, "customs_admin");

  const parsed = settingsFormSchema.safeParse({
    freightRateUsdPerLb: formData.get("freightRateUsdPerLb"),
    usdToXcgRate: formData.get("usdToXcgRate"),
    adminCostXcg: formData.get("adminCostXcg"),
    taxRate: formData.get("taxRate"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid settings values.",
    };
  }

  if (!user?.organizationId) {
    throw new AppError("User organization is required.", {
      code: "MISSING_ORGANIZATION",
      status: 400,
    });
  }

  const current = await db.query.appSettings.findFirst({
    where: eq(appSettings.organizationId, user.organizationId),
    orderBy: (table, { desc }) => [desc(table.effectiveFrom)],
  });

  if (!current) {
    throw new AppError("Settings record not found.", {
      code: "SETTINGS_NOT_FOUND",
      status: 404,
    });
  }

  await db
    .update(appSettings)
    .set({
      freightRateUsdPerLb: String(parsed.data.freightRateUsdPerLb),
      usdToXcgRate: String(parsed.data.usdToXcgRate),
      adminCostXcg: String(parsed.data.adminCostXcg),
      taxRate: String(parsed.data.taxRate),
    })
    .where(eq(appSettings.id, current.id));

  logger.info("Updated app settings", {
    organizationId: user.organizationId,
    actorUserId: user.id,
  });

  revalidatePath("/customs/settings");

  return {
    success: true,
    message: "Settings updated.",
  };
}
