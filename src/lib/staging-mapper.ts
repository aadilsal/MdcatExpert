import type { Doc } from "../../convex/_generated/dataModel";

export function stagingQuestionToApi(q: Doc<"stagingQuestions">) {
  return {
    id: q._id,
    question_text: q.questionText,
    option_a: q.optionA,
    option_b: q.optionB,
    option_c: q.optionC,
    option_d: q.optionD,
    correct_option: q.correctOption,
    subject: q.subject,
    explanation: q.explanation ?? "",
    year: q.year ?? 0,
    image_url: q.imageUrl ?? null,
    status: q.status,
  };
}

const VALID_SUBJECTS = ["Biology", "Chemistry", "Physics", "English", "General"] as const;

export function parseStagingPatchBody(body: Record<string, unknown>) {
  const patch: {
    questionText?: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    correctOption?: "A" | "B" | "C" | "D";
    subject?: (typeof VALID_SUBJECTS)[number];
    explanation?: string;
    imageUrl?: string;
    status?: "pending" | "approved" | "rejected";
  } = {};

  if (typeof body.question_text === "string") patch.questionText = body.question_text;
  if (typeof body.option_a === "string") patch.optionA = body.option_a;
  if (typeof body.option_b === "string") patch.optionB = body.option_b;
  if (typeof body.option_c === "string") patch.optionC = body.option_c;
  if (typeof body.option_d === "string") patch.optionD = body.option_d;
  if (typeof body.correct_option === "string") {
    const c = body.correct_option.toUpperCase();
    if (["A", "B", "C", "D"].includes(c)) {
      patch.correctOption = c as "A" | "B" | "C" | "D";
    }
  }
  if (typeof body.subject === "string" && VALID_SUBJECTS.includes(body.subject as (typeof VALID_SUBJECTS)[number])) {
    patch.subject = body.subject as (typeof VALID_SUBJECTS)[number];
  }
  if (typeof body.explanation === "string") patch.explanation = body.explanation;
  if (typeof body.imageUrl === "string") patch.imageUrl = body.imageUrl;
  if (typeof body.image_url === "string") patch.imageUrl = body.image_url;
  if (body.status === "pending" || body.status === "approved" || body.status === "rejected") {
    patch.status = body.status;
  }

  return patch;
}
