import Groq from "groq-sdk";
import type { CopilotMode } from "@/lib/copilot-access";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

let lastRequestTime = 0;
const MIN_REQUEST_GAP = 500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type RetrievedChunk = {
  chunkId: string;
  text: string;
  pageNumber?: number;
  sectionTitle?: string;
  sourceTitle: string;
  sourceKind: string;
  score: number;
};

export type CopilotCitation = {
  chunkId: string;
  excerpt: string;
  pageNumber?: number;
  sourceTitle: string;
  sourceKind: string;
};

export type CopilotResponse = {
  answer: string;
  citations: CopilotCitation[];
  followUpSuggestions: string[];
};

function normalizeFollowUpSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/\*\*/g, "").replace(/^#+\s*/, "").trim())
    .filter((item) => item.length > 0 && item.length <= 120)
    .slice(0, 4);
}

const MODE_INSTRUCTIONS: Record<CopilotMode, string> = {
  explain:
    "Explain the concept clearly and step-by-step for an MDCAT student. Use simple language with exam-relevant detail.",
  exam: "Focus on how this topic appears in MDCAT MCQs. Mention common traps, distractors, and high-yield facts.",
  quiz: "Generate 3-5 MDCAT-style MCQs with options A-D and mark the correct answer. Base questions ONLY on the provided context.",
  flashcards: "Create 5-8 flashcard pairs (Question / Answer format) from the context for rapid revision.",
  revise: "Create a concise revision outline with bullet points ordered for a 20-minute review session.",
};

function buildContextBlock(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => {
      const page = c.pageNumber ? `, p.${c.pageNumber}` : "";
      return `[Source ${i + 1}: ${c.sourceTitle} (${c.sourceKind})${page}]\n${c.text}`;
    })
    .join("\n\n---\n\n");
}

export async function generateCopilotResponse(
  mode: CopilotMode,
  userMessage: string,
  chunks: RetrievedChunk[],
  retryCount = 0,
): Promise<CopilotResponse> {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_GAP) {
    await sleep(MIN_REQUEST_GAP - timeSinceLast);
  }
  lastRequestTime = Date.now();

  if (chunks.length === 0) {
    return {
      answer:
        "I could not find relevant information in your selected materials. Try selecting different sources or rephrasing your question.",
      citations: [],
      followUpSuggestions: [],
    };
  }

  const context = buildContextBlock(chunks);
  const prompt = `You are an elite MDCAT (Pakistan Medical College Admission Test) tutor.

MODE: ${MODE_INSTRUCTIONS[mode]}

STRICT RULES:
- Answer ONLY using the CONTEXT below. Do not invent facts.
- Stay at MDCAT syllabus level (FSc pre-medical).
- If the context does not contain enough information, say so clearly.
- Reference sources by number when making claims.

CONTEXT:
${context}

STUDENT QUESTION:
${userMessage}

Respond as JSON with exactly:
{
  "answer": "your full response in markdown",
  "citationIndexes": [1, 2],
  "followUpSuggestions": ["question 1", "question 2", "question 3"]
}

citationIndexes lists which [Source N] numbers you used (1-based).
followUpSuggestions: exactly 3 short plain-text questions the student might ask next (no markdown, under 80 chars each).`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are an MDCAT expert tutor. Respond ONLY with valid JSON." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text) as {
      answer?: string;
      citationIndexes?: number[];
      followUpSuggestions?: unknown;
    };

    const indexes = (parsed.citationIndexes ?? []).filter(
      (i) => i >= 1 && i <= chunks.length,
    );
    const usedChunks = indexes.length > 0 ? indexes.map((i) => chunks[i - 1]) : chunks.slice(0, 2);

    const citations: CopilotCitation[] = usedChunks.map((c) => ({
      chunkId: c.chunkId,
      excerpt: c.text.slice(0, 200) + (c.text.length > 200 ? "…" : ""),
      pageNumber: c.pageNumber,
      sourceTitle: c.sourceTitle,
      sourceKind: c.sourceKind,
    }));

    return {
      answer: parsed.answer || "I could not generate a response. Please try again.",
      citations,
      followUpSuggestions: normalizeFollowUpSuggestions(parsed.followUpSuggestions),
    };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string } | null;
    if (((err?.status === 429) || err?.message?.includes("429")) && retryCount < 3) {
      const backoff = Math.pow(2, retryCount) * 2000;
      await sleep(backoff);
      return generateCopilotResponse(mode, userMessage, chunks, retryCount + 1);
    }
    throw error;
  }
}
