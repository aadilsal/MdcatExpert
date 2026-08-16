import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internalQuery, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { Resend as ResendAPI } from "resend";
import { emailShell } from "./lib/emailShell";

const DIGEST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
// Guards against a re-run within the same week (e.g. an overlapping cron
// retry) sending a second digest — well under the 7-day cadence so the
// following week's real send is never blocked by this.
const RESEND_GUARD_MS = 6 * 24 * 60 * 60 * 1000;
const MAX_ITEMS_PER_KIND = 50;
const MAX_TITLES_SHOWN = 5;

type ContentSummary = {
  quizTitles: string[];
  quizCount: number;
  sourceTitles: string[];
  sourceCount: number;
};

export const getRecentContentSummary = internalQuery({
  args: {},
  handler: async (ctx): Promise<ContentSummary> => {
    const since = Date.now() - DIGEST_WINDOW_MS;

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", since))
      .order("desc")
      .take(MAX_ITEMS_PER_KIND);

    const sources = (
      await ctx.db
        .query("studySources")
        .withIndex("by_createdAt", (q) => q.gte("createdAt", since))
        .order("desc")
        .take(MAX_ITEMS_PER_KIND)
    ).filter((s) => s.ownerType === "platform" && s.isPublished && s.status === "ready");

    return {
      quizTitles: quizzes.slice(0, MAX_TITLES_SHOWN).map((q) => `${q.title} (${q.subject} ${q.year})`),
      quizCount: quizzes.length,
      sourceTitles: sources.slice(0, MAX_TITLES_SHOWN).map((s) => s.title),
      sourceCount: sources.length,
    };
  },
});

export const listUsersPage = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db.query("users").paginate(args.paginationOpts);
  },
});

export const markDigestSent = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { lastWeeklyDigestSentAt: Date.now() });
  },
});

function bulletList(items: string[], overflowCount: number): string {
  const shown = items.map((t) => `<li>${t}</li>`).join("");
  const more = overflowCount > 0 ? `<li>+ ${overflowCount} more</li>` : "";
  return `<ul>${shown}${more}</ul>`;
}

function getWeeklyDigestEmailHtml(name: string | undefined, summary: ContentSummary): string {
  const sections: string[] = [];
  if (summary.quizCount > 0) {
    sections.push(
      `<p><strong>${summary.quizCount} new quiz${summary.quizCount === 1 ? "" : "zes"}:</strong></p>` +
        bulletList(summary.quizTitles, summary.quizCount - summary.quizTitles.length),
    );
  }
  if (summary.sourceCount > 0) {
    sections.push(
      `<p><strong>${summary.sourceCount} new library reference${summary.sourceCount === 1 ? "" : "s"}:</strong></p>` +
        bulletList(summary.sourceTitles, summary.sourceCount - summary.sourceTitles.length),
    );
  }

  return emailShell({
    previewTitle: "This week on MdcatXpert",
    heading: "What's new this week 📬",
    bodyHtml: `
      <p>Hi${name ? ` ${name}` : ""},</p>
      <p>Here's what landed on MdcatXpert this week:</p>
      ${sections.join("")}
      <div class="cta-box"><a class="cta-button" href="https://mdcatxpert.com/quizzes">Keep Practicing</a></div>
      <p style="font-size: 12px; color: #6b7280;">Not interested in this weekly recap? Turn it off anytime from your Profile.</p>
    `,
  });
}

export const sendWeeklyDigest = internalAction({
  args: {},
  handler: async (ctx) => {
    const summary: ContentSummary = await ctx.runQuery(internal.weeklyDigest.getRecentContentSummary, {});

    // Nothing new this week — skip the whole run rather than mail an empty recap.
    if (summary.quizCount === 0 && summary.sourceCount === 0) return null;

    const apiKey = process.env.AUTH_RESEND_KEY;
    const from = process.env.RESEND_FROM_EMAIL ?? "MdcatXpert <onboarding@resend.dev>";
    if (!apiKey) {
      console.error("[weeklyDigest] AUTH_RESEND_KEY not set — skipping run.");
      return null;
    }
    const resend = new ResendAPI(apiKey);
    const now = Date.now();

    let cursor: string | null = null;
    let isDone = false;
    while (!isDone) {
      const result: { page: Doc<"users">[]; isDone: boolean; continueCursor: string } = await ctx.runQuery(
        internal.weeklyDigest.listUsersPage,
        { paginationOpts: { numItems: 200, cursor } },
      );
      isDone = result.isDone;
      cursor = result.continueCursor;

      for (const u of result.page) {
        if (!u.email) continue;
        if ((u.emailNotificationsEnabled ?? true) === false) continue;
        if (u.lastWeeklyDigestSentAt && now - u.lastWeeklyDigestSentAt < RESEND_GUARD_MS) continue;

        const html = getWeeklyDigestEmailHtml(u.name, summary);
        const { error } = await resend.emails.send({
          from,
          to: [u.email],
          subject: "This week on MdcatXpert 📬",
          text: `Hi${u.name ? ` ${u.name}` : ""}, ${summary.quizCount} new quizzes and ${summary.sourceCount} new library references landed this week. Practice now: https://mdcatxpert.com/quizzes`,
          html,
        });
        if (error) {
          console.error(`[weeklyDigest] send failed for ${u.email}:`, error);
          continue;
        }
        await ctx.runMutation(internal.weeklyDigest.markDigestSent, { userId: u._id });
      }
    }
    return null;
  },
});
