"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser, requireSession } from "@/lib/dal";
import { AppError } from "@/lib/errors";
import { requireRole } from "@/lib/permissions";
import {
  clearManualInvoiceMatchSchema,
  manualInvoiceMatchSchema,
} from "@/modules/matching/schemas";
import {
  clearManualInvoiceMatch,
  saveManualInvoiceMatch,
} from "@/modules/matching/service";

export async function saveManualInvoiceMatchAction(formData: FormData) {
  await requireSession();
  const user = await getCurrentUser();
  requireRole(user, "customs_agent");

  if (!user?.organizationId) {
    throw new AppError("User organization is required.", {
      code: "MISSING_ORGANIZATION",
      status: 400,
    });
  }

  const parsed = manualInvoiceMatchSchema.safeParse({
    consolidationId: formData.get("consolidationId"),
    invoiceDocumentId: formData.get("invoiceDocumentId"),
    packageIds: formData.getAll("packageIds"),
  });

  if (!parsed.success) {
    throw new AppError("Manual match selection is invalid.", {
      code: "MATCH_SELECTION_INVALID",
      status: 400,
    });
  }

  await saveManualInvoiceMatch({
    organizationId: user.organizationId,
    actorUserId: user.id,
    consolidationId: parsed.data.consolidationId,
    invoiceDocumentId: parsed.data.invoiceDocumentId,
    packageIds: parsed.data.packageIds,
  });

  revalidatePath(`/customs/consolidados/${parsed.data.consolidationId}/matching`);
}

export async function clearManualInvoiceMatchAction(formData: FormData) {
  await requireSession();
  const user = await getCurrentUser();
  requireRole(user, "customs_agent");

  if (!user?.organizationId) {
    throw new AppError("User organization is required.", {
      code: "MISSING_ORGANIZATION",
      status: 400,
    });
  }

  const parsed = clearManualInvoiceMatchSchema.safeParse({
    consolidationId: formData.get("consolidationId"),
    invoiceDocumentId: formData.get("invoiceDocumentId"),
  });

  if (!parsed.success) {
    throw new AppError("Manual match clear request is invalid.", {
      code: "MATCH_CLEAR_INVALID",
      status: 400,
    });
  }

  await clearManualInvoiceMatch({
    organizationId: user.organizationId,
    actorUserId: user.id,
    consolidationId: parsed.data.consolidationId,
    invoiceDocumentId: parsed.data.invoiceDocumentId,
  });

  revalidatePath(`/customs/consolidados/${parsed.data.consolidationId}/matching`);
}
