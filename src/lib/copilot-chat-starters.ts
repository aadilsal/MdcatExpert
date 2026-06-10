import type { CopilotMode } from "@/lib/copilot-access";

export type CopilotChatStarters = {
  welcomeMessage: string;
  suggestions: string[];
};

export const COPILOT_CHAT_STARTERS: Record<CopilotMode, CopilotChatStarters> = {
  explain: {
    welcomeMessage:
      "Welcome to Study Copilot! I've loaded your selected materials and I'm ready to explain any topic step-by-step — with citations from your textbooks and notes. Pick a question below or type your own.",
    suggestions: [
      "Explain the main concepts from my selected sources",
      "Break down the hardest topic in simple terms",
      "What are the key definitions I need to memorize?",
      "Summarize this chapter for MDCAT revision",
    ],
  },
  exam: {
    welcomeMessage:
      "Welcome! I'm in Exam Angle mode — I'll focus on how topics show up in MDCAT MCQs, common traps, and high-yield facts from your materials. Try one of these to get started.",
    suggestions: [
      "What MCQ traps appear on this topic?",
      "List the highest-yield facts for the exam",
      "How is this topic usually tested in MDCAT?",
      "What distractors should I watch out for?",
    ],
  },
  quiz: {
    welcomeMessage:
      "Welcome! Quiz Me mode is active — I'll generate MDCAT-style MCQs based only on your selected sources. Pick a prompt below to start practicing.",
    suggestions: [
      "Quiz me on the first chapter",
      "Give me 5 MCQs on the hardest concepts",
      "Test me on definitions and terminology",
      "Create a mixed difficulty quiz from my materials",
    ],
  },
  flashcards: {
    welcomeMessage:
      "Welcome! Flashcards mode — I'll build quick question/answer pairs from your sources for rapid revision. Choose a starter or ask for cards on any topic.",
    suggestions: [
      "Make flashcards from the introduction",
      "Create cards for all key terms and definitions",
      "Flashcards on formulas and numerical values",
      "Quick review cards for exam day",
    ],
  },
  revise: {
    welcomeMessage:
      "Welcome! Revise mode — I'll build a concise revision outline from your materials, ordered for a focused study session. Pick a suggestion or tell me what to review.",
    suggestions: [
      "Give me a 20-minute revision outline",
      "Bullet-point summary of the main topics",
      "What are the must-know points before the exam?",
      "Create a last-minute cram sheet from my sources",
    ],
  },
};

export function getCopilotChatStarters(mode: string): CopilotChatStarters {
  const key = mode as CopilotMode;
  return COPILOT_CHAT_STARTERS[key] ?? COPILOT_CHAT_STARTERS.explain;
}

/** Fallback follow-ups when the model omits suggestions or on resumed chats. */
export function getCopilotFollowUpSuggestions(mode: string): string[] {
  return getCopilotChatStarters(mode).suggestions.slice(0, 4);
}
