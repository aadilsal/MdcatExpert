/** Number of quizzes free-tier users can start without premium. */
export const FREE_QUIZ_UNLOCK_LIMIT = 5;

export type QuizCatalogEntry = {
  _id: string;
  year: number;
  title: string;
};

/** Same ordering as the preparation library (newest year first, then title). */
export function sortQuizzesForCatalog<T extends QuizCatalogEntry>(quizzes: T[]): T[] {
  return [...quizzes].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return a.title.localeCompare(b.title);
  });
}

/** Quiz ids available on the free plan (first {@link FREE_QUIZ_UNLOCK_LIMIT} in catalog order). */
export function getFreeUnlockedQuizIds(quizzes: QuizCatalogEntry[]): Set<string> {
  const sorted = sortQuizzesForCatalog(quizzes);
  return new Set(
    sorted.slice(0, FREE_QUIZ_UNLOCK_LIMIT).map((q) => String(q._id)),
  );
}

export function isActivePremiumUser(
  user: { subscriptionType?: string | null; premiumUntil?: number | null } | null | undefined,
): boolean {
  if (!user) return false;
  if ((user.subscriptionType ?? "free") !== "premium") return false;
  if (user.premiumUntil != null && user.premiumUntil <= Date.now()) return false;
  return true;
}

export function canAccessQuiz(
  quizId: string,
  quizzes: QuizCatalogEntry[],
  isPremium: boolean,
): boolean {
  if (isPremium) return true;
  return getFreeUnlockedQuizIds(quizzes).has(String(quizId));
}

export function isQuizLockedForUser(
  quizId: string,
  quizzes: QuizCatalogEntry[],
  isPremium: boolean,
): boolean {
  return !canAccessQuiz(quizId, quizzes, isPremium);
}
