"use server";

import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatUserError } from "@/lib/format-user-error";

export type ReportCategory =
  | "wrong_answer"
  | "ambiguous"
  | "typo"
  | "image_issue"
  | "other";

export async function reportQuestionAction(
  quizId: string,
  questionId: string,
  category: ReportCategory,
  comment?: string,
) {
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("You must be logged in to report a question.");

  try {
    const result = await fetchMutation(
      api.questionReports.submitQuestionReport,
      {
        quizId: quizId as Id<"quizzes">,
        questionId: questionId as Id<"questions">,
        category,
        comment,
      },
      { token },
    );
    return { success: true as const, updated: result.updated };
  } catch (error) {
    throw new Error(formatUserError(error, "Failed to submit report."));
  }
}
