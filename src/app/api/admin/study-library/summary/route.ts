import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";
import { formatUserError } from "@/lib/format-user-error";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as {
      subject?: string;
      chapter?: string;
      topic?: string;
    };

    const subject = body.subject?.trim() || "Biology";
    const chapter = body.chapter?.trim() || "General";
    const topic = body.topic?.trim() || chapter;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You write high-yield MDCAT Pakistan study summaries. Accurate, concise, exam-focused. Output markdown only.",
        },
        {
          role: "user",
          content: `Write a high-yield MDCAT summary for:
Subject: ${subject}
Chapter: ${chapter}
Topic: ${topic}

Include: key definitions, formulas (if any), common MCQ traps, and a 5-point revision checklist.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const content = completion.choices[0]?.message?.content?.trim() || "";
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Summary generation error", error);
    return NextResponse.json(
      { error: formatUserError(error, "Summary generation failed.") },
      { status: 500 },
    );
  }
}
