import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export async function POST(request: Request) {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { promoCode } = body;
    if (!promoCode || typeof promoCode !== "string") {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }

    await fetchMutation(
      api.users.redeemPromoCode,
      { promoCode: promoCode.toUpperCase() },
      { token }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Promo redemption failed", error);
    const message = error instanceof Error ? error.message : "Promo redemption failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
