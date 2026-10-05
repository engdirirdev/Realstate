// Pure rental pricing helpers — safe to import from both server and client code.
// The server ALWAYS recomputes these values; the client uses them only for previews.

function addMonths(d: Date, m: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}

export function computeRental(
  price: number,
  rentPeriod: string | null | undefined,
  securityDeposit: number | null | undefined,
  start: Date,
  end: Date
) {
  const period = (rentPeriod || "MONTHLY").toUpperCase();
  const MS_DAY = 86_400_000;
  const days = Math.ceil((end.getTime() - start.getTime()) / MS_DAY);
  let periods = 1;
  if (period === "DAILY") periods = days;
  else if (period === "WEEKLY") periods = Math.ceil(days / 7);
  else {
    periods = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (addMonths(start, periods) < end) periods += 1;
  }
  periods = Math.max(1, periods);
  const rentAmount = Math.round(price * periods * 100) / 100;
  const deposit = Math.max(0, securityDeposit || 0);
  return { period, periods, rentAmount, securityDeposit: deposit, totalAmount: rentAmount + deposit };
}

export const PERIOD_LABEL: Record<string, { unit: string; plural: string; per: string }> = {
  MONTHLY: { unit: "month", plural: "months", per: "Month" },
  WEEKLY: { unit: "week", plural: "weeks", per: "Week" },
  DAILY: { unit: "day", plural: "days", per: "Day" },
};
