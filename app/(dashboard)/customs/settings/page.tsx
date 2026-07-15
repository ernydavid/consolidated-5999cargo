import { PageTopPanel } from "@/components/dashboard/page-top-panel";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsForm } from "@/components/settings/settings-form";
import { getCurrentUser, requireSession } from "@/lib/dal";
import { env } from "@/lib/env";
import { decimalToString } from "@/lib/money";
import { requireRole } from "@/lib/permissions";
import { getActiveSettings } from "@/modules/settings/queries";

export default async function SettingsPage() {
  await requireSession();
  const user = await getCurrentUser();
  const currentUser = requireRole(user, "customs_admin");

  const settings = currentUser.organizationId
    ? await getActiveSettings(currentUser.organizationId)
    : null;

  const defaults = {
    freightRateUsdPerLb:
      settings?.freightRateUsdPerLb ?? decimalToString(env.DEFAULT_FREIGHT_RATE_USD),
    usdToXcgRate:
      settings?.usdToXcgRate ?? decimalToString(env.DEFAULT_USD_XCG_RATE),
    adminCostXcg:
      settings?.adminCostXcg ?? decimalToString(env.DEFAULT_ADMIN_COST_XCG),
    taxRate: settings?.taxRate ?? String(env.DEFAULT_TAX_RATE),
  };

  return (
    <div className="space-y-6">
      <PageTopPanel
        eyebrow="Calculation defaults"
        title="Settings"
        description="These values are stored centrally and snapshotted into each consolidado so historical calculations remain stable."
      />

      <div className="mx-auto w-full max-w-4xl space-y-5">
        <SettingsCard
          title="Default rates"
          description="Edit the baseline values used for freight, exchange, admin cost and tax."
        >
          <SettingsForm defaults={defaults} />
        </SettingsCard>
      </div>
    </div>
  );
}
