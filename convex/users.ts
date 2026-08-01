import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isActivePremiumUser } from "./quizAccess";

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

export const getUserEmailForPasswordChange = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user?.email) return null;
    return { email: user.email };
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    if (user.subscriptionType === "premium" && !isActivePremiumUser(user)) {
      return {
        ...user,
        subscriptionType: "free" as const,
      };
    }
    return user;
  },
});

function getCurrentWeekId(): string {
  const d = new Date();
  const year = d.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
  return `${year}-${week}`;
}

async function getTop3UserIds(ctx: any): Promise<string[]> {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentAttempts = await ctx.db.query("attempts").collect();
  const weeklyAttempts = recentAttempts.filter((a: any) => a.createdAt >= oneWeekAgo);

  const userStatsMap = new Map<string, number>();
  for (const attempt of weeklyAttempts) {
    const uId = String(attempt.userId);
    const existing = userStatsMap.get(uId) || 0;
    userStatsMap.set(uId, existing + (attempt.correctAnswers || 0));
  }

  return Array.from(userStatsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);
}

export const getCurrentUserProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const top3 = await getTop3UserIds(ctx);
    const topperIndex = top3.indexOf(String(userId));
    const topperRank = topperIndex !== -1 ? topperIndex + 1 : null;

    const isPremium = user.subscriptionType === "premium" && isActivePremiumUser(user);

    return {
      ...user,
      subscriptionType: isPremium ? ("premium" as const) : ("free" as const),
      topperRank,
      hasClaimedWeeklyReward: user.lastClaimedTopperWeek === getCurrentWeekId(),
    };
  },
});

export const claimTopperReward = mutation({
  handler: async (ctx) => {
    const me = await getAuthUserId(ctx);
    if (!me) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(me);
    if (!user) {
      throw new Error("User not found");
    }

    const top3 = await getTop3UserIds(ctx);
    const rank = top3.indexOf(String(me)) + 1;
    if (rank === 0) {
      throw new Error("Only top 3 weekly scorers can claim topper rewards.");
    }

    const currentWeek = getCurrentWeekId();
    if (user.lastClaimedTopperWeek === currentWeek) {
      throw new Error("You have already claimed your topper reward for this week.");
    }

    const currentExpiry = user.premiumUntil && user.premiumUntil > Date.now() ? user.premiumUntil : Date.now();
    const newExpiry = currentExpiry + 30 * 24 * 60 * 60 * 1000;

    await ctx.db.patch(me, {
      subscriptionType: "premium",
      premiumUntil: newExpiry,
      lastClaimedTopperWeek: currentWeek,
    });

    return { success: true, newExpiry };
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

// Lets a signed-in user opt in/out of the "your Elite access is expiring /
// has expired" renewal emails (convex/subscriptionReminders.ts). There's no
// auto-renewal to "cancel" — this is the actual cancel-anytime control.
// Identity is derived server-side, never taken as an argument.
export const setRenewalRemindersEnabled = mutation({
  args: {
    enabled: v.boolean(),
  },
  handler: async (ctx, { enabled }) => {
    const me = await getAuthUserId(ctx);
    if (!me) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(me, { renewalRemindersEnabled: enabled });
    return null;
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

export const generateVerificationOtp = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 min expiry
    
    await ctx.db.patch(userId, {
      otpCode: otp,
      otpExpiry: expiry,
    });
    
    return otp;
  },
});

export const verifyOtp = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    if (!user.otpCode || !user.otpExpiry) {
      throw new Error("No active OTP request found.");
    }
    
    if (Date.now() > user.otpExpiry) {
      throw new Error("Verification code has expired. Please request a new one.");
    }
    
    if (user.otpCode !== code.trim()) {
      throw new Error("Incorrect verification code.");
    }
    
    await ctx.db.patch(userId, {
      emailVerificationTime: Date.now(),
      otpCode: undefined,
      otpExpiry: undefined,
    });
    
    return { success: true };
  },
});
