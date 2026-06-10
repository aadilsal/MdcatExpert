"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, type ActionCtx } from "./_generated/server";
import { chunkPdfPages, chunkPlainText, type TextChunk } from "./lib/chunker";
import { ocrPdfPageViaApp } from "./lib/ocrClient";

const PAGES_PER_OCR_BATCH = 6;
const MIN_CHARS_PER_PAGE = 80;
const MAX_OCR_PAGES = 400;

function compactCharCount(text: string): number {
  return text.replace(/\s/g, "").length;
}

function pdfTextLooksSufficient(text: string, pageCount: number): boolean {
  const chars = compactCharCount(text);
  if (chars < 200) return false;
  return chars / Math.max(pageCount, 1) >= MIN_CHARS_PER_PAGE;
}

async function saveChunks(
  ctx: ActionCtx,
  sourceId: Id<"studySources">,
  source: { subject?: string; ownerType: "platform" | "user" },
  chunks: TextChunk[],
) {
  await ctx.runMutation(internal.documentChunks.deleteBySourceId, { sourceId });

  const batchSize = 20;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const slice = chunks.slice(i, i + batchSize);
    await ctx.runMutation(internal.documentChunks.insertBatch, {
      chunks: slice.map((chunk, idx) => ({
        sourceId,
        chunkIndex: i + idx,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        pageNumber: chunk.pageNumber,
        sectionTitle: chunk.sectionTitle,
        subject: source.subject,
        ownerType: source.ownerType,
      })),
    });
  }

  await ctx.runMutation(internal.studySources.internalPatchSource, {
    sourceId,
    status: "ready",
    chunkCount: chunks.length,
    errorMessage: undefined,
  });
}

async function markFailed(ctx: ActionCtx, sourceId: Id<"studySources">, message: string) {
  await ctx.runMutation(internal.studySources.internalPatchSource, {
    sourceId,
    status: "failed",
    errorMessage: message,
  });
}

export const ingestSource = internalAction({
  args: { sourceId: v.id("studySources") },
  handler: async (ctx, { sourceId }) => {
    const source = await ctx.runQuery(internal.studySources.internalGetSource, { sourceId });
    if (!source) return;

    try {
      await ctx.runMutation(internal.documentChunks.deleteBySourceId, { sourceId });
      await ctx.runMutation(internal.ocrPageTexts.deleteBySourceId, { sourceId });
      await ctx.runMutation(internal.studySources.internalPatchSource, {
        sourceId,
        status: "processing",
        chunkCount: undefined,
        errorMessage: undefined,
      });

      let chunks: TextChunk[] = [];

      if (source.rawText?.trim()) {
        chunks = chunkPlainText(source.rawText);
      } else if (source.storageId) {
        const blob = await ctx.storage.get(source.storageId);
        if (!blob) throw new Error("File not found in storage");
        const buffer = Buffer.from(await blob.arrayBuffer());
        const contentType = source.contentType ?? "";

        if (contentType.includes("pdf") || source.title.toLowerCase().endsWith(".pdf")) {
          const pdfParse = (await import("pdf-parse")).default as (
            buf: Buffer,
          ) => Promise<{ text: string; numpages: number }>;
          const parsed = await pdfParse(buffer);
          const pageCount = parsed.numpages;

          await ctx.runMutation(internal.studySources.internalPatchSource, {
            sourceId,
            pageCount,
          });

          if (pdfTextLooksSufficient(parsed.text, pageCount)) {
            const pageTexts: { text: string; pageNumber: number }[] = [];
            const perPage = parsed.text.split("\f");
            if (perPage.length > 1) {
              perPage.forEach((t, i) => pageTexts.push({ text: t, pageNumber: i + 1 }));
            } else {
              pageTexts.push({ text: parsed.text, pageNumber: 1 });
            }
            chunks = chunkPdfPages(pageTexts);
          } else {
            if (!process.env.SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL) {
              throw new Error(
                "This PDF appears to be scanned/image-based. Set SITE_URL in Convex (your Vercel app URL) to enable OCR.",
              );
            }

            const ocrPageCount = Math.min(pageCount, MAX_OCR_PAGES);
            await ctx.scheduler.runAfter(0, internal.ingestDocument.processOcrBatch, {
              sourceId,
              startPage: 1,
              pageCount: ocrPageCount,
            });
            return;
          }
        } else if (
          contentType.includes("word") ||
          contentType.includes("docx") ||
          source.title.toLowerCase().endsWith(".docx")
        ) {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer });
          chunks = chunkPlainText(result.value);
        } else if (contentType.includes("text") || source.title.toLowerCase().endsWith(".txt")) {
          chunks = chunkPlainText(buffer.toString("utf-8"));
        } else {
          throw new Error(`Unsupported file type: ${contentType || "unknown"}`);
        }
      } else {
        throw new Error("No content to ingest");
      }

      if (chunks.length === 0) {
        throw new Error("No text could be extracted from this document");
      }

      await saveChunks(ctx, sourceId, source, chunks);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ingestion failed";
      await markFailed(ctx, sourceId, message);
    }
  },
});

export const processOcrBatch = internalAction({
  args: {
    sourceId: v.id("studySources"),
    startPage: v.number(),
    pageCount: v.number(),
  },
  handler: async (ctx, { sourceId, startPage, pageCount }) => {
    const source = await ctx.runQuery(internal.studySources.internalGetSource, { sourceId });
    if (!source?.storageId) return;

    try {
      const pdfUrl = await ctx.storage.getUrl(source.storageId);
      if (!pdfUrl) throw new Error("Could not get PDF URL from storage");

      const endPage = Math.min(startPage + PAGES_PER_OCR_BATCH - 1, pageCount);

      for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
        const text = await ocrPdfPageViaApp(pageNumber, pdfUrl);
        const usable = text.trim().length > 0 && text.trim() !== "[BLANK]";
        if (usable) {
          await ctx.runMutation(internal.ocrPageTexts.insertPage, {
            sourceId,
            pageNumber,
            text,
          });
        }
      }

      if (endPage < pageCount) {
        await ctx.scheduler.runAfter(500, internal.ingestDocument.processOcrBatch, {
          sourceId,
          startPage: endPage + 1,
          pageCount,
        });
        return;
      }

      await ctx.scheduler.runAfter(0, internal.ingestDocument.finalizeOcrIngest, { sourceId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "OCR batch failed";
      await markFailed(ctx, sourceId, message);
    }
  },
});

export const finalizeOcrIngest = internalAction({
  args: { sourceId: v.id("studySources") },
  handler: async (ctx, { sourceId }) => {
    const source = await ctx.runQuery(internal.studySources.internalGetSource, { sourceId });
    if (!source) return;

    try {
      const pages = await ctx.runQuery(internal.ocrPageTexts.listBySourceId, { sourceId });
      if (pages.length === 0) {
        throw new Error("OCR completed but no text was extracted from any page");
      }

      const chunks = chunkPdfPages(
        pages.map((page: { text: string; pageNumber: number }) => ({
          text: page.text,
          pageNumber: page.pageNumber,
        })),
      );

      if (chunks.length === 0) {
        throw new Error("OCR text could not be chunked for search");
      }

      await saveChunks(ctx, sourceId, source, chunks);
      await ctx.runMutation(internal.ocrPageTexts.deleteBySourceId, { sourceId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "OCR finalize failed";
      await markFailed(ctx, sourceId, message);
    }
  },
});
