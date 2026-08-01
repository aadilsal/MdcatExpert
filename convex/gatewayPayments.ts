import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Automated payment gateway (Safepay) integration.
 *
 * Flow:
 * 1. Client calls POST /api/checkout/create (Next.js route). That route
 *    authenticates the user via Convex Auth, creates a Safepay payment
 *    tracker + hosted checkout URL, and calls `createGatewayOrder` below
 *    to record the attempt before redirecting the shopper to Safepay.
 * 2. The shopper pays on Safepay's hosted page and is redirected back to
 *    /upgrade/complete?tracker=... — that page calls GET /api/checkout/status
 *    to show an immediate result via `getGatewayOrderByTracker`.
 * 3. Safepay also calls POST /api/webhooks/safepay asynchronously (the
 *    source of truth — the redirect above is just a fast UX shortcut and
 *    must never be trusted on its own). That Next.js route verifies the
 *    Safepay webhook signature using the @sfpy/node-core SDK (which needs
 *    Node's crypto module, so it has to run in the Next.js/Node runtime,
 *    not a Convex action), then calls `confirmGatewayPayment` here.
 *
 * `confirmGatewayPayment` is a public `mutation` rather than an
 * `internalMutation` only because it's invoked from a trusted Next.js
 * server route rather than from another Convex function — it is guarded
 * by a shared secret (GATEWAY_WEBHOOK_SHARED_SECRET, set in both the
 * Convex dashboard and Vercel env vars) instead of Convex Auth, since the
 * webhook call has no end-user session. Treat that secret like an API key.
 */

export const createGatewayOrder = mutation({
  args: {
    trackerToken: v.string(),
    amount: v.number(),
    currency: v.string(),
    premiumDays: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.db.insert("gatewayOrders", {
      userId,
      provider: "safepay",
      trackerToken: args.trackerToken,
      amount: args.amount,
      currency: args.currency,
      status: "created",
      premiumDays: args.premiumDays,
      createdAt: Date.now(),
    });
  },
});

export const getGatewayOrderByTracker = query({
  args: { trackerToken: v.string() },
  handler: async (ctx, { trackerToken }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const order = await ctx.db
      .query("gatewayOrders")
      .withIndex("by_trackerToken", (q) => q.eq("trackerToken", trackerToken))
      .unique();

    if (!order || order.userId !== userId) return null;
    return order;
  },
});

export const confirmGatewayPayment = mutation({
  args: {
    trackerToken: v.string(),
    outcome: v.union(v.literal("succeeded"), v.literal("failed")),
    internalSecret: v.string(),
  },
  handler: async (ctx, { trackerToken, outcome, internalSecret }) => {
    const expected = process.env.GATEWAY_WEBHOOK_SHARED_SECRET;
    if (!expected || internalSecret !== expected) {
      throw new Error("Forbidden");
    }

    const order = await ctx.db
      .query("gatewayOrders")
      .withIndex("by_trackerToken", (q) => q.eq("trackerToken", trackerToken))
      .unique();
    if (!order) {
      // Safepay may retry webhooks; an unknown tracker isn't fatal, just log-worthy.
      return { ok: false, reason: "unknown_tracker" as const };
    }

    // Idempotent: Safepay can send the same event more than once, and the
    // fast client-side status check can race with the webhook.
    if (order.status !== "created") {
      return { ok: true, alreadyProcessed: true as const };
    }

    if (outcome === "failed") {
      await ctx.db.patch(order._id, { status: "failed", processedAt: Date.now() });
      return { ok: true };
    }

    const user = await ctx.db.get(order.userId);
    if (!user) {
      await ctx.db.patch(order._id, { status: "failed", processedAt: Date.now() });
      return { ok: false, reason: "user_not_found" as const };
    }

    // Extend from the current expiry if the user still has active premium
    // (renewal), otherwise start the clock from now.
    const now = Date.now();
    const base = user.premiumUntil && user.premiumUntil > now ? user.premiumUntil : now;
    const premiumUntil = base + order.premiumDays * 24 * 60 * 60 * 1000;

    await ctx.db.patch(order.userId, {
      subscriptionType: "premium",
      premiumUntil,
    });

    await ctx.db.patch(order._id, { status: "succeeded", processedAt: now });

    await ctx.db.insert("notifications", {
      userId: order.userId,
      title: "Elite Access Activated",
      message: "Your payment was confirmed automatically and Elite access is now active.",
      read: false,
      createdAt: now,
    });

    return { ok: true };
  },
});
