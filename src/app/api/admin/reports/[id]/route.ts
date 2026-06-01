import { NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { requireAdminApi } from "@/lib/require-admin-api";
import { formatUserError } from "@/lib/format-user-error";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const data = await fetchQuery(
      api.questionReports.getReportById,
      { reportId: id as Id<"questionReports"> },
      { token: auth.token },
    );

    if (!data?.report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const { report, question, quiz } = data;
    return NextResponse.json({
      report: {
        id: report._id,
        user_email: report.userEmail,
        quiz_id: report.quizId,
        quiz_title: report.quizTitle,
        question_id: report.questionId,
        question_order: report.questionOrder,
        category: report.category,
        comment: report.comment ?? null,
        status: report.status,
      },
      question: question
        ? {
            id: question._id,
            question_text: question.questionText,
            option_a: question.optionA,
            option_b: question.optionB,
            option_c: question.optionC,
            option_d: question.optionD,
            correct_option: question.correctOption,
            subject: question.subject,
            explanation: question.explanation ?? "",
            image_url: question.imageUrl ?? null,
          }
        : null,
      quiz: quiz
        ? { id: quiz._id, title: quiz.title, year: quiz.year }
        : null,
    });
  } catch (error) {
    console.error("admin report GET:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to load report.") },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const body = (await request.json()) as { action?: string; admin_note?: string };
    const action = body.action;

    if (action === "resolve") {
      await fetchMutation(
        api.questionReports.resolveReport,
        {
          reportId: id as Id<"questionReports">,
          adminNote: body.admin_note,
        },
        { token: auth.token },
      );
    } else if (action === "dismiss") {
      await fetchMutation(
        api.questionReports.dismissReport,
        {
          reportId: id as Id<"questionReports">,
          adminNote: body.admin_note,
        },
        { token: auth.token },
      );
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin report PATCH:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to update report.") },
      { status: 500 },
    );
  }
}
