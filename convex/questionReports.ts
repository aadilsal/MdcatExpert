import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { assertCanAccessQuiz } from "./quizAccess";
import { requireAdmin } from "./lib/auth";

type DbCtx = MutationCtx | QueryCtx;

const reportCategoryValidator = v.union(
  v.literal("wrong_answer"),
  v.literal("ambiguous"),
  v.literal("typo"),
  v.literal("image_issue"),
  v.literal("other"),
);

const reportStatusValidator = v.union(
  v.literal("open"),
  v.literal("resolved"),
  v.literal("dismissed"),
);

const MAX_COMMENT_LEN = 500;

async function getQuestionOrderInQuiz(
  ctx: DbCtx,
  quizId: Id<"quizzes">,
  questionId: Id<"questions">,
): Promise<number> {
  const link = await ctx.db
    .query("quizQuestions")
    .withIndex("by_quizId", (q) => q.eq("quizId", quizId))
    .filter((q) => q.eq(q.field("questionId"), questionId))
    .first();
  return link?.order ?? 0;
}

async function assertQuestionInQuiz(
  ctx: DbCtx,
  quizId: Id<"quizzes">,
  questionId: Id<"questions">,
) {
  const question = await ctx.db.get(questionId);
  if (!question || question.quizId !== quizId) {
    throw new Error("Question not found in this quiz.");
  }
}

export const submitQuestionReport = mutation({
  args: {
    quizId: v.id("quizzes"),
    questionId: v.id("questions"),
    category: reportCategoryValidator,
    comment: v.optional(v.string()),
  },
  handler: async (ctx, { quizId, questionId, category, comment }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Unauthorized");

    await assertCanAccessQuiz(ctx, quizId);

    const quiz = await ctx.db.get(quizId);
    if (!quiz) throw new Error("Quiz not found.");

    await assertQuestionInQuiz(ctx, quizId, questionId);

    const trimmedComment = comment?.trim().slice(0, MAX_COMMENT_LEN) || undefined;
    const questionOrder = await getQuestionOrderInQuiz(ctx, quizId, questionId);
    const userEmail = user.email?.trim() || "unknown@user";

    const existing = await ctx.db
      .query("questionReports")
      .withIndex("by_userId_questionId", (q) =>
        q.eq("userId", userId).eq("questionId", questionId),
      )
      .filter((q) => q.eq(q.field("status"), "open"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        category,
        comment: trimmedComment,
        quizTitle: quiz.title,
        questionOrder,
      });
      return { reportId: existing._id, updated: true };
    }

    const reportId = await ctx.db.insert("questionReports", {
      userId,
      userEmail,
      quizId,
      quizTitle: quiz.title,
      questionId,
      questionOrder,
      category,
      comment: trimmedComment,
      status: "open",
      createdAt: Date.now(),
    });

    return { reportId, updated: false };
  },
});

export const listReportsByStatus = query({
  args: { status: reportStatusValidator },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    const reports = await ctx.db
      .query("questionReports")
      .withIndex("by_status", (q) => q.eq("status", status))
      .collect();
    return reports.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const countOpenReports = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const open = await ctx.db
      .query("questionReports")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    return open.length;
  },
});

export const getReportById = query({
  args: { reportId: v.id("questionReports") },
  handler: async (ctx, { reportId }) => {
    await requireAdmin(ctx);
    const report = await ctx.db.get(reportId);
    if (!report) return null;

    const question = await ctx.db.get(report.questionId);
    const quiz = await ctx.db.get(report.quizId);

    return { report, question, quiz };
  },
});

export const resolveReport = mutation({
  args: {
    reportId: v.id("questionReports"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, { reportId, adminNote }) => {
    const { userId } = await requireAdmin(ctx);
    const report = await ctx.db.get(reportId);
    if (!report) throw new Error("Report not found.");

    await ctx.db.patch(reportId, {
      status: "resolved",
      adminNote: adminNote?.trim().slice(0, MAX_COMMENT_LEN),
      resolvedBy: userId,
      resolvedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: report.userId,
      title: "Question report resolved",
      message: `We reviewed your report on Q${report.questionOrder} in ${report.quizTitle}.`,
      read: false,
      createdAt: Date.now(),
    });

    return reportId;
  },
});

export const dismissReport = mutation({
  args: {
    reportId: v.id("questionReports"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, { reportId, adminNote }) => {
    const { userId } = await requireAdmin(ctx);
    const report = await ctx.db.get(reportId);
    if (!report) throw new Error("Report not found.");

    await ctx.db.patch(reportId, {
      status: "dismissed",
      adminNote: adminNote?.trim().slice(0, MAX_COMMENT_LEN),
      resolvedBy: userId,
      resolvedAt: Date.now(),
    });

    return reportId;
  },
});

export const resolveAllOpenForQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, { questionId, adminNote }) => {
    const { userId } = await requireAdmin(ctx);
    const open = await ctx.db
      .query("questionReports")
      .withIndex("by_questionId", (q) => q.eq("questionId", questionId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();

    const note = adminNote?.trim().slice(0, MAX_COMMENT_LEN);
    const now = Date.now();

    for (const report of open) {
      await ctx.db.patch(report._id, {
        status: "resolved",
        adminNote: note ?? "Question updated by admin.",
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

    return open.length;
  },
});

export const countOpenReportsForQuiz = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, { quizId }) => {
    await requireAdmin(ctx);
    const open = await ctx.db
      .query("questionReports")
      .withIndex("by_quizId", (q) => q.eq("quizId", quizId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();
    return open.length;
  },
});
