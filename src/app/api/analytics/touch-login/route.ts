import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export async function POST() {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await fetchMutation(api.analytics.touchLastLogin, {}, { token });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Touch login error", error);
    return NextResponse.json({ error: "Failed to update login" }, { status: 500 });
  }
}
