import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export interface BlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let lastRequestTime = 0;
const MIN_REQUEST_GAP = 500;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateBlogDraft(
  subject: string,
  retryCount = 0,
): Promise<BlogDraft> {
  try {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < MIN_REQUEST_GAP) {
      await sleep(MIN_REQUEST_GAP - timeSinceLast);
    }
    lastRequestTime = Date.now();

    const prompt = `
Write a comprehensive, SEO-optimized blog article for MdcatXpert — a MDCAT preparation platform for students in Pakistan.

TOPIC/SUBJECT: "${subject}"

Requirements:
- Target Pakistani MDCAT aspirants (PMC syllabus, Biology, Chemistry, Physics, English)
- 900–1400 words in STRICT Markdown format:
  - Use ## for each main section heading (on its own line)
  - Use ### for subsections (on its own line)
  - Put a blank line before and after every heading, paragraph, and list
  - Use "- " at the start of each bullet line (one bullet per line, never inline with * in paragraphs)
  - Use **bold** for emphasis inside sentences
- Practical, accurate study advice — no fabricated exam dates unless commonly known
- Mention MdcatXpert naturally once as a tool for practice quizzes and analytics
- Include sections: Introduction, syllabus overview, key subjects, study plan, time management, tips, conclusion

Example list format (CORRECT):
## Key Subjects
- **Biology**: Cell biology, genetics, and physiology
- **Chemistry**: Organic and inorganic chemistry

Example list format (WRONG — do NOT do this):
Key Subjects * Biology: ... * Chemistry: ...

Respond ONLY with valid JSON containing these fields:
- title: compelling H1 title (max 70 chars)
- slug: URL-friendly slug (lowercase, hyphens)
- excerpt: 1–2 sentence summary (max 160 chars)
- content: full article in Markdown
- metaTitle: SEO title (max 60 chars)
- metaDescription: SEO meta description (max 155 chars)
- tags: array of 3–6 lowercase tags (e.g. "biology", "mdcat-2026", "study-tips")
    `.trim();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert MDCAT educator and SEO content writer for Pakistan. Respond ONLY with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const text = chatCompletion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text) as Partial<BlogDraft>;

    const title = String(parsed.title ?? subject).trim();
    const rawContent = String(parsed.content ?? "").trim();
    return {
      title,
      slug: slugify(String(parsed.slug ?? title)),
      excerpt: String(parsed.excerpt ?? "").trim(),
      content: rawContent,
      metaTitle: String(parsed.metaTitle ?? title).trim(),
      metaDescription: String(parsed.metaDescription ?? parsed.excerpt ?? "").trim(),
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean)
        : [],
    };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string } | null;
    if (
      (err?.status === 429 || err?.message?.includes("429")) &&
      retryCount < 3
    ) {
      const backoff = Math.pow(2, retryCount) * 2000;
      await sleep(backoff);
      return generateBlogDraft(subject, retryCount + 1);
    }
    throw error;
  }
}
