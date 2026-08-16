/**
 * Single source of truth for paid plans. Prices/durations are looked up
 * server-side from `planId` everywhere (checkout API, webhook confirm) —
 * never trust a client-supplied price or duration.
 *
 * Both plans are one-time payments. There is no auto-renewal anywhere in
 * this app (see convex/subscriptionReminders.ts) — a plan simply grants
 * `premiumDays` of access from purchase (or from the current expiry, if
 * renewing early) and the user is reminded, never auto-charged, near expiry.
 */

export const PLANS = {
  monthly_pass: {
    id: "monthly_pass",
    name: "Monthly Pass",
    tagline: "Try a full month",
    priceLabel: "Rs. 200",
    priceKr: 200,
    days: 30,
    durationLabel: "30 Days",
  },
  elite_annual: {
    id: "elite_annual",
    name: "Elite Annual",
    tagline: "One payment for the whole MDCAT year",
    priceLabel: "Rs. 2,000",
    priceKr: 2000,
    days: 365,
    durationLabel: "1-Year Season Pass",
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PLANS, value);
}

export function getPlan(planId: PlanId) {
  return PLANS[planId];
}
