type OcrPageResult = {
  text: string;
  pageNumber: number;
};

export async function ocrPdfPageViaApp(pageNumber: number, pdfUrl: string): Promise<string> {
  const siteUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.INGEST_OCR_SECRET;

  if (!siteUrl) {
    throw new Error(
      "SITE_URL must be set in Convex (e.g. https://mdcatxpert.com). For local dev, expose localhost via ngrok and set that URL.",
    );
  }
  if (!secret) {
    throw new Error("INGEST_OCR_SECRET must be set in Convex and Next.js for OCR");
  }

  const endpoint = `${siteUrl.replace(/\/$/, "")}/api/copilot/ocr-page`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pdfUrl, pageNumber }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OCR page failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as OcrPageResult;
  return payload.text;
}
