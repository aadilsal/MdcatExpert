import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { formatUserError } from "@/lib/format-user-error";
import { getSiteUrl } from "@/lib/site-url";
import { getSafepayClient, getSafepayEnvironment, isSafepayConfigured, SAFEPAY_API_KEY } from "@/lib/safepay";

const ELITE_PRICE_PKR = 2500;
const ELITE_PREMIUM_DAYS = 365;

export async function POST() {
  try {
    if (!isSafepayConfigured()) {
      return NextResponse.json(
        {
          error:
            "Automated checkout isn't set up yet — add SAFEPAY_SECRET_KEY and SAFEPAY_API_KEY to your environment.",
        },
        { status: 503 },
      );
    }

    const token = await convexAuthNextjsToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const safepay = getSafepayClient();
    const amountInPaisa = ELITE_PRICE_PKR * 100; // Safepay amounts are in the lowest denomination.

    // Step 1: open a payment session ("tracker").
    const session = await safepay.payments.session.setup({
      merchant_api_key: SAFEPAY_API_KEY as string,
      intent: "CYBERSOURCE",
      mode: "payment",
      currency: "PKR",
      amount: amountInPaisa,
      metadata: {
        userId: user._id,
        product: "elite_season_pass",
      },
    });
    const trackerToken: string | undefined = session?.data?.tracker?.token;
    if (!trackerToken) {
      throw new Error("Safepay did not return a tracker token.");
    }

    // Step 2: short-lived client auth token for the hosted checkout page.
    // (Lives at `client.passport`, not `auth.passport` — see the note in
    // src/lib/safepay.ts; verified against the actual installed SDK types.)
    const passport = await safepay.client.passport.create();
    const authToken: string | undefined = passport?.data;
    if (!authToken) {
      throw new Error("Safepay did not return an authentication token.");
    }

    // Step 3: build the hosted Checkout URL to redirect the shopper to.
    // `checkout.createCheckoutUrl` is synchronous and returns the URL string
    // directly (not `checkouts.payment.create` / not wrapped in `{ url }`).
    const siteUrl = getSiteUrl();
    const checkoutUrl = safepay.checkout.createCheckoutUrl({
      tracker: trackerToken,
      tbt: authToken,
      env: getSafepayEnvironment(),
      source: "hosted",
      redirect_url: `${siteUrl}/upgrade/complete?tracker=${trackerToken}`,
      cancel_url: `${siteUrl}/upgrade?reason=payment_cancelled`,
    });
    if (!checkoutUrl || typeof checkoutUrl !== "string") {
      throw new Error("Safepay did not return a checkout URL.");
    }

    // Record the attempt so the webhook (source of truth) and the return-page
    // status check both know which user and which plan this tracker belongs to.
    await fetchMutation(
      api.gatewayPayments.createGatewayOrder,
      {
        trackerToken,
        amount: amountInPaisa,
        currency: "PKR",
        premiumDays: ELITE_PREMIUM_DAYS,
      },
      { token },
    );

    return NextResponse.json({ url: checkoutUrl, tracker: trackerToken });
  } catch (error) {
    console.error("Safepay checkout create error:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Unable to start checkout. Please try again.") },
      { status: 500 },
    );
  }
}
