"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Securely submits a quiz.
 * Scoring happens in the database via RPC to prevent client-side tampering.
 */
export async function submitQuizAction(paperId: string, elapsedSeconds: number, answers: Record<string, string>) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized: You must be logged in to submit a quiz.");
    }

    // Call the PostgreSQL RPC function
    // This ensures:
    // 1. Scoring is done server-side based on the 'options' table.
    // 2. Both 'attempts' and 'attempt_answers' are inserted in a single atomic transaction.
    const { data: attemptId, error } = await supabase.rpc("submit_quiz_secure", {
        p_user_id: user.id,
        p_paper_id: paperId,
        p_time_taken: elapsedSeconds,
        p_answers: answers
    });

    if (error) {
        console.error("Submission RPC failed:", error);
        throw new Error(error.message || "Failed to submit quiz results.");
    }

    // Clear caches for dashboard and analytics
    revalidatePath("/dashboard");
    revalidatePath("/analytics");

    return { success: true, attemptId };
}
