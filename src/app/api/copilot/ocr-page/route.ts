import { NextResponse } from "next/server";
import { ocrPageWithGroq } from "@/lib/groq-ocr";
import { renderPdfPageToJpeg } from "@/lib/pdf-render";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorize(request: Request): boolean {
  const secret = process.env.INGEST_OCR_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      pdfUrl?: string;
      pageNumber?: number;
    };

    if (!body.pdfUrl || !body.pageNumber || body.pageNumber < 1) {
      return NextResponse.json({ error: "pdfUrl and pageNumber required" }, { status: 400 });
    }

    const pdfResp = await fetch(body.pdfUrl);
    if (!pdfResp.ok) {
      return NextResponse.json({ error: "Failed to download PDF" }, { status: 502 });
    }

    const pdfBuffer = Buffer.from(await pdfResp.arrayBuffer());
    const jpeg = await renderPdfPageToJpeg(pdfBuffer, body.pageNumber);
    const text = await ocrPageWithGroq(jpeg, body.pageNumber);

    return NextResponse.json({
      pageNumber: body.pageNumber,
      text,
    });
  } catch (error) {
    console.error("OCR page error", error);
    const message = error instanceof Error ? error.message : "OCR page failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
