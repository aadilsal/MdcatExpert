import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const TEST_PROMOS: readonly { code: string; description: string; maxUses: number }[] = [
    { code: "TESTFREE", description: "QA / local testing — premium signup", maxUses: 500 },
    { code: "BETA2026", description: "Closed beta cohort", maxUses: 100 },
    { code: "MDCATDEV", description: "Developer machines", maxUses: 9999 },
    { code: "STUDENT10", description: "Tiny invite list (10 redemptions)", maxUses: 10 },
];

/**
 * Inserts test rows into `promoCodes` (skips codes that already exist).
 * Uses the first admin user as `createdBy` (required by schema).
 *
 * Run (after deploying this function, e.g. `pnpm convex:dev`):
 *   pnpm convex:seed-promos
 *   # or: npx convex run seed:seedTestPromoCodes
 */
export const seedTestPromoCodes = internalMutation({
    args: {},
    handler: async (ctx) => {
        const admin = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .first();

        if (!admin) {
            throw new Error(
                "No admin user found. Create an admin account first, then run this seed again.",
            );
        }

        const created: string[] = [];
        const skipped: string[] = [];
        const now = Date.now();

        for (const row of TEST_PROMOS) {
            const code = row.code.toUpperCase();
            const existing = await ctx.db
                .query("promoCodes")
                .withIndex("by_code", (q) => q.eq("code", code))
                .first();

            if (existing) {
                skipped.push(code);
                continue;
            }

            await ctx.db.insert("promoCodes", {
                code,
                description: row.description,
                maxUses: row.maxUses,
                usedCount: 0,
                isActive: true,
                createdBy: admin._id,
                createdAt: now,
            });
            created.push(code);
        }

        return { created, skipped };
    },
});
