import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

const ALLOWED_EVENTS = new Set([
  "landing_view",
  "page_view",
  "admin_analytics_view",
  "upgrade_page_view",
  "paywall_hit",
  "quiz_started",
  "quiz_completed",
  "payment_submitted",
  "question_reported",
]);

const PUBLIC_EVENTS = new Set(["landing_view", "page_view"]);

const MAX_PROPERTY_KEYS = 10;
const MAX_PROPERTY_VALUE_LEN = 500;

function sanitizeProperties(
  properties: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!properties) return undefined;
  const entries = Object.entries(properties).slice(0, MAX_PROPERTY_KEYS);
  const out: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (!key || key.startsWith("$") || key.startsWith("_")) continue;
    out[key] = String(value).slice(0, MAX_PROPERTY_VALUE_LEN);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export const recordEvent = mutation({
  args: {
    eventName: v.string(),
    sessionId: v.optional(v.string()),
    properties: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, { eventName, sessionId, properties }) => {
    if (!ALLOWED_EVENTS.has(eventName)) {
      throw new Error("Invalid event name");
    }

    const userId = await getAuthUserId(ctx);
    if (!userId && !PUBLIC_EVENTS.has(eventName)) {
      throw new Error("Unauthorized");
    }

    const safeSessionId = sessionId?.slice(0, 128);
    const safeProperties = sanitizeProperties(properties);

    await ctx.db.insert("analyticsEvents", {
      eventName,
      userId: userId ?? undefined,
      sessionId: safeSessionId,
      properties: safeProperties,
      createdAt: Date.now(),
    });
  },
});

export const touchLastLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(userId, { lastLoginAt: Date.now() });
  },
});
