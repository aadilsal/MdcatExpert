import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

// Used by /upgrade/complete to show an immediate result to the shopper after
// they're redirected back from Safepay. This is a UX convenience only — the
// webhook (src/app/api/webhooks/safepay/route.ts) is the actual source of
// truth for activating premium, since this redirect can be closed, blocked,
// or spoofed by the client before the webhook arrives.
export async function GET(request: Request) {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trackerToken = new URL(request.url).searchParams.get("tracker");
  if (!trackerToken) {
    return NextResponse.json({ error: "Missing tracker." }, { status: 400 });
  }

  const order = await fetchQuery(api.gatewayPayments.getGatewayOrderByTracker, { trackerToken }, { token });
  if (!order) {
    return NextResponse.json({ status: "not_found" });
  }

  return NextResponse.json({ status: order.status });
}
