import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { requireAdminApi } from "@/lib/require-admin-api";
import { parseStagingPatchBody } from "@/lib/staging-mapper";
import { formatUserError } from "@/lib/format-user-error";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const patch = parseStagingPatchBody(body);
    const resolveReports = body.resolve_reports !== false;

    const { status: _s, ...fields } = patch;
    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    await fetchMutation(
      api.quizzes.updatePublishedQuestion,
      {
        questionId: id as Id<"questions">,
        ...fields,
        resolveReports,
      },
      { token: auth.token },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin question PATCH:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to update question.") },
      { status: 500 },
    );
  }
}
