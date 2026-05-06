import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export async function POST(request: Request) {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("fileType") as string) || "image";

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

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

    const saved = await fetchMutation(
      api.files.saveUploadedFile,
      {
        storageId,
        userId: me._id,
        fileType,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
      },
      { token },
    );

    return NextResponse.json({ publicUrl: saved.url, storageId: saved.storageId, fileId: saved.fileId });
  } catch (error) {
    console.error("Image upload API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}