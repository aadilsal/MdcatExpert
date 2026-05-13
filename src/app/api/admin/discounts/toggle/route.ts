import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";

export async function POST(request: Request) {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { promoId, isActive } = body;

    if (!promoId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await fetchMutation(
      api.users.togglePromoCodeActive,
      { promoId: promoId as any, isActive },
      { token }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to toggle promo code", error);
    const message = error instanceof Error ? error.message : "Failed to toggle promo code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
