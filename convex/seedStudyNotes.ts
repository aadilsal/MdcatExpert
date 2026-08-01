import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { STUDY_NOTES_SEED } from "./studyNoteSeeds/notes1";

/**
 * Loads original chapter-summary notes into the platform study library for
 * the Study Copilot to cite. Inserted UNPUBLISHED (isPublished: false) so
 * an admin can review the generated content in the admin library view
 * before making it visible to students — flip isPublished to true (or use
 * the existing admin library UI) once approved.
 *
 * Text content is chunked and indexed automatically by the existing
 * ingestDocument.ingestSource action (scheduled below) — no OCR needed
 * since this is plain text, not a PDF.
 *
 * Run: npx convex run seedStudyNotes:seedStudyNotes
 */
export const seedStudyNotes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const created: string[] = [];
    const skipped: string[] = [];
    const now = Date.now();

    for (const note of STUDY_NOTES_SEED) {
      const existing = await ctx.db
        .query("studySources")
        .withIndex("by_ownerType", (q) => q.eq("ownerType", "platform"))
        .collect();
      if (existing.some((e) => e.title === note.title)) {
        skipped.push(note.title);
        continue;
      }

      const sourceId = await ctx.db.insert("studySources", {
        ownerType: "platform",
        rawText: note.rawText,
        title: note.title,
        subject: note.subject,
        chapter: note.chapter,
        sourceKind: "ai_summary",
        status: "processing",
        isPremiumOnly: false,
        isPublished: false,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.scheduler.runAfter(0, internal.ingestDocument.ingestSource, { sourceId });
      created.push(note.title);
    }

    return {
      total: STUDY_NOTES_SEED.length,
      created: created.length,
      skipped: skipped.length,
    };
  },
});
