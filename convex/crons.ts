import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Checks every premium user once a day: sends a "renew soon" nudge a few
// days before premiumUntil, and on expiry downgrades them to free + sends
// an "access ended" email. No auto-renewal — Safepay checkout here is a
// one-time payment, so this cron is the only thing that ever changes
// subscriptionType away from "premium".
crons.interval(
  "send subscription renewal reminders",
  { hours: 24 },
  internal.subscriptionReminders.checkAndSendRenewalReminders,
  {},
);

// "What's new this week" recap — new quizzes + new library content. Skips
// itself entirely if nothing was published that week (see weeklyDigest.ts).
crons.weekly(
  "send weekly digest",
  { dayOfWeek: "monday", hourUTC: 6, minuteUTC: 0 },
  internal.weeklyDigest.sendWeeklyDigest,
  {},
);

// Win-back nudge for users inactive 14+ days, sent at most once per
// dormancy episode — see dormantReminders.ts.
crons.interval(
  "send dormant user reminders",
  { hours: 24 },
  internal.dormantReminders.sendDormantReminders,
  {},
);

export default crons;
