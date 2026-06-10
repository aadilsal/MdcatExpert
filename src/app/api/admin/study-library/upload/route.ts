import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { formatUserError } from "@/lib/format-user-error";
import { requireAdminApi } from "@/lib/require-admin-api";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;
    const { token } = auth;

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        title?: string;
        subject?: string;
        classLevel?: string;
        chapter?: string;
        rawText?: string;
        sourceKind?: "admin_upload" | "ai_summary" | "pctb_textbook";
      };
      if (!body.rawText?.trim() || !body.title?.trim()) {
        return NextResponse.json({ error: "Title and text required." }, { status: 400 });
      }

      const sourceId = await fetchMutation(
        api.studySources.createPlatformSource,
        {
          rawText: body.rawText,
          title: body.title,
          subject: body.subject as
            | "Biology"
            | "Chemistry"
            | "Physics"
            | "English"
            | "General"
            | undefined,
          classLevel: body.classLevel,
          chapter: body.chapter,
          sourceKind: body.sourceKind ?? "ai_summary",
        },
        { token },
      );
      return NextResponse.json({ success: true, sourceId });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || file?.name || "Untitled";
    const subject = (formData.get("subject") as string) || undefined;
    const classLevel = (formData.get("classLevel") as string) || undefined;
    const chapter = (formData.get("chapter") as string) || undefined;
    const sourceKind =
      (formData.get("sourceKind") as "admin_upload" | "pctb_textbook") || "admin_upload";

    if (!file?.name) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const uploadUrl = await fetchMutation(api.files.generateUploadUrl, {}, { token });
    const uploadResp = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!uploadResp.ok) {
      return NextResponse.json({ error: "Storage upload failed." }, { status: 500 });
    }

    const { storageId } = (await uploadResp.json()) as { storageId: Id<"_storage"> };

    const sourceId = await fetchMutation(
      api.studySources.createPlatformSource,
      {
        storageId,
        title,
        subject: subject as
          | "Biology"
          | "Chemistry"
          | "Physics"
          | "English"
          | "General"
          | undefined,
        classLevel,
        chapter,
        sourceKind,
        contentType: file.type,
        fileSize: file.size,
      },
      { token },
    );

    return NextResponse.json({ success: true, sourceId });
  } catch (error) {
    console.error("Admin study library upload error", error);
    return NextResponse.json(
      { error: formatUserError(error, "Upload failed.") },
      { status: 500 },
    );
  }
}
