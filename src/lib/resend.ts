import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

/** Admin inbox for contact form + payment alerts (defaults to project owner). */
export const adminEmail =
  process.env.ADMIN_EMAIL?.trim() || "salmanaadil52@gmail.com";

export function getResendConfigError(): string | null {
  if (!resendApiKey) return "RESEND_API_KEY is not set on the Next.js host (Vercel).";
  if (!fromEmail) return "RESEND_FROM_EMAIL is not set on the Next.js host (Vercel).";
  return null;
}

export async function sendEmailNotification(args: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  const configError = getResendConfigError();
  if (configError) {
    console.error("[resend] skipped:", configError);
    return { skipped: true as const, error: configError };
  }

  const resend = new Resend(resendApiKey);
  const { data, error } = await resend.emails.send({
    from: fromEmail!,
    to: args.to,
    subject: args.subject,
    text: args.text,
    html: args.html,
    replyTo: args.replyTo,
  });

  if (error) {
    console.error("[resend] send failed:", error);
    return { skipped: false as const, error: error.message };
  }

  return { skipped: false as const, id: data?.id };
}

