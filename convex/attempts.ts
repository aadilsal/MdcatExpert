import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

async function assertSelfOrAdmin(ctx: QueryCtx, subjectUserId: Id<"users">) {
  const me = await getAuthUserId(ctx);
  if (!me) {
    throw new Error("Unauthorized");
  }
  if (me === subjectUserId) {
    return me;
  }
  const profile = await ctx.db.get(me);
  if (profile?.role === "admin") {
    return me;
  }
  throw new Error("Forbidden");
}

export const createAttempt = mutation({
  args: {
    userId: v.id("users"),
    quizId: v.id("quizzes"),
    score: v.number(),
    correctAnswers: v.number(),
    wrongAnswers: v.number(),
    timeTaken: v.number(),
  },
  handler: async (ctx, { userId, quizId, score, correctAnswers, wrongAnswers, timeTaken }) => {
    const me = await getAuthUserId(ctx);
    if (!me || me !== userId) {
      throw new Error("Unauthorized");
    }
    return await ctx.db.insert("attempts", {
      userId,
      quizId,
      score,
      correctAnswers,
      wrongAnswers,
      timeTaken,
      completedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const getUserAttempts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await assertSelfOrAdmin(ctx, userId);

    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const uniqueQuizIds = [...new Set(attempts.map((a) => a.quizId))];
    const quizzes = await Promise.all(uniqueQuizIds.map((id) => ctx.db.get(id)));
    const quizById = new Map(
      quizzes.filter(Boolean).map((q) => [(q as NonNullable<typeof q>)._id, q as NonNullable<typeof q>]),
    );

    return attempts.map((attempt) => ({
      ...attempt,
      paper: quizById.get(attempt.quizId) ?? null,
    }));
  },
});

export const getSubjectPerformance = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await assertSelfOrAdmin(ctx, userId);

    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const subjectMap: Record<string, { total: number; correct: number; accuracy: number }> = {};

    const allAnswers: { questionId: Id<"questions">; isCorrect: boolean }[] = [];
    for (const attempt of attempts) {
      const answers = await ctx.db
        .query("userAnswers")
        .withIndex("by_attemptId", (q) => q.eq("attemptId", attempt._id))
        .collect();
      for (const answer of answers) {
        allAnswers.push({ questionId: answer.questionId, isCorrect: answer.isCorrect });
      }
    }

    const uniqueQuestionIds = [...new Set(allAnswers.map((a) => a.questionId))];
    const questions = await Promise.all(uniqueQuestionIds.map((id) => ctx.db.get(id)));
    const questionById = new Map(
      questions.filter(Boolean).map((q) => [(q as NonNullable<typeof q>)._id, q as NonNullable<typeof q>]),
    );

    for (const row of allAnswers) {
      const question = questionById.get(row.questionId);
      const subject = question?.subject || "General";

      if (!subjectMap[subject]) {
        subjectMap[subject] = { total: 0, correct: 0, accuracy: 0 };
      }

      subjectMap[subject].total += 1;
      if (row.isCorrect) {
        subjectMap[subject].correct += 1;
      }
    }

    return Object.entries(subjectMap).map(([subject, stats]) => ({
      subject,
      totalQuestions: stats.total,
      correctAnswers: stats.correct,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    }));
  },
});

export const getAttemptById = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, { attemptId }) => {
    const me = await getAuthUserId(ctx);
    if (!me) {
      return null;
    }
    const attempt = await ctx.db.get(attemptId);
    if (!attempt) {
      return null;
    }
    const profile = await ctx.db.get(me);
    if (attempt.userId !== me && profile?.role !== "admin") {
      return null;
    }
    return attempt;
  },
});

export const saveUserAnswer = mutation({
  args: {
    attemptId: v.id("attempts"),
    questionId: v.id("questions"),
    selectedOption: v.string(),
    isCorrect: v.boolean(),
    aiAnalysis: v.optional(
      v.object({
        reasoning: v.string(),
        misconception: v.string(),
        recommendation: v.string(),
      }),
    ),
  },
  handler: async (ctx, { attemptId, questionId, selectedOption, isCorrect, aiAnalysis }) => {
    const me = await getAuthUserId(ctx);
    if (!me) {
      throw new Error("Unauthorized");
    }
    const attempt = await ctx.db.get(attemptId);
    if (!attempt || attempt.userId !== me) {
      throw new Error("Forbidden");
    }
    return await ctx.db.insert("userAnswers", {
      attemptId,
      questionId,
      selectedOption: selectedOption as "A" | "B" | "C" | "D",
      isCorrect,
      aiAnalysis,
      createdAt: Date.now(),
    });
  },
});

export const getAttemptAnswers = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, { attemptId }) => {
    const me = await getAuthUserId(ctx);
    if (!me) {
      return [];
    }
    const attempt = await ctx.db.get(attemptId);
    if (!attempt) {
      return [];
    }
    const profile = await ctx.db.get(me);
    if (attempt.userId !== me && profile?.role !== "admin") {
      return [];
    }
    return await ctx.db
      .query("userAnswers")
      .withIndex("by_attemptId", (q) => q.eq("attemptId", attemptId))
      .collect();
  },
});

export const getUserAnswerWithQuestion = query({
  args: { userAnswerId: v.id("userAnswers") },
  handler: async (ctx, { userAnswerId }) => {
    const me = await getAuthUserId(ctx);
    if (!me) {
      return null;
    }
    const userAnswer = await ctx.db.get(userAnswerId);
    if (!userAnswer) {
      return null;
    }
    const attempt = await ctx.db.get(userAnswer.attemptId);
    if (!attempt) {
      return null;
    }
    const profile = await ctx.db.get(me);
    if (attempt.userId !== me && profile?.role !== "admin") {
      return null;
    }

    const question = await ctx.db.get(userAnswer.questionId);
    return { ...userAnswer, question };
  },
});

export const setUserAnswerAiAnalysis = mutation({
  args: {
    userAnswerId: v.id("userAnswers"),
    aiAnalysis: v.object({
      reasoning: v.string(),
      misconception: v.string(),
      recommendation: v.string(),
    }),
  },
  handler: async (ctx, { userAnswerId, aiAnalysis }) => {
    const me = await getAuthUserId(ctx);
    if (!me) {
      throw new Error("Unauthorized");
    }
    const userAnswer = await ctx.db.get(userAnswerId);
    if (!userAnswer) {
      throw new Error("Not found");
    }
    const attempt = await ctx.db.get(userAnswer.attemptId);
    if (!attempt || attempt.userId !== me) {
      throw new Error("Forbidden");
    }
    return await ctx.db.patch(userAnswerId, { aiAnalysis });
  },
});
