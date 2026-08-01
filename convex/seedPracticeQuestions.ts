import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { PRACTICE_QUESTIONS_SEED } from "./questionSeeds/practiceSet1";

/**
 * Loads original MDCAT-syllabus practice questions into the staging queue
 * as "pending" — they do NOT go live automatically. An admin reviews and
 * approves each one (or a whole batch) from the existing staging review
 * flow in convex/staging.ts, same as OCR-ingested questions.
 *
 * Run: npx convex run seedPracticeQuestions:seedPracticeQuestions
 */
export const seedPracticeQuestions = internalMutation({
  args: {
    batchId: v.optional(v.string()),
  },
  handler: async (ctx, { batchId }) => {
    const resolvedBatchId = batchId ?? `original-practice-${new Date().toISOString().slice(0, 10)}`;

    const created: string[] = [];
    const skipped: string[] = [];

    for (const q of PRACTICE_QUESTIONS_SEED) {
      // Dedup by exact question text so re-running the script is safe.
      const existing = await ctx.db
        .query("stagingQuestions")
        .withIndex("by_batchId", (qq) => qq.eq("batchId", resolvedBatchId))
        .collect();
      if (existing.some((e) => e.questionText === q.questionText)) {
        skipped.push(q.questionText);
        continue;
      }

      await ctx.db.insert("stagingQuestions", {
        batchId: resolvedBatchId,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        subject: q.subject,
        explanation: q.explanation,
        status: "pending",
        createdAt: Date.now(),
      });
      created.push(q.questionText);
    }

    return {
      batchId: resolvedBatchId,
      total: PRACTICE_QUESTIONS_SEED.length,
      created: created.length,
      skipped: skipped.length,
    };
  },
});
