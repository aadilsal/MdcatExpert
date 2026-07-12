import { query } from "./_generated/server";

export const getWeeklyLeaderboard = query({
  handler: async (ctx) => {
    // 7 days ago timestamp
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Fetch all attempts in the last 7 days
    const recentAttempts = await ctx.db
      .query("attempts")
      .collect();

    const weeklyAttempts = recentAttempts.filter((a) => a.createdAt >= oneWeekAgo);

    // Group stats by userId
    const userStatsMap = new Map<string, { correct: number; total: number }>();

    for (const attempt of weeklyAttempts) {
      const uId = String(attempt.userId);
      const existing = userStatsMap.get(uId) || { correct: 0, total: 0 };
      
      const attemptTotal = (attempt.correctAnswers || 0) + (attempt.wrongAnswers || 0);
      
      userStatsMap.set(uId, {
        correct: existing.correct + (attempt.correctAnswers || 0),
        total: existing.total + attemptTotal,
      });
    }

    // Convert map to list and fetch names
    const leaderboardEntries = [];
    for (const [userIdStr, stats] of userStatsMap.entries()) {
      try {
        const user = await ctx.db.get(ctx.db.normalizeId("users", userIdStr)!);
        if (!user) continue;

        const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

        leaderboardEntries.push({
          name: user.name || "MDCAT Aspirant",
          correctCount: stats.correct,
          totalCount: stats.total,
          accuracy,
          isPremium: user.subscriptionType === "premium",
        });
      } catch (e) {
        console.error("Error loading user for leaderboard:", e);
      }
    }

    // Sort by correct count descending
    leaderboardEntries.sort((a, b) => b.correctCount - a.correctCount);

    // Return top 10
    return leaderboardEntries.slice(0, 10);
  },
});
