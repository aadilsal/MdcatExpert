/**
 * PayFast Pakistan (gopayfast.com) — NOT LIVE YET.
 *
 * This is scaffolding only, prepared ahead of merchant approval so the
 * gateway can be flipped on quickly once real credentials exist. See
 * docs/PAYFAST_INTEGRATION_PLAN.md for the full research and decision log.
 *
 * Why this file doesn't make real API calls yet: PayFast's public docs
 * (gopayfast.com/docs) only document a *direct* API (your server posts raw
 * card/bank-account/CNIC fields to PayFast) — that's a materially bigger
 * PCI-DSS compliance commitment than Safepay's hosted-checkout redirect,
 * which is what src/lib/safepay.ts and the checkout flow assume today.
 * PayFast's own product list mentions "Paylink," which is likely a hosted
 * checkout/payment-link product that would map onto the exact same shape
 * as Safepay — but the exact endpoint names, request/response shape, and
 * webhook signature format for THAT product aren't public. Fill those in
 * here once PayFast's onboarding team shares the Paylink API reference.
 *
 * Required env vars once ready (add to .env.local and Vercel):
 *   PAYFAST_MERCHANT_ID
 *   PAYFAST_SECURED_KEY
 *   PAYFAST_ENV            - "sandbox" (default) or "production"
 *   PAYFAST_WEBHOOK_SECRET - for verifying incoming webhook/IPN signatures
 */

export function getPayFastEnvironment(): "sandbox" | "production" {
  return process.env.PAYFAST_ENV === "production" ? "production" : "sandbox";
}

export function isPayFastConfigured() {
  return Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_SECURED_KEY);
}

/**
 * TODO once PayFast's Paylink/hosted-checkout API reference is available:
 *   1. Get an access token (per the direct API docs: POST /token with
 *      merchant_id, secured_key, grant_type=client_credentials) — confirm
 *      whether Paylink uses the same auth or a separate flow.
 *   2. Create a payment link / checkout session for the given amount.
 *   3. Return the hosted checkout URL to redirect the shopper to, mirroring
 *      safepay.ts's getSafepayClient() + checkout.createCheckoutUrl() shape
 *      so src/app/api/checkout/create/route.ts only needs a provider branch,
 *      not a rewrite.
 */
export function createPayFastCheckoutUrl(): never {
  throw new Error(
    "PayFast integration is not implemented yet — this is scaffolding pending PayFast's Paylink API docs. " +
      "See docs/PAYFAST_INTEGRATION_PLAN.md.",
  );
}

/**
 * TODO: verify PayFast's webhook/IPN signature once their exact format is
 * known (the direct API docs describe per-endpoint HMAC-SHA256 hashes over
 * specific field concatenations — the webhook/IPN format may differ).
 */
export function verifyPayFastWebhookSignature(): boolean {
  return false;
}
