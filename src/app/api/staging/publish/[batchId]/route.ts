import { NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { requireAdminApi } from "@/lib/require-admin-api";
import { formatUserError } from "@/lib/format-user-error";
import { sendEmailNotification } from "@/lib/resend";
import { getNewQuizEmailHtml } from "@/lib/email-templates";

const VALID_SUBJECTS = ["Biology", "Chemistry", "Physics", "English", "General"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { batchId } = await params;
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const year = Number(body.year);
    const subject = body.subject;
    const isPremium = Boolean(body.isPremium);

    if (!title) {
      return NextResponse.json({ error: "Quiz title is required." }, { status: 400 });
    }
    if (!Number.isInteger(year) || year <= 0) {
      return NextResponse.json({ error: "Valid year is required." }, { status: 400 });
    }
    if (!VALID_SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: "Invalid subject." }, { status: 400 });
    }

    const result = await fetchMutation(
      api.staging.publishStagingBatch,
      {
        batchId,
        title,
        year,
        subject,
        isPremium,
      },
      { token: auth.token },
    );

    // Dispatch notifications in background without blocking response
    try {
      const users = await fetchQuery(api.users.listUsers, {}, { token: auth.token });
      const activeUsers = (users ?? []).filter(
        (u) => u.email && (u.emailNotificationsEnabled ?? true) !== false
      );

      void Promise.allSettled(
        activeUsers.map(async (u) => {
          const html = getNewQuizEmailHtml(
            u.name || "Student",
            title,
            subject,
            year,
            result.questionCount,
            result.quizId
          );
          await sendEmailNotification({
            to: u.email!,
            subject: `New MDCAT Quiz Available: ${title} 📚`,
            text: `Hello ${u.name || "Student"},\n\nA new practice quiz has been added to MDCAT Xpert: "${title}" (${year} - ${subject}, ${result.questionCount} questions). Log in now to practice!`,
            html,
          });
        })
      );
    } catch (emailErr) {
      console.error("Failed to notify users about new quiz:", emailErr);
    }

    return NextResponse.json({
      success: true,
      quizId: result.quizId,
      questionCount: result.questionCount,
    });
  } catch (error) {
    console.error("staging publish error:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to publish quiz.") },
      { status: 500 },
    );
  }
}
