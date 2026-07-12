import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

function getPasswordResetEmailHtml(token: string): string {
  const primaryColor = "#4f46e5"; // Indigo
  const accentColor = "#10b981"; // Emerald
  const textColor = "#1e293b"; // Slate-800
  const bgColor = "#f8fafc"; // Slate-50

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your MdcatXpert password</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: ${bgColor};
            color: ${textColor};
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            background-color: ${bgColor};
            padding: 40px 20px;
            box-sizing: border-box;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 40px 30px;
            text-align: center;
            border-bottom: 4px solid ${accentColor};
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.025em;
            font-style: italic;
          }
          .header h1 span {
            color: ${accentColor};
          }
          .header p {
            color: #94a3b8;
            margin: 8px 0 0 0;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.15em;
          }
          .content {
            padding: 40px 35px;
            font-size: 15px;
            line-height: 1.6;
            color: ${textColor};
          }
          .content h2 {
            font-size: 20px;
            font-weight: 800;
            margin-top: 0;
            margin-bottom: 20px;
            color: #0f172a;
          }
          .content p {
            margin-top: 0;
            margin-bottom: 20px;
          }
          .code-box {
            text-align: center;
            margin: 30px 0;
          }
          .code-display {
            display: inline-block;
            padding: 15px 35px;
            background-color: #f1f5f9;
            border: 2px dashed #4f46e5;
            border-radius: 16px;
            font-family: monospace;
            font-size: 32px;
            font-weight: 900;
            letter-spacing: 6px;
            color: #0f172a;
            text-align: center;
          }
          .footer {
            background-color: #f8fafc;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
          }
          .footer p {
            margin: 0 0 8px 0;
          }
          .footer a {
            color: ${primaryColor};
            text-decoration: none;
            font-weight: 600;
          }
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
              <h2>Reset Your Password 👋</h2>
              <p>We received a request to reset your password. Please use the 8-digit verification code below to proceed with setting a new password. This code is valid for a limited time.</p>
              
              <div class="code-box">
                <div class="code-display">
                  ${token}
                </div>
              </div>
              
              <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 20px;">
                If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MDCAT Xpert. All rights reserved.</p>
              <p>Preparing you for Pakistan's toughest medical admission exams.</p>
              <p><a href="https://mdcatxpert.com/login">Go to Login</a> | <a href="https://mdcatxpert.com/upgrade">Elite Premium</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

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
      html: getPasswordResetEmailHtml(token),
    });

    if (error) {
      console.error("[resend] password reset failed:", error);
      throw new Error(`Could not send password reset email: ${error.message}`);
    }
  },
});
