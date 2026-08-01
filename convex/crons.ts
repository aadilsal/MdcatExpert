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

export default crons;
