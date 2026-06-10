import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery, mutation, query } from "./_generated/server";
import { scoreChunkByKeywords } from "./lib/retrieval";
import {
  assertCanSendMessage,
  assertChatModeAllowed,
  incrementDailyMessageCount,
  type CopilotMode,
} from "./copilotAccess";

const modeValidator = v.union(
  v.literal("explain"),
  v.literal("exam"),
  v.literal("quiz"),
  v.literal("flashcards"),
  v.literal("revise"),
);

export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const sessions = await ctx.db
      .query("copilotSessions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getSession = query({
  args: { sessionId: v.id("copilotSessions") },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== userId) throw new Error("Session not found");

    const messages = await ctx.db
      .query("copilotMessages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .collect();

    return {
      session,
      messages: messages.sort((a, b) => a.createdAt - b.createdAt),
    };
  },
});

export const createSession = mutation({
  args: {
    title: v.optional(v.string()),
    sourceIds: v.array(v.id("studySources")),
    mode: modeValidator,
  },
  handler: async (ctx, { title, sourceIds, mode }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await assertChatModeAllowed(ctx, mode as CopilotMode);

    for (const sourceId of sourceIds) {
      const source = await ctx.db.get(sourceId);
      if (!source) throw new Error("Source not found");
      if (source.ownerType === "user" && source.userId !== userId) {
        throw new Error("Forbidden");
      }
      if (source.ownerType === "platform" && !source.isPublished) {
        throw new Error("Source not available");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("copilotSessions", {
      userId,
      title: title?.trim() || "New chat",
      sourceIds,
      mode,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMessage = mutation({
  args: {
    sessionId: v.id("copilotSessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    citations: v.optional(
      v.array(
        v.object({
          chunkId: v.id("documentChunks"),
          excerpt: v.string(),
          pageNumber: v.optional(v.number()),
          sourceTitle: v.string(),
          sourceKind: v.string(),
        }),
      ),
    ),
    incrementUsage: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionId, role, content, citations, incrementUsage }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== userId) throw new Error("Session not found");

    if (role === "user" && incrementUsage) {
      await assertCanSendMessage(ctx);
      await incrementDailyMessageCount(ctx, userId);
    }

    const messageId = await ctx.db.insert("copilotMessages", {
      sessionId,
      role,
      content,
      citations,
      createdAt: Date.now(),
    });

    await ctx.db.patch(sessionId, { updatedAt: Date.now() });
    return messageId;
  },
});

export const internalGetSessionQuery = internalQuery({
  args: { sessionId: v.id("copilotSessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db.get(sessionId);
  },
});

export const searchChunks = query({
  args: {
    sourceIds: v.array(v.id("studySources")),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { sourceIds, query: searchQuery, limit = 8 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const trimmed = searchQuery.trim();
    if (!trimmed) return [];

    type ChunkResult = {
      _id: Id<"documentChunks">;
      _score: number;
      text: string;
      pageNumber?: number;
      sectionTitle?: string;
      sourceId: Id<"studySources">;
    };

    const allResults: ChunkResult[] = [];
    const seen = new Set<string>();

    for (const sourceId of sourceIds) {
      const source = await ctx.db.get(sourceId);
      if (!source) continue;
      if (source.ownerType === "user" && source.userId !== userId) continue;
      if (source.ownerType === "platform" && !source.isPublished) continue;

      const searchHits = await ctx.db
        .query("documentChunks")
        .withSearchIndex("search_text", (q) =>
          q.search("text", trimmed).eq("sourceId", sourceId),
        )
        .take(limit);

      for (const chunk of searchHits) {
        if (seen.has(chunk._id)) continue;
        seen.add(chunk._id);
        allResults.push({
          _id: chunk._id,
          _score: 10,
          text: chunk.text,
          pageNumber: chunk.pageNumber,
          sectionTitle: chunk.sectionTitle,
          sourceId: chunk.sourceId,
        });
      }
    }

    if (allResults.length < limit) {
      for (const sourceId of sourceIds) {
        const source = await ctx.db.get(sourceId);
        if (!source) continue;
        if (source.ownerType === "user" && source.userId !== userId) continue;

        const chunks = await ctx.db
          .query("documentChunks")
          .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
          .take(50);

        for (const chunk of chunks) {
          if (seen.has(chunk._id)) continue;
          const score = scoreChunkByKeywords(chunk.text, trimmed);
          if (score > 0) {
            seen.add(chunk._id);
            allResults.push({
              _id: chunk._id,
              _score: score,
              text: chunk.text,
              pageNumber: chunk.pageNumber,
              sectionTitle: chunk.sectionTitle,
              sourceId: chunk.sourceId,
            });
          }
        }
      }
    }

    return allResults.sort((a, b) => b._score - a._score).slice(0, limit);
  },
});
