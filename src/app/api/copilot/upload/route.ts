import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { formatUserError } from "@/lib/format-user-error";

export async function POST(request: Request) {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        title?: string;
        subject?: string;
        rawText?: string;
      };
      if (!body.rawText?.trim() || !body.title?.trim()) {
        return NextResponse.json({ error: "Title and text content required." }, { status: 400 });
      }

      const sourceId = await fetchMutation(
        api.studySources.createStudentUpload,
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
        },
        { token },
      );

      return NextResponse.json({ success: true, sourceId });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || file?.name || "Untitled";
    const subject = (formData.get("subject") as string) || undefined;

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
      const body = await uploadResp.text();
      return NextResponse.json({ error: `Upload failed: ${body}` }, { status: uploadResp.status });
    }

    const { storageId } = (await uploadResp.json()) as { storageId: Id<"_storage"> };

    const sourceId = await fetchMutation(
      api.studySources.createStudentUpload,
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
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
      },
      { token },
    );

    return NextResponse.json({ success: true, sourceId });
  } catch (error) {
    console.error("Copilot upload error", error);
    const message = formatUserError(error, "Upload failed.");
    const status = message.includes("limit") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
