"use server";

import { sendEmailNotification } from "@/lib/resend";
import { getWelcomeEmailHtml, getOtpEmailHtml } from "@/lib/email-templates";

export async function sendWelcomeEmailAction(email: string, name?: string) {
  try {
    const html = getWelcomeEmailHtml(name || "Student");
    const result = await sendEmailNotification({
      to: email,
      subject: "Welcome to MDCAT Xpert! 🚀 Your AI Mentor Awaits",
      text: `Welcome to MDCAT Xpert, ${name || "Student"}! Pakistan's #1 AI-powered MDCAT preparation platform. Log in and start practicing today.`,
      html,
    });
    if (result.skipped || result.error) {
      throw new Error(result.error || "Email sending is not configured.");
    }
    return { success: true };
  } catch (error) {
    console.error("Welcome email failed to send:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendOtpEmailAction(email: string, name: string, otp: string) {
  try {
    const html = getOtpEmailHtml(name, otp);
    const result = await sendEmailNotification({
      to: email,
      subject: `MDCAT Xpert: ${otp} is your verification code`,
      text: `Your MDCAT Xpert email verification code is: ${otp}. Valid for 15 minutes.`,
      html,
    });
    if (result.skipped || result.error) {
      throw new Error(result.error || "Email sending is not configured.");
    }
    return { success: true };
  } catch (error) {
    console.error("OTP email failed to send:", error);
    return { success: false, error: String(error) };
  }
}
