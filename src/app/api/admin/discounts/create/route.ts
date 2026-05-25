import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { formatUserError } from "@/lib/format-user-error";

export async function POST(request: Request) {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, maxUses, description } = body;

    if (!code || typeof code !== "string" || code.trim().length < 3) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }

    if (!maxUses || typeof maxUses !== "number" || maxUses <= 0) {
      return NextResponse.json({ error: "Invalid max uses" }, { status: 400 });
    }

    await fetchMutation(
      api.users.createPromoCode,
      {
        code: code.toUpperCase(),
        maxUses,
        description: description || undefined,
      },
      { token }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create promo code", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to create promo code.") },
      { status: 500 },
    );
  }
}
