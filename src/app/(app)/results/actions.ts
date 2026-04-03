"use server";

import { createClient } from "@/lib/supabase/server";
import { analyzeMistake } from "@/lib/ai/analyzer";
import { revalidatePath } from "next/cache";

/**
 * Generates and saves AI analysis for a specific answer if it doesn't already exist.
 */
export async function generateAnswerInsight(answerId: string) {
    const supabase = await createClient();

    // 1. Fetch the answer with question data
    const { data: answer, error: fetchError } = await supabase
        .from("user_answers")
        .select(`
            *,
            questions (
                question_text,
                subject,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option
            )
        `)
        .eq("id", answerId)
        .single();

    if (fetchError || !answer) {
        throw new Error("Answer not found");
    }

    // 2. If already analyzed, return it
    if (answer.ai_analysis) {
        return answer.ai_analysis;
    }

    // 3. Only analyze incorrect answers
    if (answer.is_correct) {
        return null;
    }

    const question = answer.questions;
    if (!question) {
        throw new Error("Question data not found");
    }

    // Map selected option to text
    const optionMap: Record<string, string> = {
        'A': question.option_a,
        'B': question.option_b,
        'C': question.option_c,
        'D': question.option_d
    };

    const selectedOption = optionMap[answer.selected_option] || "Unknown";
    const correctOption = optionMap[question.correct_option] || "Unknown";

    // 4. Call Gemini
    const insight = await analyzeMistake({
        question_text: question.question_text,
        subject: question.subject,
        selected_option: selectedOption,
        correct_option: correctOption
    });

    // 5. Store the result
    const { error: updateError } = await supabase
        .from("user_answers")
        .update({ ai_analysis: insight })
        .eq("id", answerId);

    if (updateError) {
        console.error("Failed to cache AI insight:", updateError);
    }

    return insight;
}
