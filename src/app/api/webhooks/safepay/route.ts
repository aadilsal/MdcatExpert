import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { isSafepayConfigured, verifySafepayWebhookSignature } from "@/lib/safepay";

/**
 * Safepay webhook receiver — the source of truth for activating Elite
 * premium. Register this URL (https://<your-domain>/api/webhooks/safepay)
 * in the Safepay dashboard under Developers > Endpoints, and subscribe to
 * at least payment.succeeded and payment.failed.
 * Docs: https://safepay-docs.netlify.app/developers/webhooks/verify-hmac-signatures
 *
 * IMPORTANT: this route must receive the *raw* request body — do not call
 * request.json() before signature verification, or the signature check
 * will fail (Safepay signs the exact raw bytes they sent).
 */
export async function POST(request: Request) {
  if (!isSafepayConfigured() || !process.env.SAFEPAY_WEBHOOK_SECRET) {
    console.error("Safepay webhook received but SAFEPAY_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("X-SFPY-SIGNATURE") ?? request.headers.get("x-sfpy-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // @sfpy/node-core@0.3.5 has no `webhooks.constructEvent()` helper (despite
  // Safepay's own docs showing one) — verify manually per their "Verify
  // using your own solution" instructions: HMAC-SHA512 of the raw body,
  // hex-encoded, compared against X-SFPY-SIGNATURE. See src/lib/safepay.ts.
  const isValid = verifySafepayWebhookSignature(rawBody, signature, process.env.SAFEPAY_WEBHOOK_SECRET);
  if (!isValid) {
    console.error("Safepay webhook signature verification failed.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error("Safepay webhook body is not valid JSON:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Acknowledge quickly, per Safepay's guidance — apply business logic after
  // we've already decided to return 200, so a downstream hiccup doesn't
  // cause Safepay to endlessly retry a webhook we've already understood.
  try {
    const trackerToken = event.data?.tracker as string | undefined;
    if (!trackerToken) {
      console.error("Safepay webhook missing data.tracker:", event);
      return NextResponse.json({ received: true });
    }

    if (event.type === "payment.succeeded") {
      await fetchMutation(api.gatewayPayments.confirmGatewayPayment, {
        trackerToken,
        outcome: "succeeded",
        internalSecret: process.env.GATEWAY_WEBHOOK_SHARED_SECRET as string,
      });
    } else if (event.type === "payment.failed") {
      await fetchMutation(api.gatewayPayments.confirmGatewayPayment, {
        trackerToken,
        outcome: "failed",
        internalSecret: process.env.GATEWAY_WEBHOOK_SHARED_SECRET as string,
      });
    }
    // Other event types (refunds, subscriptions, etc.) are accepted but
    // intentionally not handled yet — add cases here as the product needs them.
  } catch (err) {
    console.error("Safepay webhook business-logic error:", err);
    // Still 200: we verified and understood the event. Retrying won't help
    // if the failure is in our own mutation logic, and Safepay's retry
    // queue is meant for delivery failures, not application bugs.
  }

  return NextResponse.json({ received: true });
}
