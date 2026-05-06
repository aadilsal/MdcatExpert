"use server";

import { revalidatePath } from "next/cache";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

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

    const quiz = await fetchQuery(api.quizzes.getQuizById, { quizId: quizId as Id<"quizzes"> }, { token });
    if (!quiz) throw new Error("Quiz not found.");

    const questions = await fetchQuery(api.quizzes.getQuizQuestions, { quizId: quizId as Id<"quizzes"> }, { token });
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
            quizId: quizId as Id<"quizzes">,
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
