import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const attemptsWithQuizzes = await Promise.all(
      attempts.map(async (attempt) => {
        const quiz = await ctx.db.get(attempt.quizId);
        return { ...attempt, paper: quiz };
      })
    );

    return attemptsWithQuizzes;
  },
});

export const getSubjectPerformance = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const subjectMap: Record<string, { total: number; correct: number; accuracy: number }> = {};

    for (const attempt of attempts) {
      // Get userAnswers for this attempt
      const answers = await ctx.db
        .query("userAnswers")
        .withIndex("by_attemptId", (q) => q.eq("attemptId", attempt._id))
        .collect();

      for (const answer of answers) {
        const question = await ctx.db.get(answer.questionId);
        const subject = question?.subject || "General";

        if (!subjectMap[subject]) {
          subjectMap[subject] = { total: 0, correct: 0, accuracy: 0 };
        }

        subjectMap[subject].total += 1;
        if (answer.isCorrect) {
          subjectMap[subject].correct += 1;
        }
      }
    }

    const result = Object.entries(subjectMap).map(([subject, stats]) => ({
      subject,
      totalQuestions: stats.total,
      correctAnswers: stats.correct,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    }));

    return result;
  },
});

export const getAttemptById = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, { attemptId }) => {
    return await ctx.db.get(attemptId);
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
      })
    ),
  },
  handler: async (ctx, { attemptId, questionId, selectedOption, isCorrect, aiAnalysis }) => {
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
    return await ctx.db
      .query("userAnswers")
      .withIndex("by_attemptId", (q) => q.eq("attemptId", attemptId))
      .collect();
  },
});
