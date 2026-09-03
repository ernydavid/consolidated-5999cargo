import "server-only";

import { randomUUID } from "node:crypto";

import Decimal from "decimal.js";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { consolidations, customerCharges, packages } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { calculateFreight } from "@/modules/calculations/calculate-freight";

const settingsSnapshotSchema = z.object({
  freightRateUsdPerLb: z.string(),
  usdToXcgRate: z.string(),
  adminCostXcg: z.string(),
  taxRate: z.string(),
  effectiveFrom: z.string().optional(),
});

type CustomerGroup = {
  key: string;
  customerNameSnapshot: string;
  customerEmail: string | null;
  packageCount: number;
  totalWeightLb: Decimal;
  trackingNumbers: string[];
};

export async function syncConsolidationCustomerCharges(consolidationId: string) {
  const consolidation = await db.query.consolidations.findFirst({
    where: eq(consolidations.id, consolidationId),
  });

  if (!consolidation) {
    throw new AppError("Consolidation not found for freight sync.", {
      code: "CONSOLIDATION_NOT_FOUND",
      status: 404,
    });
  }

  const settingsSnapshot = settingsSnapshotSchema.safeParse(
    consolidation.settingsSnapshotJson,
  );

  if (!settingsSnapshot.success) {
    throw new AppError("Consolidation settings snapshot is invalid.", {
      code: "INVALID_SETTINGS_SNAPSHOT",
      status: 400,
    });
  }

  const packageRows = await db.query.packages.findMany({
    where: eq(packages.consolidationId, consolidationId),
    orderBy: [asc(packages.sourceRowNumber)],
  });

  const customerGroups = buildCustomerGroups(packageRows);
  const rateUsdPerLb = new Decimal(settingsSnapshot.data.freightRateUsdPerLb);
  const usdToXcgRate = new Decimal(settingsSnapshot.data.usdToXcgRate);
  const adminCostXcg = new Decimal(settingsSnapshot.data.adminCostXcg);
  const taxRate = new Decimal(settingsSnapshot.data.taxRate);

  await db.transaction(async (tx) => {
    await tx
      .delete(customerCharges)
      .where(eq(customerCharges.consolidationId, consolidationId));

    if (!customerGroups.length) {
      return;
    }

    await tx.insert(customerCharges).values(
      customerGroups.map((group) => {
        const freight = calculateFreight({
          totalWeightLb: group.totalWeightLb,
          rateUsdPerLb,
          usdToXcgRate,
        });

        return {
          id: randomUUID(),
          consolidationId,
          customerId: null,
          customerNameSnapshot: group.customerNameSnapshot,
          packageCount: String(group.packageCount),
          totalWeightLb: group.totalWeightLb.toFixed(4),
          freightRateUsdPerLb: rateUsdPerLb.toFixed(4),
          freightUsd: freight.freightUsd.toFixed(4),
          usdToXcgRate: usdToXcgRate.toFixed(4),
          freightXcg: freight.freightXcg.toFixed(4),
          invoiceValueUsd: "0.0000",
          dutyUsd: "0.0000",
          dutiesXcg: "0.0000",
          adminCostXcg: adminCostXcg.toFixed(4),
          subtotalXcg: "0.0000",
          taxRate: taxRate.toFixed(6),
          taxXcg: "0.0000",
          finalPriceXcg: "0.0000",
          calculationStatus: "freight_ready",
          calculationBreakdownJson: {
            groupKey: group.key,
            customerEmail: group.customerEmail,
            trackingNumbers: group.trackingNumbers,
            packageCount: group.packageCount,
            totalWeightLb: group.totalWeightLb.toFixed(4),
            freightRateUsdPerLb: rateUsdPerLb.toFixed(4),
            usdToXcgRate: usdToXcgRate.toFixed(4),
            freightUsd: freight.freightUsd.toFixed(4),
            freightXcg: freight.freightXcg.toFixed(4),
          },
          calculatedAt: new Date(),
        };
      }),
    );
  });
}

function buildCustomerGroups(
  packageRows: Awaited<ReturnType<typeof db.query.packages.findMany>>,
) {
  const groups = new Map<string, CustomerGroup>();

  for (const row of packageRows) {
    const key = row.customerEmail ?? row.customerNameNormalized;
    const current = groups.get(key) ?? {
      key,
      customerNameSnapshot: row.customerNameRaw,
      customerEmail: row.customerEmail,
      packageCount: 0,
      totalWeightLb: new Decimal(0),
      trackingNumbers: [],
    };

    current.packageCount += 1;
    current.totalWeightLb = current.totalWeightLb.plus(row.weightLb);
    current.trackingNumbers.push(row.trackingNumber);

    groups.set(key, current);
  }

  return Array.from(groups.values()).sort((left, right) =>
    left.customerNameSnapshot.localeCompare(right.customerNameSnapshot),
  );
}
