import { v } from "convex/values";
import { internalQuery, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { Resend as ResendAPI } from "resend";

// How many days before `premiumUntil` we send the "renew soon" nudge.
const REMINDER_WINDOW_DAYS = 3;
const REMINDER_WINDOW_MS = REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Email templates (same visual style as ResendOTPPasswordReset.ts)
// ---------------------------------------------------------------------------

function emailShell(opts: { heading: string; bodyHtml: string; previewTitle: string }): string {
  const accentColor = "#10b981"; // Emerald
  const textColor = "#1e293b";
  const bgColor = "#f8fafc";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${opts.previewTitle}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: ${bgColor};
            color: ${textColor};
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper { width: 100%; background-color: ${bgColor}; padding: 40px 20px; box-sizing: border-box; }
          .container {
            max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px;
            overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 40px 30px; text-align: center; border-bottom: 4px solid ${accentColor};
          }
          .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; font-style: italic; }
          .header h1 span { color: ${accentColor}; }
          .header p { color: #94a3b8; margin: 8px 0 0 0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.15em; }
          .content { padding: 40px 35px; font-size: 15px; line-height: 1.6; color: ${textColor}; }
          .content h2 { font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 20px; color: #0f172a; }
          .content p { margin-top: 0; margin-bottom: 20px; }
          .cta-box { text-align: center; margin: 30px 0; }
          .cta-button {
            display: inline-block; padding: 16px 40px; background-color: #0f172a; color: #ffffff !important;
            border-radius: 16px; font-weight: 800; text-decoration: none; font-size: 13px;
            text-transform: uppercase; letter-spacing: 0.1em;
          }
          .footer {
            background-color: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;
            font-size: 12px; color: #64748b;
          }
          .footer p { margin: 0 0 8px 0; }
          .footer a { color: #4f46e5; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>MDCAT<span>Xpert.</span></h1>
              <p>Pakistan's #1 AI MDCAT Prep Platform</p>
            </div>
            <div class="content">
              <h2>${opts.heading}</h2>
              ${opts.bodyHtml}
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MDCAT Xpert. All rights reserved.</p>
              <p><a href="https://mdcatxpert.com/upgrade">Manage Elite Premium</a> | <a href="https://mdcatxpert.com/dashboard">Go to Dashboard</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getExpiringSoonEmailHtml(name: string | undefined, premiumUntil: number): string {
  const dateStr = new Date(premiumUntil).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return emailShell({
    previewTitle: "Your MdcatXpert Elite access is expiring soon",
    heading: `Your Elite access ends ${dateStr} ⏳`,
    bodyHtml: `
      <p>Hi${name ? ` ${name}` : ""},</p>
      <p>Just a heads up — your MdcatXpert Elite Premium access ends on <strong>${dateStr}</strong>. We don't auto-renew, so nothing will be charged automatically. If you want to keep your premium quizzes, analytics, and Study Copilot access, renew before then.</p>
      <div class="cta-box"><a class="cta-button" href="https://mdcatxpert.com/upgrade">Renew Elite Access</a></div>
      <p style="font-size: 12px; color: #6b7280;">If you don't renew, your account simply drops back to the free plan on that date — no action needed if that's fine with you.</p>
    `,
  });
}

function getExpiredEmailHtml(name: string | undefined): string {
  return emailShell({
    previewTitle: "Your MdcatXpert Elite access has ended",
    heading: "Your Elite access has ended",
    bodyHtml: `
      <p>Hi${name ? ` ${name}` : ""},</p>
      <p>Your MdcatXpert Elite Premium period has ended, so your account is now back on the free plan. You can renew anytime to unlock premium quizzes, detailed analytics, and Study Copilot again.</p>
      <div class="cta-box"><a class="cta-button" href="https://mdcatxpert.com/upgrade">Renew Elite Access</a></div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Query: candidate premium users to check
// ---------------------------------------------------------------------------

type ReminderCandidate = {
  userId: Id<"users">;
  name?: string;
  email?: string;
  premiumUntil?: number;
  renewalRemindersEnabled?: boolean;
  premiumReminderSentForExpiry?: number;
  premiumExpiredNoticeSentForExpiry?: number;
};

export const listPremiumUsersForReminderCheck = internalQuery({
  args: {},
  handler: async (ctx): Promise<ReminderCandidate[]> => {
    // Bounded on purpose: premium subscribers are a small, naturally-capped
    // segment of the user base (not an unbounded growing log table), so a
    // single indexed batch is safe. Raise the cap if the premium base grows
    // past this.
    const users: Doc<"users">[] = await ctx.db
      .query("users")
      .withIndex("by_subscriptionType", (q) => q.eq("subscriptionType", "premium"))
      .take(1000);

    return users.map((u) => ({
      userId: u._id,
      name: u.name,
      email: u.email,
      premiumUntil: u.premiumUntil,
      renewalRemindersEnabled: u.renewalRemindersEnabled,
      premiumReminderSentForExpiry: u.premiumReminderSentForExpiry,
      premiumExpiredNoticeSentForExpiry: u.premiumExpiredNoticeSentForExpiry,
    }));
  },
});

// ---------------------------------------------------------------------------
// Mutation: persist that a reminder was sent (and downgrade on expiry)
// ---------------------------------------------------------------------------

export const markRenewalReminderSent = internalMutation({
  args: {
    userId: v.id("users"),
    kind: v.union(v.literal("expiring"), v.literal("expired")),
    expiryValue: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    if (args.kind === "expiring") {
      await ctx.db.patch(args.userId, {
        premiumReminderSentForExpiry: args.expiryValue,
      });
    } else {
      // Expired: downgrade to free (premiumUntil is left as-is, it's now
      // just a historical record of when the last period ended) and mark
      // the expired notice sent so it isn't re-sent.
      await ctx.db.patch(args.userId, {
        subscriptionType: "free",
        premiumExpiredNoticeSentForExpiry: args.expiryValue,
      });
    }
    return null;
  },
});

// ---------------------------------------------------------------------------
// Action: cron entrypoint — decide who needs an email, send it, persist state
// ---------------------------------------------------------------------------

export const checkAndSendRenewalReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.AUTH_RESEND_KEY;
    const from = process.env.RESEND_FROM_EMAIL ?? "MdcatXpert <onboarding@resend.dev>";
    if (!apiKey) {
      console.error("[subscriptionReminders] AUTH_RESEND_KEY not set — skipping run.");
      return null;
    }
    const resend = new ResendAPI(apiKey);

    const candidates: ReminderCandidate[] = await ctx.runQuery(
      internal.subscriptionReminders.listPremiumUsersForReminderCheck,
      {},
    );

    const now = Date.now();

    for (const u of candidates) {
      if (!u.email || !u.premiumUntil) continue;
      if (u.renewalRemindersEnabled === false) continue; // user opted out

      const msUntilExpiry = u.premiumUntil - now;

      // Already expired -> downgrade + "expired" email (once per expiry value)
      if (msUntilExpiry <= 0) {
        if (u.premiumExpiredNoticeSentForExpiry === u.premiumUntil) continue;
        const { error } = await resend.emails.send({
          from,
          to: [u.email],
          subject: "Your MdcatXpert Elite access has ended",
          text: `Your MdcatXpert Elite Premium period has ended and your account is back on the free plan. Renew anytime at https://mdcatxpert.com/upgrade`,
          html: getExpiredEmailHtml(u.name),
        });
        if (error) {
          console.error(`[subscriptionReminders] expired email failed for ${u.email}:`, error);
          continue;
        }
        await ctx.runMutation(internal.subscriptionReminders.markRenewalReminderSent, {
          userId: u.userId,
          kind: "expired",
          expiryValue: u.premiumUntil,
        });
        continue;
      }

      // Expiring soon -> "renew now" nudge (once per expiry value)
      if (msUntilExpiry <= REMINDER_WINDOW_MS) {
        if (u.premiumReminderSentForExpiry === u.premiumUntil) continue;
        const { error } = await resend.emails.send({
          from,
          to: [u.email],
          subject: "Your MdcatXpert Elite access is expiring soon",
          text: `Your MdcatXpert Elite Premium access ends on ${new Date(u.premiumUntil).toDateString()}. Renew at https://mdcatxpert.com/upgrade to keep it — we don't auto-renew, so nothing will be charged automatically.`,
          html: getExpiringSoonEmailHtml(u.name, u.premiumUntil),
        });
        if (error) {
          console.error(`[subscriptionReminders] expiring-soon email failed for ${u.email}:`, error);
          continue;
        }
        await ctx.runMutation(internal.subscriptionReminders.markRenewalReminderSent, {
          userId: u.userId,
          kind: "expiring",
          expiryValue: u.premiumUntil,
        });
      }
    }

    return null;
  },
});
