import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

/**
 * Seeds the Study Copilot library from OpenStax textbooks — CC-BY licensed,
 * legal to redistribute (unlike scraped commercial guide books). See
 * docs/blueprint.md and the growth-audit discussion for why this path was
 * chosen over bulk-scraping copyrighted MDCAT prep material.
 *
 * Ingests per chapter (one studySources row per URL below), not as one
 * monolithic PDF — see convex/ingestDocument.ts: the direct-PDF path runs
 * synchronously in a single action call with no batching, so a 1,000+ page
 * book risks the action's execution-time limit. Fetching each chapter's
 * HTML page as plain text sidesteps that entirely (uses chunkPlainText,
 * the same path admin-uploaded .txt/.docx notes already use) and gives
 * better citations ("Chapter 12: Genetics" vs. "page 640").
 *
 * The manifest below has a starter set of confirmed-working chapter URLs
 * (verified against the live site) — extend it via each book's own
 * "Contents" page at openstax.org, e.g. openstax.org/books/biology-2e/pages/1-1-the-science-of-biology
 * for more chapters. importOpenStaxChapter skips (not crashes) on a 404 so
 * a bad URL in the manifest doesn't block the rest of the batch.
 */

const ALLOWED_HOSTS = ["openstax.org"];

function assertAllowedUrl(url: string) {
  const parsed = new URL(url);
  if (!ALLOWED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) {
    throw new Error(`URL host not allowed: ${parsed.hostname}`);
  }
}

const subjectValidator = v.union(v.literal("Biology"), v.literal("Chemistry"), v.literal("Physics"));

type ManifestChapter = {
  title: string;
  url: string;
  /** First chapter of each subject is free (mirrors the 5-free-quizzes pattern); the rest are Elite-only. */
  isPremiumOnly: boolean;
};

type ManifestBook = {
  book: string;
  subject: "Biology" | "Chemistry" | "Physics";
  chapters: ManifestChapter[];
};

export const OPENSTAX_MANIFEST: ManifestBook[] = [
  {
    book: "Biology 2e",
    subject: "Biology",
    chapters: [
      { title: "Biology 2e — Ch. 1 Introduction", url: "https://openstax.org/books/biology-2e/pages/1-introduction", isPremiumOnly: false },
      { title: "Biology 2e — Ch. 2 The Chemical Foundation of Life", url: "https://openstax.org/books/biology-2e/pages/2-introduction", isPremiumOnly: true },
      { title: "Biology 2e — Ch. 3 Cell Structure and Function", url: "https://openstax.org/books/biology-2e/pages/3-introduction", isPremiumOnly: true },
    ],
  },
  {
    book: "Chemistry 2e",
    subject: "Chemistry",
    chapters: [
      { title: "Chemistry 2e — Ch. 1 Essential Ideas", url: "https://openstax.org/books/chemistry-2e/pages/1-introduction", isPremiumOnly: false },
      { title: "Chemistry 2e — Ch. 2 Atoms, Molecules, and Ions", url: "https://openstax.org/books/chemistry-2e/pages/2-introduction", isPremiumOnly: true },
    ],
  },
  {
    book: "College Physics 2e",
    subject: "Physics",
    chapters: [
      { title: "College Physics 2e — Ch. 1 Introduction: The Nature of Science and Physics", url: "https://openstax.org/books/college-physics-2e/pages/1-introduction-to-science-and-the-realm-of-physics-physical-quantities-and-units", isPremiumOnly: false },
    ],
  },
];

/** Strips an OpenStax page down to readable body text — drops nav/script/style noise. */
function htmlToPlainText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  text = text.replace(/<(h[1-6])[^>]*>/gi, "\n\n# ").replace(/<\/(h[1-6])>/gi, "\n");
  text = text.replace(/<p[^>]*>/gi, "\n\n").replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

const MIN_USABLE_CHARS = 500;

export const findOpenStaxSourceByTitle = internalQuery({
  args: { title: v.string() },
  handler: async (ctx, { title }) => {
    const sources = await ctx.db
      .query("studySources")
      .withIndex("by_sourceKind", (q) => q.eq("sourceKind", "openstax_textbook"))
      .collect();
    return sources.find((s) => s.title === title) ?? null;
  },
});

export const insertOpenStaxSourceInternal = internalMutation({
  args: {
    title: v.string(),
    subject: subjectValidator,
    rawText: v.string(),
    isPremiumOnly: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("studySources")
      .withIndex("by_sourceKind", (q) => q.eq("sourceKind", "openstax_textbook"))
      .collect()
      .then((rows) => rows.find((s) => s.title === args.title) ?? null);

    if (existing && existing.status !== "failed") {
      return { sourceId: existing._id, skipped: true as const };
    }
    if (existing?.status === "failed") {
      const chunks = await ctx.db
        .query("documentChunks")
        .withIndex("by_sourceId", (q) => q.eq("sourceId", existing._id))
        .collect();
      for (const chunk of chunks) await ctx.db.delete(chunk._id);
      await ctx.db.delete(existing._id);
    }

    const now = Date.now();
    const sourceId: Id<"studySources"> = await ctx.db.insert("studySources", {
      ownerType: "platform",
      rawText: args.rawText,
      title: args.title,
      subject: args.subject,
      sourceKind: "openstax_textbook",
      status: "processing",
      isPremiumOnly: args.isPremiumOnly,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.ingestDocument.ingestSource, { sourceId });
    return { sourceId, skipped: false as const };
  },
});

export const importOpenStaxChapter = internalAction({
  args: {
    title: v.string(),
    url: v.string(),
    subject: subjectValidator,
    isPremiumOnly: v.boolean(),
  },
  handler: async (
    ctx,
    { title, url, subject, isPremiumOnly },
  ): Promise<
    | { title: string; status: "skipped"; sourceId: Id<"studySources"> }
    | { title: string; status: "failed"; error: string }
    | { title: string; status: "imported"; sourceId: Id<"studySources">; skipped: boolean; chars: number }
  > => {
    assertAllowedUrl(url);

    const existing: Doc<"studySources"> | null = await ctx.runQuery(internal.seedOpenStax.findOpenStaxSourceByTitle, { title });
    if (existing && existing.status !== "failed") {
      return { title, status: "skipped" as const, sourceId: existing._id };
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      return { title, status: "failed" as const, error: `HTTP ${res.status} fetching ${url}` };
    }
    const html = await res.text();
    const text = htmlToPlainText(html);
    if (text.length < MIN_USABLE_CHARS) {
      return { title, status: "failed" as const, error: `Extracted text too short (${text.length} chars) — page layout may have changed` };
    }

    const inserted: { sourceId: Id<"studySources">; skipped: boolean } = await ctx.runMutation(internal.seedOpenStax.insertOpenStaxSourceInternal, {
      title,
      subject,
      rawText: text,
      isPremiumOnly,
    });
    return { title, status: "imported" as const, sourceId: inserted.sourceId, skipped: inserted.skipped, chars: text.length };
  },
});

/** Import every chapter in OPENSTAX_MANIFEST, staggered 10s apart to be polite to openstax.org. */
export const seedAllOpenStaxChapters = internalAction({
  args: {},
  handler: async (ctx) => {
    let i = 0;
    for (const book of OPENSTAX_MANIFEST) {
      for (const chapter of book.chapters) {
        await ctx.scheduler.runAfter(i * 10_000, internal.seedOpenStax.importOpenStaxChapter, {
          title: chapter.title,
          url: chapter.url,
          subject: book.subject,
          isPremiumOnly: chapter.isPremiumOnly,
        });
        i++;
      }
    }
    return { scheduled: i };
  },
});
