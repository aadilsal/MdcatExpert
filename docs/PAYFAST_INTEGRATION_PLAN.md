# PayFast Pakistan — integration plan (not yet started)

Status: **research only, on hold pending confirmation with PayFast's onboarding team.** Safepay stays the live gateway (`src/lib/safepay.ts`, `src/app/api/checkout/create/route.ts`, `src/app/api/webhooks/safepay/route.ts`) until this is resolved.

## Why this is on hold

PayFast Pakistan's public API docs (gopayfast.com/docs) describe a **direct/API-based integration**, not a hosted-checkout redirect:

- Safepay today: the shopper is redirected to Safepay's own hosted page, enters card/JazzCash/Easypaisa details there, and confirms via a webhook — MdcatXpert's servers never see raw card numbers or bank account details.
- PayFast's documented flow: the merchant's own site collects the customer's card number/CVV/expiry (or bank account number + CNIC), then the merchant's *server* posts those raw fields to PayFast's `/customer/validate` and `/transaction` endpoints, with an OTP step and an HMAC-SHA256 signed hash per request.

That means raw cardholder data would transit MdcatXpert's own backend — PCI-DSS SAQ-D scope, the strictest tier, not something to take on without a clear decision. PayFast may also offer a simpler hosted-checkout product (their WooCommerce/Laravel plugins suggest one exists) that just isn't on this docs page — **confirm directly with PayFast's team which integration mode you'd actually be approved for before writing any code.**

## What PayFast's direct API looks like, if the direct route is chosen anyway

- **Auth**: `POST /token` with `merchant_id`, `secured_key`, `grant_type=client_credentials`, `customer_ip` → returns a bearer `token` + `refresh_token` + expiry. Refreshed via `POST /refreshtoken`.
- **Simplest one-shot flow (no stored instrument)**:
  1. `POST /customer/validate` — collects `basket_id`, `txnamt`, customer contact info, and payment-instrument fields (card, bank account + CNIC, or wallet). Triggers an OTP to the customer.
  2. `POST /transaction` — same fields plus the `otp` and the `transaction_id` from step 1, finalizes the charge.
- **Stored-instrument / recurring flow** (not needed here — MdcatXpert's model is one-time payments only, see `convex/subscriptionReminders.ts`): `POST /transaction/token` → `POST /transaction/tokenized`, or the permanent-instrument endpoints — skip these, they don't match the "pay once, no auto-renewal" product philosophy anyway.
- **Signing**: every write endpoint expects a `secured_hash` — HMAC-SHA256 over a specific concatenation of that endpoint's fields (e.g. for `/transaction` with a bank account: `basket_id + txnamt + account_number + cnic_number`), using a hash key issued separately from the merchant credentials.
- **Status polling**: `GET /transaction/<transaction_id>` or `GET /transaction/basket_id/<basket_id>` — the docs page emphasizes polling by ID rather than a documented push webhook for Pakistan specifically (unlike Safepay's webhook-as-source-of-truth model). Confirm with PayFast whether a webhook/IPN endpoint exists for this API family, since MdcatXpert's current architecture assumes an async webhook is the source of truth (`convex/gatewayPayments.ts confirmGatewayPayment`), not client-side polling alone.
- **Refunds**: `POST /transaction/refund/<transaction_id>`.
- Sandbox vs. production base URLs and the hash key are issued at merchant onboarding — not published on the public docs page.

## If PayFast confirms a hosted-checkout option exists

That would map onto the existing architecture almost exactly like Safepay does today:

| Safepay today | PayFast equivalent |
|---|---|
| `src/lib/safepay.ts` (SDK wrapper, env config) | `src/lib/payfast.ts` |
| `src/app/api/checkout/create/route.ts` (creates session, builds hosted checkout URL) | Same shape — swap the session/checkout-URL calls |
| `src/app/api/webhooks/safepay/route.ts` (verifies signature, calls `confirmGatewayPayment`) | `src/app/api/webhooks/payfast/route.ts` — same `confirmGatewayPayment` mutation, new signature verification |
| `convex/gatewayPayments.ts` (`provider: v.literal("safepay")`) | Widen to `v.union(v.literal("safepay"), v.literal("payfast"))` so both can coexist during a transition |

Keeping `provider` on `gatewayOrders` as a union (rather than a hard rename) means Safepay could stay live for existing pending orders while PayFast is tested in sandbox, rather than a risky hard cutover.

## If PayFast only offers the direct API

This is a materially bigger project than a gateway swap:
- New PCI-DSS SAQ-D compliance obligations (network segmentation, quarterly scans, restricted card-data handling/retention/logging) — likely needs a compliance consultant, not just an engineering change.
- The checkout UI (`src/app/(app)/upgrade/page.tsx`) would need real card-number/CVV/bank-account/CNIC input fields instead of a redirect button — a much larger, more sensitive form to build and secure.
- OTP handling (PayFast texts an OTP mid-transaction) needs a UI step Safepay's hosted flow doesn't require at all.

**Recommendation:** don't take this on unless PayFast confirms there's no hosted-checkout alternative and the business is prepared for the PCI compliance work it implies.
