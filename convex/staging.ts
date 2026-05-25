/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const subjectValidator = v.union(
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
    correctOption: v.string(),
    subject: v.string(),
    explanation: v.optional(v.string()),
    year: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { batchId, questionText, optionA, optionB, optionC, optionD, correctOption, subject, explanation, year, imageUrl }) => {
    return await ctx.db.insert("stagingQuestions", {
      batchId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption: correctOption as "A" | "B" | "C" | "D",
      subject: subject as any,
      explanation,
      year,
      imageUrl,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const approveStagingQuestion = mutation({
  args: {
    stagingQuestionId: v.id("stagingQuestions"),
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, { stagingQuestionId, quizId }) => {
    const staging = await ctx.db.get(stagingQuestionId);
    if (!staging) throw new Error("Staging question not found");

    // Create the actual question
    const questionId = await ctx.db.insert("questions", {
      quizId,
      questionText: staging.questionText,
      optionA: staging.optionA,
      optionB: staging.optionB,
      optionC: staging.optionC,
      optionD: staging.optionD,
      correctOption: staging.correctOption,
      subject: staging.subject,
      explanation: staging.explanation,
      imageUrl: staging.imageUrl,
      createdAt: Date.now(),
    });

    // Update staging status
    await ctx.db.patch(stagingQuestionId, { status: "approved" });

    return questionId;
  },
});

export const rejectStagingQuestion = mutation({
  args: {
    stagingQuestionId: v.id("stagingQuestions"),
    reviewReason: v.string(),
  },
  handler: async (ctx, { stagingQuestionId, reviewReason }) => {
    return await ctx.db.patch(stagingQuestionId, {
      status: "rejected",
      reviewReason,
    });
  },
});

export const getPendingStagingQuestions = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("stagingQuestions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const updateStagingQuestion = mutation({
  args: {
    stagingQuestionId: v.id("stagingQuestions"),
    questionText: v.optional(v.string()),
    optionA: v.optional(v.string()),
    optionB: v.optional(v.string()),
    optionC: v.optional(v.string()),
    optionD: v.optional(v.string()),
    correctOption: v.optional(v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D"))),
    subject: v.optional(subjectValidator),
    explanation: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { stagingQuestionId, ...fields }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(stagingQuestionId);
    if (!existing) throw new Error("Staging question not found");

    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }
    if (Object.keys(patch).length === 0) return stagingQuestionId;

    await ctx.db.patch(stagingQuestionId, patch);
    return stagingQuestionId;
  },
});

export const updateStagingQuestionStatus = mutation({
  args: {
    stagingQuestionId: v.id("stagingQuestions"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    reviewReason: v.optional(v.string()),
  },
  handler: async (ctx, { stagingQuestionId, status, reviewReason }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(stagingQuestionId);
    if (!existing) throw new Error("Staging question not found");

    await ctx.db.patch(stagingQuestionId, {
      status,
      ...(reviewReason !== undefined ? { reviewReason } : {}),
    });
    return stagingQuestionId;
  },
});

export const deleteStagingQuestion = mutation({
  args: { stagingQuestionId: v.id("stagingQuestions") },
  handler: async (ctx, { stagingQuestionId }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(stagingQuestionId);
    if (!existing) throw new Error("Staging question not found");
    await ctx.db.delete(stagingQuestionId);
  },
});

export const publishStagingBatch = mutation({
  args: {
    batchId: v.string(),
    title: v.string(),
    year: v.number(),
    subject: subjectValidator,
    isPremium: v.boolean(),
  },
  handler: async (ctx, { batchId, title, year, subject, isPremium }) => {
    const { userId } = await requireAdmin(ctx);

    const staged = await ctx.db
      .query("stagingQuestions")
      .withIndex("by_batchId", (q) => q.eq("batchId", batchId))
      .collect();

    const toPublish = staged.filter((q) => q.status !== "rejected");
    if (toPublish.length === 0) {
      throw new Error("No questions to publish. Approve questions or remove rejections.");
    }

    const quizId = await ctx.db.insert("quizzes", {
      title,
      year,
      subject,
      totalQuestions: toPublish.length,
      isPremium,
      createdBy: userId,
      createdAt: Date.now(),
    });

    for (let i = 0; i < toPublish.length; i++) {
      const s = toPublish[i];
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
        order: i + 1,
        createdAt: Date.now(),
      });
    }

    for (const s of staged) {
      await ctx.db.delete(s._id);
    }

    return { quizId, questionCount: toPublish.length };
  },
});
