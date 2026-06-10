export type TextChunk = {
  text: string;
  tokenCount: number;
  pageNumber?: number;
  sectionTitle?: string;
};

const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitIntoWindows(text: string, pageNumber?: number, sectionTitle?: string): TextChunk[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: TextChunk[] = [];
  const wordsPerChunk = Math.floor(CHUNK_SIZE * 0.75);
  const overlapWords = Math.floor(CHUNK_OVERLAP * 0.75);
  let i = 0;

  while (i < words.length) {
    const slice = words.slice(i, i + wordsPerChunk).join(" ");
    chunks.push({
      text: slice,
      tokenCount: estimateTokens(slice),
      pageNumber,
      sectionTitle,
    });
    if (i + wordsPerChunk >= words.length) break;
    i += wordsPerChunk - overlapWords;
  }

  return chunks;
}

export function chunkPlainText(text: string): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const sections = normalized.split(/\n(?=#{1,3}\s|\n[A-Z][^\n]{0,60}\n)/);
  const chunks: TextChunk[] = [];

  for (const section of sections) {
    const headingMatch = section.match(/^(#{1,3}\s.+|[A-Z][^\n]{0,60})\n/);
    const sectionTitle = headingMatch?.[1]?.replace(/^#+\s*/, "").trim();
    const body = headingMatch ? section.slice(headingMatch[0].length) : section;
    chunks.push(...splitIntoWindows(body.trim(), undefined, sectionTitle));
  }

  return chunks.length > 0 ? chunks : splitIntoWindows(normalized);
}

export function chunkPdfPages(pages: { text: string; pageNumber: number }[]): TextChunk[] {
  const chunks: TextChunk[] = [];
  for (const page of pages) {
    const text = page.text.trim();
    if (!text) continue;
    chunks.push(...splitIntoWindows(text, page.pageNumber));
  }
  return chunks;
}
