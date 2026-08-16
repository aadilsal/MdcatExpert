import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import {
  assertCanUpload,
  countStudentUploads,
  getCopilotLimits,
  getDailyMessageCount,
} from "./copilotAccess";

const subjectValidator = v.optional(
  v.union(
    v.literal("Biology"),
    v.literal("Chemistry"),
    v.literal("Physics"),
    v.literal("English"),
    v.literal("General"),
  ),
);

const sourceKindValidator = v.union(
  v.literal("pctb_textbook"),
  v.literal("admin_upload"),
  v.literal("student_upload"),
  v.literal("ai_summary"),
);

export const listPlatformLibrary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const sources = await ctx.db
      .query("studySources")
      .withIndex("by_ownerType", (q) => q.eq("ownerType", "platform"))
      .collect();

    return sources
      .filter((s) => s.isPublished && s.status === "ready")
      .sort((a, b) => a.title.localeCompare(b.title));
  },
});

export const listMyUploads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const sources = await ctx.db
      .query("studySources")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return sources
      .filter((s) => s.sourceKind === "student_upload")
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listAllForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const sources = await ctx.db.query("studySources").collect();
    return sources.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getSourceById = query({
  args: { sourceId: v.id("studySources") },
  handler: async (ctx, { sourceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const source = await ctx.db.get(sourceId);
    if (!source) return null;

    if (source.ownerType === "user" && source.userId !== userId) {
      throw new Error("Forbidden");
    }

    return source;
  },
});

export const getCopilotUsage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const profile = await ctx.db.get(userId);
    if (!profile) throw new Error("Unauthorized");

    const limits = getCopilotLimits(profile);
    const uploadCount = await countStudentUploads(ctx, userId);
    const messageCount = await getDailyMessageCount(ctx, userId);

    return {
      ...limits,
      uploadCount,
      messageCount,
    };
  },
});

export const createStudentUpload = mutation({
  args: {
    storageId: v.optional(v.id("_storage")),
    rawText: v.optional(v.string()),
    title: v.string(),
    subject: subjectValidator,
    contentType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await assertCanUpload(ctx);

    if (!args.storageId && !args.rawText?.trim()) {
      throw new Error("File or text content required");
    }

    const now = Date.now();
    const sourceId = await ctx.db.insert("studySources", {
      ownerType: "user",
      userId,
      storageId: args.storageId,
      rawText: args.rawText?.trim(),
      title: args.title.trim(),
      subject: args.subject,
      sourceKind: "student_upload",
      status: "processing",
      isPremiumOnly: false,
      isPublished: true,
      contentType: args.contentType,
      fileSize: args.fileSize,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.ingestDocument.ingestSource, { sourceId });

    return sourceId;
  },
});

export const createPlatformSource = mutation({
  args: {
    storageId: v.optional(v.id("_storage")),
    rawText: v.optional(v.string()),
    title: v.string(),
    subject: subjectValidator,
    classLevel: v.optional(v.string()),
    chapter: v.optional(v.string()),
    sourceKind: sourceKindValidator,
    contentType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (!args.storageId && !args.rawText?.trim()) {
      throw new Error("File or text content required");
    }

    const now = Date.now();
    const sourceId = await ctx.db.insert("studySources", {
      ownerType: "platform",
      storageId: args.storageId,
      rawText: args.rawText?.trim(),
      title: args.title.trim(),
      subject: args.subject,
      classLevel: args.classLevel,
      chapter: args.chapter,
      sourceKind: args.sourceKind,
      status: "processing",
      isPremiumOnly: false,
      isPublished: args.isPublished ?? true,
      contentType: args.contentType,
      fileSize: args.fileSize,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.ingestDocument.ingestSource, { sourceId });

    return sourceId;
  },
});

export const deleteSource = mutation({
  args: { sourceId: v.id("studySources") },
  handler: async (ctx, { sourceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const source = await ctx.db.get(sourceId);
    if (!source) throw new Error("Source not found");

    const profile = await ctx.db.get(userId);
    const isAdmin = profile?.role === "admin";

    if (source.ownerType === "user" && source.userId !== userId && !isAdmin) {
      throw new Error("Forbidden");
    }
    if (source.ownerType === "platform" && !isAdmin) {
      throw new Error("Forbidden");
    }

    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .collect();
    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }
    await ctx.db.delete(sourceId);
  },
});

export const reindexSource = mutation({
  args: { sourceId: v.id("studySources") },
  handler: async (ctx, { sourceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const source = await ctx.db.get(sourceId);
    if (!source) throw new Error("Source not found");

    const profile = await ctx.db.get(userId);
    const isAdmin = profile?.role === "admin";

    if (source.ownerType === "user" && source.userId !== userId && !isAdmin) {
      throw new Error("Forbidden");
    }
    if (source.ownerType === "platform" && !isAdmin) {
      throw new Error("Forbidden");
    }

    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .collect();
    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }

    const ocrPages = await ctx.db
      .query("ocrPageTexts")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .collect();
    for (const row of ocrPages) {
      await ctx.db.delete(row._id);
    }

    await ctx.db.patch(sourceId, {
      status: "processing",
      chunkCount: undefined,
      errorMessage: undefined,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.ingestDocument.ingestSource, { sourceId });
  },
});

export const updateSourceTitle = mutation({
  args: { sourceId: v.id("studySources"), title: v.string() },
  handler: async (ctx, { sourceId, title }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const source = await ctx.db.get(sourceId);
    if (!source) throw new Error("Source not found");
    if (source.ownerType === "user" && source.userId !== userId) {
      throw new Error("Forbidden");
    }

    await ctx.db.patch(sourceId, { title: title.trim(), updatedAt: Date.now() });
  },
});

export const internalGetSource = internalQuery({
  args: { sourceId: v.id("studySources") },
  handler: async (ctx, { sourceId }) => {
    return await ctx.db.get(sourceId);
  },
});

export const internalPatchSource = internalMutation({
  args: {
    sourceId: v.id("studySources"),
    status: v.optional(v.union(v.literal("processing"), v.literal("ready"), v.literal("failed"))),
    chunkCount: v.optional(v.number()),
    pageCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    notifiedAt: v.optional(v.number()),
  },
  handler: async (ctx, { sourceId, ...patch }) => {
    await ctx.db.patch(sourceId, { ...patch, updatedAt: Date.now() });
  },
});
