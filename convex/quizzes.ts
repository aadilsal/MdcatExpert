import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { assertCanAccessQuiz } from "./quizAccess";
import { requireAdmin } from "./lib/auth";

const subjectValidator = v.union(
  v.literal("Biology"),
  v.literal("Chemistry"),
  v.literal("Physics"),
  v.literal("English"),
  v.literal("General"),
);

export const getQuizzes = query({
  args: {
    subject: v.optional(
      v.union(
        v.literal("Biology"),
        v.literal("Chemistry"),
        v.literal("Physics"),
        v.literal("English"),
        v.literal("General"),
      ),
    ),
  },
  handler: async (ctx, { subject }) => {
    if (subject) {
      return await ctx.db
        .query("quizzes")
        .withIndex("by_subject", (q) => q.eq("subject", subject))
        .collect();
    }
    return await ctx.db.query("quizzes").collect();
  },
});

export const getQuizById = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, { quizId }) => {
    return await ctx.db.get(quizId);
  },
});

export const getQuizQuestions = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, { quizId }) => {
    await assertCanAccessQuiz(ctx, quizId);
    const questions = await ctx.db
      .query("quizQuestions")
      .withIndex("by_quizId", (q) => q.eq("quizId", quizId))
      .collect();

    const questionsWithDetails = await Promise.all(
      questions.map(async (qq) => {
        const question = await ctx.db.get(qq.questionId);
        return { ...question, order: qq.order };
      })
    );

    return questionsWithDetails.sort((a, b) => a.order - b.order);
  },
});

export const createQuiz = mutation({
  args: {
    title: v.string(),
    year: v.number(),
    subject: v.union(
      v.literal("Biology"),
      v.literal("Chemistry"),
      v.literal("Physics"),
      v.literal("English"),
      v.literal("General")
    ),
    totalQuestions: v.number(),
    isPremium: v.boolean(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, { title, year, subject, totalQuestions, isPremium, createdBy }) => {
    return await ctx.db.insert("quizzes", {
      title,
      year,
      subject,
      totalQuestions,
      isPremium,
      createdBy,
      createdAt: Date.now(),
    });
  },
});

export const updateQuizMetadata = mutation({
  args: {
    quizId: v.id("quizzes"),
    title: v.optional(v.string()),
    year: v.optional(v.number()),
    isPremium: v.optional(v.boolean()),
  },
  handler: async (ctx, { quizId, title, year, isPremium }) => {
    await requireAdmin(ctx);
    const quiz = await ctx.db.get(quizId);
    if (!quiz) throw new Error("Quiz not found.");

    const patch: Record<string, unknown> = {};
    if (title !== undefined) {
      const trimmed = title.trim();
      if (!trimmed) throw new Error("Title cannot be empty.");
      patch.title = trimmed;
    }
    if (year !== undefined) patch.year = year;
    if (isPremium !== undefined) patch.isPremium = isPremium;

    if (Object.keys(patch).length === 0) return quizId;

    await ctx.db.patch(quizId, patch);

    if (patch.title) {
      const reports = await ctx.db
        .query("questionReports")
        .withIndex("by_quizId", (q) => q.eq("quizId", quizId))
        .collect();
      for (const report of reports) {
        if (report.status === "open") {
          await ctx.db.patch(report._id, { quizTitle: patch.title as string });
        }
      }
    }

    return quizId;
  },
});

export const updatePublishedQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    questionText: v.optional(v.string()),
    optionA: v.optional(v.string()),
    optionB: v.optional(v.string()),
    optionC: v.optional(v.string()),
    optionD: v.optional(v.string()),
    correctOption: v.optional(
      v.union(v.literal("A"), v.literal("B"), v.literal("C"), v.literal("D")),
    ),
    subject: v.optional(subjectValidator),
    explanation: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    resolveReports: v.optional(v.boolean()),
  },
  handler: async (ctx, { questionId, resolveReports, ...fields }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(questionId);
    if (!existing) throw new Error("Question not found.");

    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(questionId, patch);
    }

    if (resolveReports !== false) {
      const open = await ctx.db
        .query("questionReports")
        .withIndex("by_questionId", (q) => q.eq("questionId", questionId))
        .filter((q) => q.eq(q.field("status"), "open"))
        .collect();
      const { userId } = await requireAdmin(ctx);
      const now = Date.now();
      for (const report of open) {
        await ctx.db.patch(report._id, {
          status: "resolved",
          adminNote: "Question updated by admin.",
          resolvedBy: userId,
          resolvedAt: now,
        });
        await ctx.db.insert("notifications", {
          userId: report.userId,
          title: "Question updated",
          message: `We updated Q${report.questionOrder} in ${report.quizTitle} based on your report.`,
          read: false,
          createdAt: now,
        });
      }
    }

    return questionId;
  },
});

export const deleteQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, { quizId }) => {
    await requireAdmin(ctx);

    const quizQuestions = await ctx.db
      .query("quizQuestions")
      .withIndex("by_quizId", (q) => q.eq("quizId", quizId))
      .collect();

    const questionIds = new Set<Id<"questions">>();
    for (const qq of quizQuestions) {
      questionIds.add(qq.questionId);
      await ctx.db.delete(qq._id);
    }

    for (const questionId of questionIds) {
      const reports = await ctx.db
        .query("questionReports")
        .withIndex("by_questionId", (q) => q.eq("questionId", questionId))
        .collect();
      for (const report of reports) {
        await ctx.db.delete(report._id);
      }
      await ctx.db.delete(questionId);
    }

    const quizReports = await ctx.db
      .query("questionReports")
      .withIndex("by_quizId", (q) => q.eq("quizId", quizId))
      .collect();
    for (const report of quizReports) {
      await ctx.db.delete(report._id);
    }

    await ctx.db.delete(quizId);
  },
});
