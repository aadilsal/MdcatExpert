import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const ResendOTPPasswordReset = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };

    const alphabet = "0123456789";
    const length = 8;
    return generateRandomString(random, alphabet, length);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const apiKey = provider.apiKey ?? process.env.AUTH_RESEND_KEY;
    if (!apiKey) {
      throw new Error("Password reset email is not configured.");
    }

    const from =
      process.env.RESEND_FROM_EMAIL ?? "MdcatXpert <onboarding@resend.dev>";

    const resend = new ResendAPI(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: "Reset your MdcatXpert password",
      text: `Your password reset code is ${token}. It expires soon. If you did not request this, you can ignore this email.`,
    });

    if (error) {
      console.error("[resend] password reset failed:", error);
      throw new Error(`Could not send password reset email: ${error.message}`);
    }
  },
});
