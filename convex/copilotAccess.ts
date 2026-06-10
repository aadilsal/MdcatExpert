import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { isActivePremiumUser } from "./quizAccess";

/** Keep in sync with `src/lib/copilot-access.ts`. */
export const FREE_COPILOT_UPLOAD_LIMIT = 3;
export const FREE_COPILOT_DAILY_MESSAGE_LIMIT = 10;
export const FREE_COPILOT_MODES = ["explain"] as const;

export type CopilotMode = "explain" | "exam" | "quiz" | "flashcards" | "revise";

export function getKarachiDateKey(now = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

export function getCopilotLimits(user: Pick<Doc<"users">, "subscriptionType" | "premiumUntil"> | null) {
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

async function getProfile(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const profile = await ctx.db.get(userId);
  if (!profile) throw new Error("Unauthorized");
  return { userId, profile };
}

export async function countStudentUploads(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const uploads = await ctx.db
    .query("studySources")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();
  return uploads.filter((s) => s.sourceKind === "student_upload").length;
}

export async function assertCanUpload(ctx: MutationCtx) {
  const { userId, profile } = await getProfile(ctx);
  if (isActivePremiumUser(profile)) return { userId, profile };

  const count = await countStudentUploads(ctx, userId);
  if (count >= FREE_COPILOT_UPLOAD_LIMIT) {
    throw new Error("Upload limit reached");
  }
  return { userId, profile };
}

export async function assertChatModeAllowed(ctx: MutationCtx, mode: CopilotMode) {
  const { userId, profile } = await getProfile(ctx);
  if (isActivePremiumUser(profile)) return { userId, profile };
  if (!FREE_COPILOT_MODES.includes(mode as (typeof FREE_COPILOT_MODES)[number])) {
    throw new Error("Premium required for this chat mode");
  }
  return { userId, profile };
}

export async function assertCanSendMessage(ctx: MutationCtx) {
  const { userId, profile } = await getProfile(ctx);
  if (isActivePremiumUser(profile)) return { userId, profile, messageCount: 0 };

  const dateKey = getKarachiDateKey();
  const usage = await ctx.db
    .query("copilotDailyUsage")
    .withIndex("by_userId_dateKey", (q) => q.eq("userId", userId).eq("dateKey", dateKey))
    .unique();

  const messageCount = usage?.messageCount ?? 0;
  if (messageCount >= FREE_COPILOT_DAILY_MESSAGE_LIMIT) {
    throw new Error("Daily message limit reached");
  }
  return { userId, profile, messageCount };
}

export async function incrementDailyMessageCount(ctx: MutationCtx, userId: Id<"users">) {
  const profile = await ctx.db.get(userId);
  if (!profile || isActivePremiumUser(profile)) return;

  const dateKey = getKarachiDateKey();
  const usage = await ctx.db
    .query("copilotDailyUsage")
    .withIndex("by_userId_dateKey", (q) => q.eq("userId", userId).eq("dateKey", dateKey))
    .unique();

  if (usage) {
    await ctx.db.patch(usage._id, { messageCount: usage.messageCount + 1 });
  } else {
    await ctx.db.insert("copilotDailyUsage", { userId, dateKey, messageCount: 1 });
  }
}

export async function getDailyMessageCount(ctx: QueryCtx, userId: Id<"users">) {
  const dateKey = getKarachiDateKey();
  const usage = await ctx.db
    .query("copilotDailyUsage")
    .withIndex("by_userId_dateKey", (q) => q.eq("userId", userId).eq("dateKey", dateKey))
    .unique();
  return usage?.messageCount ?? 0;
}
