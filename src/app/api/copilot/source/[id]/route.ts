import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { formatUserError } from "@/lib/format-user-error";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await fetchMutation(
      api.studySources.deleteSource,
      { sourceId: id as Id<"studySources"> },
      { token },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: formatUserError(error, "Delete failed.") },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await fetchMutation(
      api.studySources.reindexSource,
      { sourceId: id as Id<"studySources"> },
      { token },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: formatUserError(error, "Re-index failed.") },
      { status: 500 },
    );
  }
}
