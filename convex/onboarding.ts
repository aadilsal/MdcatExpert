import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, internalMutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

/** Called by the onboarding tour once the user finishes or skips it. */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.patch(userId, { onboardingCompleted: true });
    return true;
  },
});

/**
 * One-time backfill so the forced tour only ever shows for genuinely new
 * signups, not the existing user base at rollout time. Run once from the
 * Convex dashboard (Functions -> onboarding:backfillExistingUsers -> Run)
 * or `npx convex run onboarding:backfillExistingUsers`.
 */
export const backfillExistingUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    let updated = 0;
    // Bounded batches per the Convex query guidelines (no .collect() on an
    // unbounded table) — re-run this function until it reports 0 updated.
    const users = await ctx.db.query("users").take(500);
    for (const user of users) {
      if (user.onboardingCompleted === undefined) {
        await ctx.db.patch(user._id, { onboardingCompleted: true });
        updated++;
      }
    }
    return { updated, scanned: users.length };
  },
});

/** Admin-triggerable wrapper so it's reachable from the app, not just the CLI. */
export const runBackfillAsAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    let updated = 0;
    const users = await ctx.db.query("users").take(500);
    for (const user of users) {
      if (user.onboardingCompleted === undefined) {
        await ctx.db.patch(user._id, { onboardingCompleted: true });
        updated++;
      }
    }
    return { updated, scanned: users.length };
  },
});
