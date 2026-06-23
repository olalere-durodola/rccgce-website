/**
 * Money utilities.
 *
 * Money is stored as INTEGER CENTS in the database (Donation.amount,
 * Subscription.amount) to avoid binary-float drift on aggregation. The UI and
 * presets work in dollars; convert to cents only at the persistence boundary.
 */

/** Convert a dollar amount (number) to integer cents, rounding float artifacts. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert integer cents back to a dollar number. */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** Format integer cents as a "$X.XX" string. */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Parse a PayPal amount (string like "150.00" or a number) to integer cents.
 *
 * Guards against NaN / Infinity / missing / non-positive values: returns null
 * so callers never persist a bogus amount. NEVER stores the raw float.
 */
export function parseAmountToCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 100);
}
