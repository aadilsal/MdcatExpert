"use server";

import { createClient } from "@/lib/supabase/server";
import { analyzeMistake } from "@/lib/ai/analyzer";
import { revalidatePath } from "next/cache";

/**
 * Generates and saves AI analysis for a specific answer if it doesn't already exist.
 */
export async function generateAnswerInsight(answerId: string) {
    const supabase = await createClient();

    // 1. Fetch the answer with question and options
    const { data: answer, error: fetchError } = await supabase
        .from("attempt_answers")
        .select(`
            *,
            questions (
                question_text,
                subject,
                options (*)
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
    const selectedOption = question.options.find((o: any) => o.id === answer.selected_option_id)?.option_text || "Unknown";
    const correctOption = question.options.find((o: any) => o.is_correct)?.option_text || "Unknown";

    // 4. Call Gemini
    const insight = await analyzeMistake({
        question_text: question.question_text,
        subject: question.subject,
        selected_option: selectedOption,
        correct_option: correctOption
    });

    // 5. Store the result
    const { error: updateError } = await supabase
        .from("attempt_answers")
        .update({ ai_analysis: insight })
        .eq("id", answerId);

    if (updateError) {
        console.error("Failed to cache AI insight:", updateError);
    }

    return insight;
}
