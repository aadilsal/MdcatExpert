import Safepay from "@sfpy/node-core";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Thin wrapper around the Safepay Node SDK (Express/hosted-checkout flow).
 * Docs: https://safepay-docs.netlify.app/build-your-integration/express-checkout
 *
 * Required env vars (set these in .env.local for dev and in Vercel for prod —
 * see .env.local.example):
 *   SAFEPAY_SECRET_KEY     - server-side secret key ("sec_..."), from the Safepay dashboard
 *   SAFEPAY_API_KEY        - merchant public API key, from the Safepay dashboard
 *   SAFEPAY_WEBHOOK_SECRET - used to verify incoming webhook signatures
 *   SAFEPAY_ENV            - "sandbox" (default) or "production"
 *
 * Until these are set, checkout creation fails with a clear, caught error
 * instead of a confusing crash — see isSafepayConfigured() below.
 */

const SAFEPAY_HOSTS = {
  sandbox: "https://sandbox.api.getsafepay.com",
  production: "https://api.getsafepay.com",
} as const;

export function getSafepayEnvironment(): "sandbox" | "production" {
  return process.env.SAFEPAY_ENV === "production" ? "production" : "sandbox";
}

export function isSafepayConfigured() {
  return Boolean(process.env.SAFEPAY_SECRET_KEY && process.env.SAFEPAY_API_KEY);
}

let client: InstanceType<typeof Safepay> | null = null;

/** Lazily construct the SDK client so a missing key doesn't crash the app at import time. */
export function getSafepayClient() {
  if (!isSafepayConfigured()) {
    throw new Error(
      "Safepay is not configured yet. Set SAFEPAY_SECRET_KEY and SAFEPAY_API_KEY " +
        "(get them from https://sandbox.api.getsafepay.com/dashboard/login for testing, " +
        "or https://getsafepay.com/dashboard/login once your live account is approved)."
    );
  }
  if (!client) {
    client = new Safepay(process.env.SAFEPAY_SECRET_KEY as string, {
      authType: "secret",
      host: SAFEPAY_HOSTS[getSafepayEnvironment()],
    });
  }
  return client;
}

export const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY;

/**
 * @sfpy/node-core@0.3.5's actual shipped type defs / compiled JS diverge from
 * Safepay's own doc samples in a few places — verified directly against
 * node_modules/@sfpy/node-core/types and cjs/*.js rather than trusting the
 * docs' code snippets:
 *   - The auth token method lives at `client.passport.create()`, NOT
 *     `auth.passport.create()` (docs show the latter; the SDK class only
 *     defines `auth: { login, logout }` and `client: { passport }`).
 *   - The checkout URL builder is `checkout.createCheckoutUrl(...)`
 *     (synchronous, returns the URL string directly), NOT
 *     `checkouts.payment.create(...)`. Its `env` param (not `environment`)
 *     picks the host.
 *   - There is NO `webhooks.constructEvent()` method in this SDK version at
 *     all, despite the docs' HMAC guide showing one. Verify signatures
 *     manually per Safepay's "Verify using your own solution" instructions:
 *     HMAC-SHA512 of the raw request body, hex-encoded, compared against the
 *     X-SFPY-SIGNATURE header — see verifySafepayWebhookSignature() below.
 */
export function verifySafepayWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expectedHex = createHmac("sha512", secret).update(Buffer.from(rawBody, "utf8")).digest("hex");
  const expected = Buffer.from(expectedHex, "utf8");
  const actual = Buffer.from(signature, "utf8");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
