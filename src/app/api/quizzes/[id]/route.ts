import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { formatUserError } from "@/lib/format-user-error";
import {
  canAccessQuiz,
  isActivePremiumUser,
  sortQuizzesForCatalog,
} from "@/lib/quiz-access";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await convexAuthNextjsToken();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (id === "mistakes") {
      const questions = await fetchQuery(api.attempts.getIncorrectQuestions, {}, { token });
      const mappedQuiz = {
        id: "mistakes",
        title: "Mistakes Correction Drill",
        year: new Date().getFullYear(),
        subject: "General",
        total_questions: questions?.length ?? 0,
        is_premium: false,
      };
      const mappedQuestions = (questions ?? []).map((q: any) => ({
        id: q?._id,
        question_text: q?.questionText,
        option_a: q?.optionA,
        option_b: q?.optionB,
        option_c: q?.optionC,
        option_d: q?.optionD,
        correct_option: q?.correctOption,
        subject: q?.subject,
        explanation: q?.explanation ?? null,
        image_url: q?.imageUrl ?? null,
      }));
      return NextResponse.json({ quiz: mappedQuiz, questions: mappedQuestions });
    }

    const quiz = await fetchQuery(api.quizzes.getQuizById, { quizId: id as Id<"quizzes"> }, { token });
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    const isPremiumUser = isActivePremiumUser(me);

    const allQuizzes = await fetchQuery(api.quizzes.getQuizzes, {}, { token });
    const catalogEntries = sortQuizzesForCatalog(
      (allQuizzes ?? []).map((q) => ({
        _id: String(q._id),
        year: q.year,
        title: q.title,
      })),
    );

    let allowed = canAccessQuiz(String(quiz._id), catalogEntries, isPremiumUser);
    if (!allowed && me?._id) {
      const attempts = await fetchQuery(
        api.attempts.getUserAttempts,
        { userId: me._id },
        { token },
      );
      allowed = (attempts ?? []).some((a) => String(a.quizId) === String(quiz._id));
    }

    if (!allowed) {
      return NextResponse.json(
        { error: "Premium required", upgradeUrl: "/upgrade?reason=premium_content", quiz: { id: quiz._id } },
        { status: 403 },
      );
    }

    const questions = await fetchQuery(api.quizzes.getQuizQuestions, { quizId: quiz._id }, { token });

    // Map Convex camelCase → legacy snake_case (keeps existing UI components working)
    const mappedQuiz = {
      id: quiz._id,
      title: quiz.title,
      year: quiz.year,
      subject: quiz.subject,
      total_questions: quiz.totalQuestions,
      is_premium: quiz.isPremium,
    };

    const mappedQuestions = (questions ?? []).map((q) => ({
      id: q?._id,
      question_text: q?.questionText,
      option_a: q?.optionA,
      option_b: q?.optionB,
      option_c: q?.optionC,
      option_d: q?.optionD,
      correct_option: q?.correctOption,
      subject: q?.subject,
      explanation: q?.explanation ?? null,
      image_url: q?.imageUrl ?? null,
    }));

    return NextResponse.json({ quiz: mappedQuiz, questions: mappedQuestions });
  } catch (error) {
    console.error("Quiz GET error", error);
    return NextResponse.json(
      { error: formatUserError(error, "Unable to load quiz.") },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = await convexAuthNextjsToken();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await fetchMutation(api.quizzes.deleteQuiz, { quizId: id as Id<"quizzes"> }, { token });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quiz DELETE error", error);
    return NextResponse.json(
      { error: formatUserError(error, "Unable to delete quiz.") },
      { status: 500 },
    );
  }
}
