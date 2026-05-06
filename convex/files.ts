import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveUploadedFile = mutation({
  args: {
    storageId: v.id("_storage"),
    userId: v.id("users"),
    fileType: v.string(),
    fileName: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, { storageId, userId, fileType, fileName, contentType, fileSize }) => {
    const url = (await ctx.storage.getUrl(storageId)) ?? "";
    const fileId = await ctx.db.insert("files", {
      storageId,
      userId,
      fileType,
      fileName,
      contentType,
      fileSize,
      url,
      createdAt: Date.now(),
    });
    return { fileId, url, storageId };
  },
});

export const createFileRecord = mutation({
  args: {
    storageId: v.id("_storage"),
    userId: v.id("users"),
    fileType: v.string(),
    fileName: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getFilesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.query("files").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
  },
});

export const getFilesByType = query({
  args: { fileType: v.string() },
  handler: async (ctx, { fileType }) => {
    return await ctx.db.query("files").withIndex("by_fileType", (q) => q.eq("fileType", fileType)).collect();
  },
});
