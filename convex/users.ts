import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await getAuthUserId(ctx);
    if (!me) throw new Error("Unauthorized");
    if (me === userId) return await ctx.db.get(userId);
    const meDoc = await ctx.db.get(me);
    if (!meDoc || meDoc.role !== "admin") throw new Error("Forbidden");
    return await ctx.db.get(userId);
  },
});

export const getEmailNotificationPreference = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      emailNotificationsEnabled: user.emailNotificationsEnabled ?? true,
    };
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const getCurrentUserProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { userId, name, email }) => {
    return await ctx.db.patch(userId, {
      name,
      email,
    });
  },
});

export const setEmailNotificationPreference = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, { enabled }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.patch(userId, { emailNotificationsEnabled: enabled });
    return true;
  },
});

export const setSubscription = mutation({
  args: {
    userId: v.id("users"),
    subscriptionType: v.union(v.literal("free"), v.literal("premium")),
    premiumUntil: v.optional(v.number()),
  },
  handler: async (ctx, { userId, subscriptionType, premiumUntil }) => {
    const me = await getAuthUserId(ctx);
    if (!me) throw new Error("Unauthorized");
    const meDoc = await ctx.db.get(me);
    if (!meDoc || meDoc.role !== "admin") throw new Error("Forbidden");
    return await ctx.db.patch(userId, {
      subscriptionType,
      premiumUntil,
    });
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("student"), v.literal("admin")),
  },
  handler: async (ctx, { userId, role }) => {
    const me = await getAuthUserId(ctx);
    if (!me) throw new Error("Unauthorized");
    const meDoc = await ctx.db.get(me);
    if (!meDoc || meDoc.role !== "admin") throw new Error("Forbidden");
    return await ctx.db.patch(userId, {
      role,
    });
  },
});

export const listUsers = query({
  handler: async (ctx) => {
    const me = await getAuthUserId(ctx);
    if (!me) throw new Error("Unauthorized");
    const meDoc = await ctx.db.get(me);
    if (!meDoc || meDoc.role !== "admin") throw new Error("Forbidden");
    return await ctx.db.query("users").collect();
  },
});
