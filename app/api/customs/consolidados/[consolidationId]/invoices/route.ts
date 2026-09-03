import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/dal";
import { AppError, toErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { requireRole } from "@/lib/permissions";
import { uploadInvoiceDocuments } from "@/modules/invoices/service";
import type { InvoiceUploadState } from "@/modules/invoices/types";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      consolidationId: string;
    }>;
  },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json<InvoiceUploadState>(
      {
        success: false,
        message: "Authentication required.",
      },
      { status: 401 },
    );
  }

  try {
    requireRole(user, "customs_agent");

    if (!user.organizationId) {
      throw new AppError("User organization is required.", {
        code: "MISSING_ORGANIZATION",
        status: 400,
      });
    }

    const { consolidationId } = await context.params;
    const formData = await request.formData();
    const files = formData
      .getAll("documents")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (!files.length) {
      return NextResponse.json<InvoiceUploadState>(
        {
          success: false,
          message: "Attach at least one PDF or ZIP file.",
        },
        { status: 400 },
      );
    }

    const summary = await uploadInvoiceDocuments({
      organizationId: user.organizationId,
      actorUserId: user.id,
      consolidationId,
      files,
    });

    return NextResponse.json<InvoiceUploadState>({
      success: true,
      message: "Invoice upload processed.",
      summary,
    });
  } catch (error) {
    logger.error("Failed invoice upload", {
      organizationId: user.organizationId,
      actorUserId: user.id,
      error: toErrorMessage(error),
    });

    const status =
      error instanceof AppError ? (error.options.status ?? 400) : 500;

    return NextResponse.json<InvoiceUploadState>(
      {
        success: false,
        message: toErrorMessage(error),
      },
      { status },
    );
  }
}
