import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { userId, title, message }) => {
    return await ctx.db.insert("notifications", {
      userId,
      title,
      message,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    return await ctx.db.patch(notificationId, { read: true });
  },
});
