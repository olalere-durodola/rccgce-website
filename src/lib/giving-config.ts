/**
 * Recurring-giving configuration.
 *
 * Recurring (monthly) gifts use a fixed set of preset amounts so they can map
 * to pre-provisioned PayPal billing plans. One-time gifts allow any positive
 * amount; recurring gifts MUST be one of these presets.
 */
export const RECURRING_AMOUNTS = [25, 50, 100, 250] as const;
export type RecurringAmount = (typeof RECURRING_AMOUNTS)[number];

/**
 * Optional one-time preset chips shown in the UI. One-time giving still accepts
 * any positive custom amount; these are only convenience shortcuts.
 */
export const ONE_TIME_PRESETS = [25, 50, 100, 250] as const;

/** True when `amount` is exactly one of the preset recurring amounts. */
export function isPresetRecurringAmount(amount: number): amount is RecurringAmount {
  return (RECURRING_AMOUNTS as readonly number[]).includes(amount);
}

/**
 * Maps a (fund, presetAmount) pair to a PayPal billing plan id.
 *
 * TODO: PayPal billing plans must be provisioned out-of-band against the church
 * PayPal account (one plan per fund/amount). Wire the real plan ids here (or via
 * env) once provisioned. For sandbox/build we expose the lookup but return an
 * empty string when unset so callers can surface a friendly "not configured"
 * message instead of crashing.
 */
export function planIdFor(fund: string, amount: number): string {
  const key = `PAYPAL_PLAN_${fund.toUpperCase()}_${amount}`;
  return process.env[key] ?? "";
}
