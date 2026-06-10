import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const insertBatch = internalMutation({
  args: {
    chunks: v.array(
      v.object({
        sourceId: v.id("studySources"),
        chunkIndex: v.number(),
        text: v.string(),
        tokenCount: v.number(),
        pageNumber: v.optional(v.number()),
        sectionTitle: v.optional(v.string()),
        subject: v.optional(v.string()),
        ownerType: v.union(v.literal("platform"), v.literal("user")),
      }),
    ),
  },
  handler: async (ctx, { chunks }) => {
    const now = Date.now();
    for (const chunk of chunks) {
      await ctx.db.insert("documentChunks", { ...chunk, createdAt: now });
    }
  },
});

export const deleteBySourceId = internalMutation({
  args: { sourceId: v.id("studySources") },
  handler: async (ctx, { sourceId }) => {
    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .collect();
    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }
  },
});

export const getChunksByIds = internalQuery({
  args: { chunkIds: v.array(v.id("documentChunks")) },
  handler: async (ctx, { chunkIds }) => {
    const results = [];
    for (const id of chunkIds) {
      const chunk = await ctx.db.get(id);
      if (chunk) results.push(chunk);
    }
    return results;
  },
});
