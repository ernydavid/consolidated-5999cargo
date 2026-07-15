import Decimal from "decimal.js";

export function toDecimal(value: Decimal.Value) {
  return new Decimal(value);
}

export function roundCurrency(value: Decimal.Value) {
  return toDecimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function decimalToString(value: Decimal.Value) {
  return toDecimal(value).toFixed(2);
}
