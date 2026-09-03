import Decimal from "decimal.js";

export type FreightInput = {
  totalWeightLb: Decimal;
  rateUsdPerLb: Decimal;
  usdToXcgRate: Decimal;
};

export type FreightResult = {
  freightUsd: Decimal;
  freightXcg: Decimal;
};

export function calculateFreight({
  totalWeightLb,
  rateUsdPerLb,
  usdToXcgRate,
}: FreightInput): FreightResult {
  const freightUsd = totalWeightLb.mul(rateUsdPerLb);
  const freightXcg = freightUsd.mul(usdToXcgRate);

  return {
    freightUsd,
    freightXcg,
  };
}
