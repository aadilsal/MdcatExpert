import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { requireAdminApi } from "@/lib/require-admin-api";
import { stagingQuestionToApi } from "@/lib/staging-mapper";
import { formatUserError } from "@/lib/format-user-error";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { batchId } = await params;
    const rows = await fetchQuery(
      api.staging.getStagingQuestions,
      { batchId },
      { token: auth.token },
    );

    return NextResponse.json({
      questions: rows.map(stagingQuestionToApi),
    });
  } catch (error) {
    console.error("staging GET error:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to load staging questions.") },
      { status: 500 },
    );
  }
}
