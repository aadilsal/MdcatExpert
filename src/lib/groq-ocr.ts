import Groq from "groq-sdk";

const OCR_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const OCR_PROMPT =
  "Extract all readable text from this textbook page image. Preserve headings, paragraphs, bullet points, equations, and labels. Output only the extracted text with no commentary. If the page is blank or illegible, output exactly [BLANK].";

export function isOcrTextUsable(text: string): boolean {
  const normalized = text.trim();
  return normalized.length > 0 && normalized !== "[BLANK]";
}

export async function ocrPageWithGroq(jpegBuffer: Buffer, pageNumber: number): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required for OCR on scanned PDFs");
  }

  const groq = new Groq({ apiKey });
  const base64 = jpegBuffer.toString("base64");

  const completion = await groq.chat.completions.create({
    model: OCR_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: `${OCR_PROMPT}\n\nPage number: ${pageNumber}` },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64}` },
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}
