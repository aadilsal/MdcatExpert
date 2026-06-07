import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";
import { formatUserError } from "@/lib/format-user-error";
import { generateBlogDraft } from "@/lib/ai/blog-writer";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as { subject?: string };
    if (!body.subject?.trim()) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured." },
        { status: 503 },
      );
    }

    const draft = await generateBlogDraft(body.subject.trim());
    return NextResponse.json({ draft });
  } catch (error) {
    console.error("admin blog generate:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to generate blog draft.") },
      { status: 500 },
    );
  }
}
