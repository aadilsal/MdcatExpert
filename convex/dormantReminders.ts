import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internalQuery, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { Resend as ResendAPI } from "resend";
import { emailShell } from "./lib/emailShell";

// No activity (login or signup) in this window counts as dormant.
const DORMANT_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;

function getDormantReminderEmailHtml(name: string | undefined): string {
  return emailShell({
    previewTitle: "We miss you at MdcatXpert",
    heading: "Your MDCAT prep is waiting ⏰",
    bodyHtml: `
      <p>Hi${name ? ` ${name}` : ""},</p>
      <p>It's been a couple of weeks since you last practiced on MdcatXpert. Every day off is a day your competitors are pulling ahead — jump back in with a quick quiz.</p>
      <div class="cta-box"><a class="cta-button" href="https://mdcatxpert.com/quizzes">Resume Practice</a></div>
      <p style="font-size: 12px; color: #6b7280;">Not interested in these nudges? Turn them off anytime from your Profile.</p>
    `,
  });
}

export const listUsersPage = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db.query("users").paginate(args.paginationOpts);
  },
});

export const markDormantReminderSent = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { dormantReminderSentAt: Date.now() });
  },
});

export const sendDormantReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.AUTH_RESEND_KEY;
    const from = process.env.RESEND_FROM_EMAIL ?? "MdcatXpert <onboarding@resend.dev>";
    if (!apiKey) {
      console.error("[dormantReminders] AUTH_RESEND_KEY not set — skipping run.");
      return null;
    }
    const resend = new ResendAPI(apiKey);
    const now = Date.now();

    let cursor: string | null = null;
    let isDone = false;
    while (!isDone) {
      const result: { page: Doc<"users">[]; isDone: boolean; continueCursor: string } = await ctx.runQuery(
        internal.dormantReminders.listUsersPage,
        { paginationOpts: { numItems: 200, cursor } },
      );
      isDone = result.isDone;
      cursor = result.continueCursor;

      for (const u of result.page) {
        if (!u.email) continue;
        if ((u.emailNotificationsEnabled ?? true) === false) continue;

        const lastActive = u.lastLoginAt ?? u.createdAt ?? 0;
        if (now - lastActive <= DORMANT_THRESHOLD_MS) continue;

        // Only once per dormancy episode — they'd have to log back in
        // (pushing lastActive past dormantReminderSentAt) before we remind again.
        if (u.dormantReminderSentAt && u.dormantReminderSentAt >= lastActive) continue;

        const html = getDormantReminderEmailHtml(u.name);
        const { error } = await resend.emails.send({
          from,
          to: [u.email],
          subject: "We miss you at MdcatXpert 👋",
          text: `Hi${u.name ? ` ${u.name}` : ""}, it's been a while since you practiced on MdcatXpert. Resume anytime: https://mdcatxpert.com/quizzes`,
          html,
        });
        if (error) {
          console.error(`[dormantReminders] send failed for ${u.email}:`, error);
          continue;
        }
        await ctx.runMutation(internal.dormantReminders.markDormantReminderSent, { userId: u._id });
      }
    }
    return null;
  },
});
