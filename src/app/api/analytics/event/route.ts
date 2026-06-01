import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { PUBLIC_ANALYTICS_EVENTS } from "@/lib/analytics-events";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventName, sessionId, properties } = body as {
      eventName?: string;
      sessionId?: string;
      properties?: Record<string, string>;
    };

    if (!eventName || typeof eventName !== "string") {
      return NextResponse.json({ error: "Missing eventName" }, { status: 400 });
    }

    const token = await convexAuthNextjsToken();
    if (!token && !PUBLIC_ANALYTICS_EVENTS.has(eventName)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await fetchMutation(
      api.analytics.recordEvent,
      {
        eventName,
        sessionId: sessionId || undefined,
        properties: properties || undefined,
      },
      token ? { token } : {},
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics event error", error);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
