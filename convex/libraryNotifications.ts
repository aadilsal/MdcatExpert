import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend as ResendAPI } from "resend";
import { emailShell } from "./lib/emailShell";

/**
 * Fires once per platform library source, the first time it finishes
 * ingesting successfully — see ingestDocument.ts saveChunks(). Covers both
 * admin-uploaded textbooks/notes and the OpenStax seed pipeline, since both
 * funnel through the same ingestion path.
 */

function getNewLibraryContentEmailHtml(
  name: string | undefined,
  title: string,
  subject: string | undefined,
  chapter: string | undefined,
): string {
  return emailShell({
    previewTitle: `New in the MdcatXpert library: ${title}`,
    heading: "New study material just landed 📚",
    bodyHtml: `
      <p>Hi${name ? ` ${name}` : ""},</p>
      <p>We just added a new reference to the Study Copilot library${subject ? ` for ${subject}` : ""}:</p>
      <ul><li><strong>${title}</strong>${chapter ? ` — ${chapter}` : ""}</li></ul>
      <p>Open Study Copilot and chat with it directly — grounded, cited answers pulled straight from this material.</p>
      <div class="cta-box"><a class="cta-button" href="https://mdcatxpert.com/copilot">Open Study Copilot</a></div>
    `,
  });
}

export const listUsersPage = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db.query("users").paginate(args.paginationOpts);
  },
});

export const notifyNewLibraryContent = internalAction({
  args: { sourceId: v.id("studySources") },
  handler: async (ctx, { sourceId }) => {
    const apiKey = process.env.AUTH_RESEND_KEY;
    const from = process.env.RESEND_FROM_EMAIL ?? "MdcatXpert <onboarding@resend.dev>";
    if (!apiKey) {
      console.error("[libraryNotifications] AUTH_RESEND_KEY not set — skipping run.");
      return null;
    }

    const source = await ctx.runQuery(internal.studySources.internalGetSource, { sourceId });
    if (!source || source.ownerType !== "platform" || !source.isPublished) return null;

    const resend = new ResendAPI(apiKey);

    let cursor: string | null = null;
    let isDone = false;
    while (!isDone) {
      const result: { page: Array<{ email?: string; name?: string; emailNotificationsEnabled?: boolean }>; isDone: boolean; continueCursor: string } =
        await ctx.runQuery(internal.libraryNotifications.listUsersPage, {
          paginationOpts: { numItems: 200, cursor },
        });
      isDone = result.isDone;
      cursor = result.continueCursor;

      for (const u of result.page) {
        if (!u.email) continue;
        if ((u.emailNotificationsEnabled ?? true) === false) continue;

        const html = getNewLibraryContentEmailHtml(u.name, source.title, source.subject, source.chapter);
        const { error } = await resend.emails.send({
          from,
          to: [u.email],
          subject: `New in the library: ${source.title} 📚`,
          text: `New study material was just added to the MdcatXpert library: "${source.title}"${source.subject ? ` (${source.subject})` : ""}. Open Study Copilot to chat with it: https://mdcatxpert.com/copilot`,
          html,
        });
        if (error) {
          console.error(`[libraryNotifications] send failed for ${u.email}:`, error);
        }
      }
    }
    return null;
  },
});
