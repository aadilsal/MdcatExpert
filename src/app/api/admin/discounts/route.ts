import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { formatUserError } from "@/lib/format-user-error";

export async function GET() {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const promoCodes = await fetchQuery(api.users.getPromoCodes, {}, { token });

    return NextResponse.json({ promoCodes });
  } catch (error) {
    console.error("Failed to load promo codes", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to load promo codes.") },
      { status: 500 },
    );
  }
}
