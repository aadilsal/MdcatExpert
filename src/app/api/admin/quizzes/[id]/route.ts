import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { requireAdminApi } from "@/lib/require-admin-api";
import { formatUserError } from "@/lib/format-user-error";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const body = (await request.json()) as {
      title?: string;
      year?: number;
      is_premium?: boolean;
    };

    const patch: {
      quizId: Id<"quizzes">;
      title?: string;
      year?: number;
      isPremium?: boolean;
    } = { quizId: id as Id<"quizzes"> };

    if (typeof body.title === "string") patch.title = body.title;
    if (typeof body.year === "number") patch.year = body.year;
    if (typeof body.is_premium === "boolean") patch.isPremium = body.is_premium;

    await fetchMutation(api.quizzes.updateQuizMetadata, patch, { token: auth.token });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin quiz PATCH:", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to update quiz.") },
      { status: 500 },
    );
  }
}
