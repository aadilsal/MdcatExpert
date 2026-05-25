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

    if (patch.status) {
      await fetchMutation(
        api.staging.updateStagingQuestionStatus,
        {
          stagingQuestionId: id as Id<"stagingQuestions">,
          status: patch.status,
          reviewReason:
            patch.status === "rejected" ? "Rejected during review" : undefined,
        },
        { token: auth.token },
      );
      delete patch.status;
    }

    const { status: _s, ...fields } = patch;
    if (Object.keys(fields).length > 0) {
      await fetchMutation(
        api.staging.updateStagingQuestion,
        {
          stagingQuestionId: id as Id<"stagingQuestions">,
          ...fields,
        },
        { token: auth.token },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("staging PATCH error:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to update question.") },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    await fetchMutation(
      api.staging.deleteStagingQuestion,
      { stagingQuestionId: id as Id<"stagingQuestions"> },
      { token: auth.token },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("staging DELETE error:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to delete question.") },
      { status: 500 },
    );
  }
}
