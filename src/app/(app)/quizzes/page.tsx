import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { QuizzesCatalog } from "./quizzes-catalog";
import {
    FREE_QUIZ_UNLOCK_LIMIT,
    getFreeUnlockedQuizIds,
    isActivePremiumUser,
    sortQuizzesForCatalog,
} from "@/lib/quiz-access";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
    const token = await convexAuthNextjsToken();
    const user = token ? await fetchQuery(api.users.getCurrentUserProfile, {}, { token }) : null;
    const isPremiumUser = isActivePremiumUser(user);

    const quizzesList = await fetchQuery(api.quizzes.getQuizzes, {});
    const sortedQuizzes = sortQuizzesForCatalog((quizzesList ?? []) as Doc<"quizzes">[]);
    const unlockedQuizIds = [...getFreeUnlockedQuizIds(sortedQuizzes)];

    const attemptCounts: Record<string, number> = {};
    if (token && user?._id) {
        const attempts = await fetchQuery(api.attempts.getUserAttempts, { userId: user._id as Id<"users"> }, { token });
        (attempts ?? []).forEach((a) => {
            const qid = String(a.quizId);
            if (!qid) return;
            attemptCounts[qid] = (attemptCounts[qid] || 0) + 1;
        });
    }

    return (
        <div className="space-y-12 pb-20">
            <QuizzesCatalog
                sortedQuizzes={sortedQuizzes}
                attemptCounts={attemptCounts}
                isPremiumUser={isPremiumUser}
                unlockedQuizIds={unlockedQuizIds}
                freeUnlockLimit={FREE_QUIZ_UNLOCK_LIMIT}
            />
        </div>
    );
}
