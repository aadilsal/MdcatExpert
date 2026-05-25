import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<{
  userId: Id<"users">;
}> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "admin") throw new Error("Forbidden");
  return { userId };
}
