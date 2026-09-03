"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, requireSession } from "@/lib/dal";
import { AppError, toErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { requireRole } from "@/lib/permissions";
import { consolidationImportConfirmationSchema, consolidationImportFormSchema } from "@/modules/consolidations/schemas";
import { buildConsolidationImportPreview, finalizeConsolidationImport } from "@/modules/consolidations/service";
import type { ConsolidationImportPreview } from "@/modules/consolidations/types";

export type ConsolidationImportActionState =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      message: string;
      preview: ConsolidationImportPreview;
    };

export async function prepareConsolidationImport(
  _state: ConsolidationImportActionState | undefined,
  formData: FormData,
): Promise<ConsolidationImportActionState> {
  await requireSession();
  const user = await getCurrentUser();
  requireRole(user, "customs_agent");

  if (!user?.organizationId) {
    throw new AppError("User organization is required.", {
      code: "MISSING_ORGANIZATION",
      status: 400,
    });
  }

  const parsed = consolidationImportFormSchema.safeParse({
    reference: formData.get("reference"),
    carrier: formData.get("carrier"),
    flightDate: formData.get("flightDate"),
  });

  const workbook = formData.get("workbook");

  if (!parsed.success) {
    return {
      success: false,
      message: "Complete the consolidado reference, carrier and flight date.",
    };
  }

  if (!(workbook instanceof File) || !workbook.size) {
    return {
      success: false,
      message: "Attach an Excel workbook before continuing.",
    };
  }

  if (!/\.(xlsx|xlsm|xltx|xltm)$/i.test(workbook.name)) {
    return {
      success: false,
      message: "Only Excel workbook files are supported for this step.",
    };
  }

  try {
    const preview = await buildConsolidationImportPreview({
      organizationId: user.organizationId,
      actorUserId: user.id,
      form: {
        ...parsed.data,
        originalFilename: workbook.name,
      },
      workbookBuffer: await workbook.arrayBuffer(),
    });

    return {
      success: true,
      message: "Workbook parsed. Review the rows before final import.",
      preview,
    };
  } catch (error) {
    logger.error("Failed to prepare consolidation import preview", {
      actorUserId: user.id,
      organizationId: user.organizationId,
      error: toErrorMessage(error),
    });

    return {
      success: false,
      message: toErrorMessage(error),
    };
  }
}

export async function confirmConsolidationImport(formData: FormData) {
  await requireSession();
  const user = await getCurrentUser();
  requireRole(user, "customs_agent");

  if (!user?.organizationId) {
    throw new AppError("User organization is required.", {
      code: "MISSING_ORGANIZATION",
      status: 400,
    });
  }

  const parsed = consolidationImportConfirmationSchema.safeParse({
    previewToken: formData.get("previewToken"),
  });

  if (!parsed.success) {
    throw new AppError("Preview token is required.", {
      code: "PREVIEW_TOKEN_REQUIRED",
      status: 400,
    });
  }

  await finalizeConsolidationImport({
    previewToken: parsed.data.previewToken,
    organizationId: user.organizationId,
    actorUserId: user.id,
  });

  revalidatePath("/customs/consolidados");
  redirect("/customs/consolidados");
}
