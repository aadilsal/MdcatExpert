"use server";

import { analyzeMistake } from "@/lib/ai/analyzer";
import { revalidatePath } from "next/cache";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

/**
 * Generates and saves AI analysis for a specific answer if it doesn't already exist.
 */
export async function generateAnswerInsight(answerId: string) {
    const token = await convexAuthNextjsToken();
    if (!token) throw new Error("Unauthorized");

    const ua = await fetchQuery(
        api.userAnswers.getByIdWithQuestion,
        { userAnswerId: answerId as Id<"userAnswers"> },
        { token }
    );
    if (!ua) throw new Error("Answer not found");

    if (ua.aiAnalysis) return ua.aiAnalysis;
    if (ua.isCorrect) return null;

    const q = ua.question;
    if (!q) throw new Error("Question data not found");

    const optionMap: Record<string, string> = {
        A: q.optionA,
        B: q.optionB,
        C: q.optionC,
        D: q.optionD,
    };

    const selectedOption = optionMap[ua.selectedOption] || "Unknown";
    const correctOption = optionMap[q.correctOption] || "Unknown";

    // 4. Call Gemini
    const insight = await analyzeMistake({
        question_text: q.questionText,
        subject: q.subject,
        selected_option: selectedOption,
        correct_option: correctOption
    });

    await fetchMutation(
        api.attempts.setUserAnswerAiAnalysis,
        { userAnswerId: ua._id, aiAnalysis: insight },
        { token }
    );

    return insight;
}
