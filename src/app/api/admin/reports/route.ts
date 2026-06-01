import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { requireAdminApi } from "@/lib/require-admin-api";
import { formatUserError } from "@/lib/format-user-error";

export async function GET(request: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "open";
    if (status !== "open" && status !== "resolved" && status !== "dismissed") {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const [reports, openCount] = await Promise.all([
      fetchQuery(
        api.questionReports.listReportsByStatus,
        { status },
        { token: auth.token },
      ),
      fetchQuery(api.questionReports.countOpenReports, {}, { token: auth.token }),
    ]);

    return NextResponse.json({
      reports: (reports ?? []).map((r: {
        _id: string;
        userId: string;
        userEmail: string;
        quizId: string;
        quizTitle: string;
        questionId: string;
        questionOrder: number;
        category: string;
        comment?: string;
        status: string;
        adminNote?: string;
        createdAt: number;
        resolvedAt?: number;
      }) => ({
        id: r._id,
        user_id: r.userId,
        user_email: r.userEmail,
        quiz_id: r.quizId,
        quiz_title: r.quizTitle,
        question_id: r.questionId,
        question_order: r.questionOrder,
        category: r.category,
        comment: r.comment ?? null,
        status: r.status,
        admin_note: r.adminNote ?? null,
        created_at: new Date(r.createdAt).toISOString(),
        resolved_at: r.resolvedAt ? new Date(r.resolvedAt).toISOString() : null,
      })),
      openCount: openCount ?? 0,
    });
  } catch (error) {
    console.error("admin reports GET:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to load reports.") },
      { status: 500 },
    );
  }
}
