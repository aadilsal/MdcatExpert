import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const subject = v.union(
  v.literal("Biology"),
  v.literal("Chemistry"),
  v.literal("Physics"),
  v.literal("English"),
  v.literal("General"),
);

export const getStagingQuestions = query({
  args: { batchId: v.string() },
  handler: async (ctx, { batchId }) => {
    return await ctx.db
      .query("stagingQuestions")
      .withIndex("by_batchId", (q) => q.eq("batchId", batchId))
      .collect();
  },
});

export const createStagingQuestion = mutation({
  args: {
    batchId: v.string(),
    questionText: v.string(),
    optionA: v.string(),
    optionB: v.string(),
    optionC: v.string(),
    optionD: v.string(),
    correctOption: v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
    subject,
    explanation: v.optional(v.string()),
    year: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await getAuthUserId(ctx);
    if (!me) throw new Error("Unauthorized");
    const meDoc = await ctx.db.get(me);
    if (!meDoc || meDoc.role !== "admin") throw new Error("Forbidden");

    return await ctx.db.insert("stagingQuestions", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateStagingQuestion = mutation({
  args: {
    stagingQuestionId: v.id("stagingQuestions"),
    patch: v.object({
      questionText: v.optional(v.string()),
      optionA: v.optional(v.string()),
      optionB: v.optional(v.string()),
      optionC: v.optional(v.string()),
      optionD: v.optional(v.string()),
      correctOption: v.optional(
        v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
      ),
      subject: v.optional(subject),
      explanation: v.optional(v.string()),
      year: v.optional(v.number()),
      imageUrl: v.optional(v.string()),
      status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    }),
  },
  handler: async (ctx, { stagingQuestionId, patch }) => {
    const me = await getAuthUserId(ctx);
    if (!me) throw new Error("Unauthorized");
    const meDoc = await ctx.db.get(me);
    if (!meDoc || meDoc.role !== "admin") throw new Error("Forbidden");
    return await ctx.db.patch(stagingQuestionId, patch);
  },
});

export const deleteStagingQuestion = mutation({
  args: { stagingQuestionId: v.id("stagingQuestions") },
  handler: async (ctx, { stagingQuestionId }) => {
    const me = await getAuthUserId(ctx);
    if (!me) throw new Error("Unauthorized");
    const meDoc = await ctx.db.get(me);
    if (!meDoc || meDoc.role !== "admin") throw new Error("Forbidden");
    await ctx.db.delete(stagingQuestionId);
    return true;
  },
});

export const publishBatch = mutation({
  args: {
    batchId: v.string(),
    title: v.string(),
    year: v.number(),
    subject,
    isPremium: v.boolean(),
  },
  handler: async (ctx, { batchId, title, year, subject: subj, isPremium }) => {
    const me = await getAuthUserId(ctx);
    if (!me) throw new Error("Unauthorized");
    const meDoc = await ctx.db.get(me);
    if (!meDoc || meDoc.role !== "admin") throw new Error("Forbidden");

    const staged = await ctx.db
      .query("stagingQuestions")
      .withIndex("by_batchId", (q) => q.eq("batchId", batchId))
      .collect();
    const publishable = staged.filter((s) => s.status !== "rejected");
    if (publishable.length === 0) throw new Error("No questions to publish");

    const quizId = await ctx.db.insert("quizzes", {
      title,
      year,
      subject: subj,
      totalQuestions: publishable.length,
      isPremium,
      createdBy: me,
      createdAt: Date.now(),
    });

    let order = 1;
    for (const s of publishable) {
      const questionId = await ctx.db.insert("questions", {
        quizId,
        questionText: s.questionText,
        optionA: s.optionA,
        optionB: s.optionB,
        optionC: s.optionC,
        optionD: s.optionD,
        correctOption: s.correctOption,
        subject: s.subject,
        explanation: s.explanation,
        imageUrl: s.imageUrl,
        createdAt: Date.now(),
      });
      await ctx.db.insert("quizQuestions", {
        quizId,
        questionId,
        order,
        createdAt: Date.now(),
      });
      order += 1;
      await ctx.db.patch(s._id, { status: "approved" });
    }

    return { quizId, published: publishable.length };
  },
});
