import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export async function GET() {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) return NextResponse.json({ user: null }, { status: 200 });

    const user = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!user) return NextResponse.json({ user: null }, { status: 200 });

    return NextResponse.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name || "",
        role: user.role || "student",
        subscriptionType: user.subscriptionType || "free",
        premiumUntil: user.premiumUntil || null,
        emailNotificationsEnabled: user.emailNotificationsEnabled ?? true,
      },
    });
  } catch (error) {
    console.error("Auth me error", error);
    return NextResponse.json({ user: null });
  }
}
