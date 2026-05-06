import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

export async function sendEmailNotification(args: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!resendApiKey || !fromEmail) return { skipped: true as const };
  const resend = new Resend(resendApiKey);

  await resend.emails.send({
    from: fromEmail,
    to: args.to,
    subject: args.subject,
    text: args.text,
  });

  return { skipped: false as const };
}

