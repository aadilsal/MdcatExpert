import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/datamodel";

export const getQuizzes = query({
  args: { subject: v.optional(v.string()) },
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

export const deleteQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, { quizId }) => {
    // Delete associated questions and quiz-question mappings
    const quizQuestions = await ctx.db
      .query("quizQuestions")
      .withIndex("by_quizId", (q) => q.eq("quizId", quizId))
      .collect();

    for (const qq of quizQuestions) {
      await ctx.db.delete(qq._id);
    }

    // Delete the quiz itself
    await ctx.db.delete(quizId);
  },
});
