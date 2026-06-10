import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

type PctbImportResult =
  | { title: string; status: "failed"; error: string }
  | { title: string; status: "skipped"; sourceId: Id<"studySources">; reason: "already_exists" }
  | {
      title: string;
      status: "imported";
      sourceId: Id<"studySources">;
      skipped: boolean;
      bytes: number;
      sourceUrl: string;
    };

const ALLOWED_HOSTS = [
  "pctb.punjab.gov.pk",
  "taleem360.com",
  "drive.google.com",
  "drive.usercontent.google.com",
];

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/pdf,*/*",
};

const PCTB_MANIFEST = [
  {
    title: "Biology Class 11",
    subject: "Biology" as const,
    classLevel: "11",
    urls: [
      "https://www.taleem360.com/download/11th-class-biology-new-punjab-textbook-2025-pectaa",
      "https://drive.google.com/uc?id=1BQCZjOBaiXd5grUF3arJ3kuFHLBqM6CT&export=download",
    ],
  },
  {
    title: "Biology Class 12",
    subject: "Biology" as const,
    classLevel: "12",
    urls: [
      "https://www.taleem360.com/download/12th-fsc-part-2-biology-text-book-in-pdf-by-punjab-board-kw7",
      "https://drive.google.com/uc?id=1wNYadE7JDoXp5tKry4PnFDtDIRVaKu8k&export=download",
    ],
  },
  {
    title: "Chemistry Class 11",
    subject: "Chemistry" as const,
    classLevel: "11",
    urls: [
      "https://www.taleem360.com/download/11th-class-chemistry-pectaa-snc-punjab-text-book-pdf",
      "https://drive.google.com/uc?id=1c-IhchAT237BQrxr6rsAMiIi7pzR8EGY&export=download",
    ],
  },
  {
    title: "Chemistry Class 12",
    subject: "Chemistry" as const,
    classLevel: "12",
    urls: [
      "https://www.taleem360.com/download/12th-fsc-part-2-chemistry-text-book-in-pdf-by-punjab-board-4nf",
      "https://drive.google.com/uc?id=1YwKiV0WOElIUCYQEauey9_GzI5WrcDYB&export=download",
    ],
  },
  {
    title: "Physics Class 11",
    subject: "Physics" as const,
    classLevel: "11",
    urls: [
      "https://www.taleem360.com/download/1st-year-physics-new-snc-textbook-2025-pdf-pectaa",
      "https://drive.google.com/uc?id=1InuHCtEZ6EqI_4G8WpoEMTVnJTbH2rbQ&export=download",
    ],
  },
  {
    title: "Physics Class 12",
    subject: "Physics" as const,
    classLevel: "12",
    urls: [
      "https://www.taleem360.com/download/second-year-12th-class-physics-text-book-in-pdf-by-punjab-board-nzi",
      "https://drive.google.com/uc?id=1iGp4X7Dm4z2J4-9IV-nT-0VJH0tx-RbC&export=download",
    ],
  },
  {
    title: "English Class 11",
    subject: "English" as const,
    classLevel: "11",
    urls: [
      "https://www.taleem360.com/download/1st-year-english-pectaa-punjab-textbook-2025-pdf",
      "https://drive.google.com/uc?id=1G-oOHRlqqPPkRamlOinM18569zgGdOPV&export=download",
    ],
  },
  {
    title: "English Class 12",
    subject: "English" as const,
    classLevel: "12",
    urls: [
      "https://www.taleem360.com/download/12th-class-english-new-text-book-2026-27-pdf-pectaa",
      "https://drive.google.com/uc?id=17QgXX6gXx0Ws-G0kjEDzN1NVqYWLPS5W&export=download",
    ],
  },
];

function assertAllowedUrl(url: string) {
  const parsed = new URL(url);
  if (!ALLOWED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) {
    throw new Error(`URL host not allowed: ${parsed.hostname}`);
  }
}

const subjectValidator = v.union(
  v.literal("Biology"),
  v.literal("Chemistry"),
  v.literal("Physics"),
  v.literal("English"),
);

async function downloadPdf(urls: string[]) {
  const errors: string[] = [];

  for (const url of urls) {
    assertAllowedUrl(url);
    try {
      const response = await fetch(url, {
        headers: FETCH_HEADERS,
        redirect: "follow",
      });

      if (!response.ok) {
        errors.push(`HTTP ${response.status} for ${url}`);
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "application/pdf";
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 10_000) {
        errors.push(`File too small (${buffer.byteLength} bytes) from ${url}`);
        continue;
      }

      return { buffer, contentType, sourceUrl: url };
    } catch (err) {
      errors.push(`${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(errors.join("; ") || "No URLs provided");
}

export const findPctbSourceByTitle = internalQuery({
  args: { title: v.string() },
  handler: async (ctx, { title }) => {
    const sources = await ctx.db
      .query("studySources")
      .withIndex("by_sourceKind", (q) => q.eq("sourceKind", "pctb_textbook"))
      .collect();
    return sources.find((s) => s.title === title) ?? null;
  },
});

export const generateSeedUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const insertPlatformSourceInternal = internalMutation({
  args: {
    storageId: v.id("_storage"),
    title: v.string(),
    subject: subjectValidator,
    classLevel: v.string(),
    fileSize: v.number(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const pctbSources = await ctx.db
      .query("studySources")
      .withIndex("by_sourceKind", (q) => q.eq("sourceKind", "pctb_textbook"))
      .collect();
    const existing = pctbSources.find((s) => s.title === args.title) ?? null;
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
    const sourceId = await ctx.db.insert("studySources", {
      ownerType: "platform",
      storageId: args.storageId,
      title: args.title,
      subject: args.subject,
      classLevel: args.classLevel,
      sourceKind: "pctb_textbook",
      status: "processing",
      isPremiumOnly: false,
      isPublished: true,
      contentType: args.contentType,
      fileSize: args.fileSize,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.ingestDocument.ingestSource, { sourceId });
    return { sourceId, skipped: false as const };
  },
});

export const importPctbBook = internalAction({
  args: {
    urls: v.optional(v.array(v.string())),
    url: v.optional(v.string()),
    title: v.string(),
    subject: subjectValidator,
    classLevel: v.string(),
  },
  handler: async (ctx, { urls, url, title, subject, classLevel }): Promise<PctbImportResult> => {
    const downloadUrls = urls ?? (url ? [url] : []);
    if (downloadUrls.length === 0) {
      return { title, status: "failed" as const, error: "No download URLs provided" };
    }

    const existing = await ctx.runQuery(internal.seedLibrary.findPctbSourceByTitle, { title });
    if (existing && existing.status !== "failed") {
      return { title, status: "skipped" as const, sourceId: existing._id, reason: "already_exists" };
    }

    try {
      const { buffer, contentType, sourceUrl } = await downloadPdf(downloadUrls);
      const storageId = await ctx.storage.store(new Blob([buffer], { type: contentType }));
      const inserted = await ctx.runMutation(internal.seedLibrary.insertPlatformSourceInternal, {
        storageId,
        title,
        subject,
        classLevel,
        fileSize: buffer.byteLength,
        contentType,
      });

      return {
        title,
        status: "imported" as const,
        sourceId: inserted.sourceId,
        skipped: inserted.skipped,
        bytes: buffer.byteLength,
        sourceUrl,
      };
    } catch (err) {
      return {
        title,
        status: "failed" as const,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});

/** Import all PCTB FSc textbooks from the official manifest (staggered). */
export const seedAllPctbBooks = internalAction({
  args: {},
  handler: async (ctx) => {
    const scheduled: { title: string; delayMs: number }[] = [];

    for (let i = 0; i < PCTB_MANIFEST.length; i++) {
      const book = PCTB_MANIFEST[i];
      const delayMs = i * 15_000;
      await ctx.scheduler.runAfter(delayMs, internal.seedLibrary.importPctbBook, book);
      scheduled.push({ title: book.title, delayMs });
    }

    return {
      total: PCTB_MANIFEST.length,
      scheduled,
      message: "Imports scheduled. Check Admin → Study Library for processing status.",
    };
  },
});

/** Import all books sequentially in one run (use for manual CLI seed). */
export const seedAllPctbBooksNow = internalAction({
  args: {},
  handler: async (ctx): Promise<PctbImportResult[]> => {
    const results: PctbImportResult[] = [];
    for (const book of PCTB_MANIFEST) {
      const result: PctbImportResult = await ctx.runAction(
        internal.seedLibrary.importPctbBook,
        book,
      );
      results.push(result);
    }
    return results;
  },
});
