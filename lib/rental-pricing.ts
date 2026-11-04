// Pure rental pricing helpers — safe to import from both server and client code.
// The server ALWAYS recomputes these values; the client uses them only for previews.

function addMonths(d: Date, m: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}

export interface RentalFeesOptions {
  companyServiceFee?: number | null;
  legalTransferFee?: number | null;
  brokerFee?: number | null;
}

export interface RentalComputation {
  period: string;
  periods: number;
  days: number;
  unitPrice: number;
  rentAmount: number;
  companyServiceFee: number;
  legalTransferFee: number;
  brokerFee: number;
  otherCharges: number;
  securityDeposit: number;
  totalAmount: number;
}

export function computeRental(
  basePrice: number,
  rentPeriod: string | null | undefined,
  securityDeposit: number | null | undefined,
  start: Date,
  end: Date,
  fees?: RentalFeesOptions
): RentalComputation {
  const period = (rentPeriod || "MONTHLY").toUpperCase();
  const MS_DAY = 86_400_000;
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_DAY));

  let periods = 1;
  if (period === "DAILY") {
    periods = days;
  } else if (period === "WEEKLY") {
    periods = Math.ceil(days / 7);
  } else {
    periods = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (addMonths(start, periods) < end) {
      periods += 1;
    }
  }
  periods = Math.max(1, periods);

  // ONLY base price is multiplied by the days or months of booking
  const unitPrice = Math.max(0, Number(basePrice) || 0);
  const rentAmount = Math.round(unitPrice * periods * 100) / 100;

  // Other charges are added ONCE (not multiplied per day or month)
  const companyServiceFee = Math.max(0, Number(fees?.companyServiceFee || 0));
  const legalTransferFee = Math.max(0, Number(fees?.legalTransferFee || 0));
  const brokerFee = Math.max(0, Number(fees?.brokerFee || 0));
  const otherCharges = companyServiceFee + legalTransferFee + brokerFee;

  const deposit = Math.max(0, Number(securityDeposit || 0));
  const totalAmount = Math.round((rentAmount + otherCharges + deposit) * 100) / 100;

  return {
    period,
    periods,
    days,
    unitPrice,
    rentAmount,
    companyServiceFee,
    legalTransferFee,
    brokerFee,
    otherCharges,
    securityDeposit: deposit,
    totalAmount,
  };
}

export const PERIOD_LABEL: Record<string, { unit: string; plural: string; per: string }> = {
  MONTHLY: { unit: "month", plural: "months", per: "Month" },
  WEEKLY: { unit: "week", plural: "weeks", per: "Week" },
  DAILY: { unit: "day", plural: "days", per: "Day" },
};
