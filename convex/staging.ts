import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
