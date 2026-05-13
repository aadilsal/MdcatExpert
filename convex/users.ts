import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    return await ctx.db.get(userId);
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

export const listUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getPromoCodeByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { email, name }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      throw new Error("User already exists");
    }

    return await ctx.db.insert("users", {
      email,
      name,
      role: "student",
      subscriptionType: "free",
      promoCode: undefined,
      promoSource: undefined,
      premiumUntil: undefined,
      createdAt: Date.now(),
      lastLoginAt: undefined,
      isActive: true,
    });
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    emailNotificationsEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, name, email, phone, emailNotificationsEnabled }) => {
    const me = await getAuthUserId(ctx);
    if (!me || me !== userId) {
      throw new Error("Unauthorized");
    }
    return await ctx.db.patch(userId, {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone: phone || undefined } : {}),
      ...(emailNotificationsEnabled !== undefined ? { emailNotificationsEnabled } : {}),
    });
  },
});

export const setSubscription = mutation({
  args: {
    userId: v.id("users"),
    subscriptionType: v.union(v.literal("free"), v.literal("premium")),
    premiumUntil: v.optional(v.number()),
  },
  handler: async (ctx, { userId, subscriptionType, premiumUntil }) => {
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
    return await ctx.db.patch(userId, {
      role,
    });
  },
});

export const createPromoCode = mutation({
  args: {
    code: v.string(),
    description: v.optional(v.string()),
    maxUses: v.number(),
  },
  handler: async (ctx, { code, description, maxUses }) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");
    const admin = await ctx.db.get(identity);
    if (!admin || admin.role !== "admin") throw new Error("Forbidden");

    const existing = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();

    if (existing) {
      throw new Error("Promo code already exists");
    }

    return await ctx.db.insert("promoCodes", {
      code: code.toUpperCase(),
      description: description || undefined,
      maxUses,
      usedCount: 0,
      isActive: true,
      createdBy: identity,
      createdAt: Date.now(),
    });
  },
});

export const getPromoCodes = query({
  handler: async (ctx) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");
    const admin = await ctx.db.get(identity);
    if (!admin || admin.role !== "admin") throw new Error("Forbidden");

    return await ctx.db.query("promoCodes").collect();
  },
});

export const togglePromoCodeActive = mutation({
  args: {
    promoId: v.id("promoCodes"),
    isActive: v.boolean(),
  },
  handler: async (ctx, { promoId, isActive }) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");
    const admin = await ctx.db.get(identity);
    if (!admin || admin.role !== "admin") throw new Error("Forbidden");

    return await ctx.db.patch(promoId, { isActive });
  },
});

export const redeemPromoCode = mutation({
  args: {
    promoCode: v.string(),
  },
  handler: async (ctx, { promoCode }) => {
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const promo = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", promoCode.toUpperCase()))
      .first();

    if (!promo) {
      throw new Error("Promo code not found");
    }

    if (!promo.isActive) {
      throw new Error("Promo code is inactive");
    }

    if (promo.usedCount >= promo.maxUses) {
      throw new Error("Promo code has reached maximum uses");
    }

    await ctx.db.patch(promo._id, {
      usedCount: promo.usedCount + 1,
    });

    await ctx.db.patch(identity, {
      subscriptionType: "premium",
      premiumUntil: undefined,
      promoCode: promo.code,
      promoSource: promo.code,
    });

    return true;
  },
});
