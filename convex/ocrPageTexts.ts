import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const insertPage = internalMutation({
  args: {
    sourceId: v.id("studySources"),
    pageNumber: v.number(),
    text: v.string(),
  },
  handler: async (ctx, { sourceId, pageNumber, text }) => {
    const existing = await ctx.db
      .query("ocrPageTexts")
      .withIndex("by_sourceId_pageNumber", (q) =>
        q.eq("sourceId", sourceId).eq("pageNumber", pageNumber),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { text });
      return existing._id;
    }

    return await ctx.db.insert("ocrPageTexts", {
      sourceId,
      pageNumber,
      text,
      createdAt: Date.now(),
    });
  },
});

export const deleteBySourceId = internalMutation({
  args: { sourceId: v.id("studySources") },
  handler: async (ctx, { sourceId }) => {
    const rows = await ctx.db
      .query("ocrPageTexts")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .collect();
    for (const row of rows) await ctx.db.delete(row._id);
  },
});

export const listBySourceId = internalQuery({
  args: { sourceId: v.id("studySources") },
  handler: async (ctx, { sourceId }) => {
    const rows = await ctx.db
      .query("ocrPageTexts")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .collect();
    return rows.sort((a, b) => a.pageNumber - b.pageNumber);
  },
});
