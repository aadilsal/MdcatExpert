export type PracticeQuestionSeed = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  subject: "Biology" | "Chemistry" | "Physics" | "English" | "General";
  explanation?: string;
};
