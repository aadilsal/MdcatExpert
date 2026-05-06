import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createPaymentRequest = mutation({
  args: {
    userId: v.id("users"),
    userEmail: v.string(),
    transactionId: v.string(),
    screenshotUrl: v.string(),
    amount: v.number(),
    archiveTitle: v.optional(v.string()),
    archiveYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("paymentRequests", {
      ...args,
      status: "pending",
      verifiedBy: undefined,
      reviewReason: undefined,
      processedAt: undefined,
      createdAt: Date.now(),
    });
  },
});

export const getPaymentRequestsByStatus = query({
  args: { status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")) },
  handler: async (ctx, { status }) => {
    const me = await getAuthUserId(ctx);
    if (!me) throw new Error("Unauthorized");
    const meDoc = await ctx.db.get(me);
    if (!meDoc || meDoc.role !== "admin") throw new Error("Forbidden");
    return await ctx.db
      .query("paymentRequests")
      .withIndex("by_status", (q) => q.eq("status", status))
      .collect();
  },
});

export const getUserPaymentRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("paymentRequests")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const approvePaymentRequest = mutation({
  args: {
    requestId: v.id("paymentRequests"),
    adminId: v.id("users"),
    premiumUntil: v.number(),
    reviewReason: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, adminId, premiumUntil, reviewReason }) => {
    const me = await getAuthUserId(ctx);
    if (!me) throw new Error("Unauthorized");
    if (me !== adminId) throw new Error("Forbidden");
    const meDoc = await ctx.db.get(me);
    if (!meDoc || meDoc.role !== "admin") throw new Error("Forbidden");
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Payment request not found");
    }

    await ctx.db.patch(request.userId, {
      subscriptionType: "premium",
      premiumUntil,
    });

    await ctx.db.patch(requestId, {
      status: "approved",
      verifiedBy: adminId,
      reviewReason: reviewReason || "Approved",
      processedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: request.userId,
      title: "Payment Approved",
      message: "Your payment proof has been approved and premium access is active.",
      read: false,
      createdAt: Date.now(),
    });

    return true;
  },
});

export const rejectPaymentRequest = mutation({
  args: {
    requestId: v.id("paymentRequests"),
    adminId: v.id("users"),
    reviewReason: v.string(),
  },
  handler: async (ctx, { requestId, adminId, reviewReason }) => {
    const me = await getAuthUserId(ctx);
    if (!me) throw new Error("Unauthorized");
    if (me !== adminId) throw new Error("Forbidden");
    const meDoc = await ctx.db.get(me);
    if (!meDoc || meDoc.role !== "admin") throw new Error("Forbidden");
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Payment request not found");
    }

    await ctx.db.patch(requestId, {
      status: "rejected",
      verifiedBy: adminId,
      reviewReason,
      processedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: request.userId,
      title: "Payment Rejected",
      message: `Your payment proof was rejected: ${reviewReason}`,
      read: false,
      createdAt: Date.now(),
    });

    return true;
  },
});
