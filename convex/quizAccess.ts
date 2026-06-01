import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

/** Keep in sync with `src/lib/quiz-access.ts`. */
export const FREE_QUIZ_UNLOCK_LIMIT = 5;

type QuizRow = Pick<Doc<"quizzes">, "_id" | "year" | "title">;

export function sortQuizzesForCatalog(quizzes: QuizRow[]): QuizRow[] {
  return [...quizzes].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return a.title.localeCompare(b.title);
  });
}

export function getFreeUnlockedQuizIds(quizzes: QuizRow[]): Set<Id<"quizzes">> {
  const sorted = sortQuizzesForCatalog(quizzes);
  return new Set(sorted.slice(0, FREE_QUIZ_UNLOCK_LIMIT).map((q) => q._id));
}

export function isActivePremiumUser(
  user: Pick<Doc<"users">, "subscriptionType" | "premiumUntil"> | null,
): boolean {
  if (!user) return false;
  if ((user.subscriptionType ?? "free") !== "premium") return false;
  if (user.premiumUntil != null && user.premiumUntil <= Date.now()) return false;
  return true;
}

export async function assertCanAccessQuiz(ctx: QueryCtx, quizId: Id<"quizzes">) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const profile = await ctx.db.get(userId);
  if (!profile) {
    throw new Error("Unauthorized");
  }
  if (profile.role === "admin") {
    return;
  }
  if (isActivePremiumUser(profile)) {
    return;
  }

  const allQuizzes = await ctx.db.query("quizzes").collect();
  if (getFreeUnlockedQuizIds(allQuizzes).has(quizId)) {
    return;
  }

  const priorAttempt = await ctx.db
    .query("attempts")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("quizId"), quizId))
    .first();
  if (priorAttempt) {
    return;
  }

  throw new Error("Premium required");
}
