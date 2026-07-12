"use server";

import { revalidatePath } from "next/cache";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
    canAccessQuiz,
    isActivePremiumUser,
    sortQuizzesForCatalog,
} from "@/lib/quiz-access";

/**
 * Securely submits a quiz.
 * Scoring happens in the database via RPC to prevent client-side tampering.
 */
export async function submitQuizAction(
    quizId: string,
    elapsedSeconds: number,
    answers: Record<string, string>,
    timePerQuestion: Record<string, number>
) {
    void timePerQuestion;
    const token = await convexAuthNextjsToken();
    if (!token) throw new Error("Unauthorized: You must be logged in to submit a quiz.");

    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me) throw new Error("Unauthorized: You must be logged in to submit a quiz.");

    let realQuizId: Id<"quizzes">;
    let questions: any[] = [];

    if (quizId === "mistakes") {
        const mistakesQuizId = await fetchMutation(api.quizzes.ensureMistakesQuiz, {}, { token });
        if (!mistakesQuizId) throw new Error("Could not initialize mistakes quiz.");
        realQuizId = mistakesQuizId;
        const incorrectQuestions = await fetchQuery(api.attempts.getIncorrectQuestions, {}, { token });
        questions = incorrectQuestions ?? [];
    } else {
        const quiz = await fetchQuery(api.quizzes.getQuizById, { quizId: quizId as Id<"quizzes"> }, { token });
        if (!quiz) throw new Error("Quiz not found.");

        const allQuizzes = await fetchQuery(api.quizzes.getQuizzes, {}, { token });
        const catalogEntries = sortQuizzesForCatalog(
            (allQuizzes ?? []).map((q) => ({
                _id: String(q._id),
                year: q.year,
                title: q.title,
            })),
        );
        const premium = isActivePremiumUser(me);
        let allowed = canAccessQuiz(quizId, catalogEntries, premium);
        if (!allowed) {
            const attempts = await fetchQuery(
                api.attempts.getUserAttempts,
                { userId: me._id },
                { token },
            );
            allowed = (attempts ?? []).some((a) => String(a.quizId) === quizId);
        }
        if (!allowed) {
            throw new Error("Premium required: upgrade to Elite to access this quiz.");
        }
        realQuizId = quizId as Id<"quizzes">;
        const quizQuestions = await fetchQuery(api.quizzes.getQuizQuestions, { quizId: realQuizId }, { token });
        questions = quizQuestions ?? [];
    }

    const questionById = new Map<string, any>();
    for (const q of questions ?? []) {
        if (q?._id) questionById.set(String(q._id), q);
    }

    let correct = 0;
    let wrong = 0;
    for (const [questionId, selected] of Object.entries(answers)) {
        const q = questionById.get(questionId);
        if (!q) continue;
        const isCorrect = String(q.correctOption) === String(selected);
        if (isCorrect) correct += 1;
        else wrong += 1;
    }

    const attemptId = await fetchMutation(
        api.attempts.createAttempt,
        {
            userId: me._id,
            quizId: realQuizId,
            score: correct,
            correctAnswers: correct,
            wrongAnswers: wrong,
            timeTaken: elapsedSeconds,
        },
        { token },
    );

    for (const [questionId, selected] of Object.entries(answers)) {
        const q = questionById.get(questionId);
        if (!q) continue;
        const isCorrect = String(q.correctOption) === String(selected);
        await fetchMutation(
            api.attempts.saveUserAnswer,
            {
                attemptId: attemptId as Id<"attempts">,
                questionId: questionId as Id<"questions">,
                selectedOption: selected,
                isCorrect,
                aiAnalysis: undefined,
            },
            { token },
        );
    }

    // Clear caches for dashboard and analytics
    revalidatePath("/dashboard");
    revalidatePath("/analytics");

    return { success: true, attemptId };
}
