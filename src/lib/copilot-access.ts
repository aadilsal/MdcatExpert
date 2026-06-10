/** Keep in sync with `convex/copilotAccess.ts`. */
export const FREE_COPILOT_UPLOAD_LIMIT = 3;
export const FREE_COPILOT_DAILY_MESSAGE_LIMIT = 10;
export const FREE_COPILOT_MODES = ["explain"] as const;

export type CopilotMode = "explain" | "exam" | "quiz" | "flashcards" | "revise";

export const COPILOT_MODE_LABELS: Record<CopilotMode, string> = {
  explain: "Explain",
  exam: "Exam Angle",
  quiz: "Quiz Me",
  flashcards: "Flashcards",
  revise: "Revise",
};

export function isActivePremiumUser(
  user: { subscriptionType?: string | null; premiumUntil?: number | null } | null | undefined,
): boolean {
  if (!user) return false;
  if ((user.subscriptionType ?? "free") !== "premium") return false;
  if (user.premiumUntil != null && user.premiumUntil <= Date.now()) return false;
  return true;
}

export function getCopilotLimits(
  user: { subscriptionType?: string | null; premiumUntil?: number | null } | null | undefined,
) {
  const isPremium = isActivePremiumUser(user);
  return {
    isPremium,
    maxUploads: isPremium ? null : FREE_COPILOT_UPLOAD_LIMIT,
    maxMessagesPerDay: isPremium ? null : FREE_COPILOT_DAILY_MESSAGE_LIMIT,
    allowedModes: isPremium
      ? (["explain", "exam", "quiz", "flashcards", "revise"] as CopilotMode[])
      : ([...FREE_COPILOT_MODES] as CopilotMode[]),
  };
}

export function isCopilotModeLocked(
  mode: CopilotMode,
  user: { subscriptionType?: string | null; premiumUntil?: number | null } | null | undefined,
): boolean {
  const limits = getCopilotLimits(user);
  return !limits.allowedModes.includes(mode);
}
