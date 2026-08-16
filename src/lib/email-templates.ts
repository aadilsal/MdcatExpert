/**
 * Centrally managed HTML email template builders for Elite MDCAT SaaS.
 * Designed with a premium, medical-inspired dark slate and emerald/primary color palette.
 */

interface BaseTemplateArgs {
  title: string;
  preheader: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}

function getBaseEmailTemplate({ title, preheader, bodyHtml, ctaText, ctaUrl }: BaseTemplateArgs): string {
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
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: ${bgColor};
            color: ${textColor};
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
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
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
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
          .bullets-container {
            background-color: #f1f5f9;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 30px;
          }
          .bullets-container h3 {
            margin-top: 0;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
            margin-bottom: 12px;
          }
          .bullet-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 600;
          }
          .bullet-item:last-child {
            margin-bottom: 0;
          }
          .bullet-dot {
            color: ${accentColor};
            margin-right: 10px;
            font-size: 16px;
            line-height: 1;
          }
          .cta-wrapper {
            text-align: center;
            margin: 35px 0 10px 0;
          }
          .cta-btn {
            display: inline-block;
            background-color: #0f172a;
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 36px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.15);
            transition: all 0.2s ease;
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
          <!-- preheader text (invisible) -->
          <span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0;">${preheader}</span>
          
          <div class="container">
            <div class="header">
              <h1>MDCAT<span>Xpert.</span></h1>
              <p>Pakistan's #1 AI MDCAT Prep Platform</p>
            </div>
            
            <div class="content">
              ${bodyHtml}
              
              ${ctaText && ctaUrl ? `
                <div class="cta-wrapper">
                  <a href="${ctaUrl}" class="cta-btn">${ctaText}</a>
                </div>
              ` : ""}
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MDCAT Xpert. All rights reserved.</p>
              <p>Preparing you for Pakistan's toughest medical admission exams.</p>
              <p><a href="https://mdcatxpert.com/dashboard">Go to Dashboard</a> | <a href="https://mdcatxpert.com/upgrade">Elite Premium</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Returns HTML welcome email content.
 */
export function getWelcomeEmailHtml(name: string): string {
  const title = "Welcome to MDCAT Xpert!";
  const preheader = "Your AI MDCAT Mentor is ready. Start practicing today!";
  const bodyHtml = `
    <h2>Welcome to the team, ${name}! 👋</h2>
    <p>We are excited to help you conquer the MDCAT and secure your seat in Pakistan's top medical colleges. MDCAT Xpert is built to analyze your weaknesses and optimize your preparation in real-time.</p>
    
    <div class="bullets-container">
      <h3>Here is what you get on the Free Plan:</h3>
      <div class="bullet-item">
        <span class="bullet-dot">✔</span>
        <span>5 practice past papers & quizzes</span>
      </div>
      <div class="bullet-item">
        <span class="bullet-dot">✔</span>
        <span>Basic performance accuracy tracking</span>
      </div>
      <div class="bullet-item">
        <span class="bullet-dot">✔</span>
        <span>AI Study Copilot (10 messages per day)</span>
      </div>
    </div>

    <p>Want to upgrade and unlock our full prep library? Upgrade to <strong>Elite Premium</strong> for a one-time 1-Year Full Season Pass payment of just Rs. 2,500.</p>
  `;

  return getBaseEmailTemplate({
    title,
    preheader,
    bodyHtml,
    ctaText: "Start Practice Quiz",
    ctaUrl: "https://mdcatxpert.com/quizzes"
  });
}

/**
 * Returns HTML Premium Activated confirmation email content.
 */
export function getPremiumActivatedEmailHtml(name: string): string {
  const title = "Premium Activated Successfully!";
  const preheader = "Your Elite membership is now active. Unlock your full potential!";
  const bodyHtml = `
    <h2>Hello ${name},</h2>
    <p>Your payment has been verified successfully. Your <strong>Premium (Elite)</strong> membership is now active!</p>
    <p>You can now log in and take advantage of all our state-of-the-art preparation tools designed to help you score 180+ on the MDCAT:</p>
    
    <div class="bullets-container" style="background-color: #ecfdf5; border: 1px solid #a7f3d0;">
      <h3 style="color: #065f46;">Your Elite Features Are Unlocked:</h3>
      <div class="bullet-item" style="color: #065f46;">
        <span class="bullet-dot">⚡</span>
        <span>AI Weakness Radar — Find chapters preventing you from scoring 180+</span>
      </div>
      <div class="bullet-item" style="color: #065f46;">
        <span class="bullet-dot">⚡</span>
        <span>AI Study Planner — Know exactly what to study every day</span>
      </div>
      <div class="bullet-item" style="color: #065f46;">
        <span class="bullet-dot">⚡</span>
        <span>Predicted MDCAT Score — Estimate your expected score before exam day</span>
      </div>
      <div class="bullet-item" style="color: #065f46;">
        <span class="bullet-dot">⚡</span>
        <span>Advanced Analytics & Difficulty Heatmaps</span>
      </div>
      <div class="bullet-item" style="color: #065f46;">
        <span class="bullet-dot">⚡</span>
        <span>All Past Papers & Question Banks (No Limits)</span>
      </div>
    </div>

    <p>Best of luck in your MDCAT preparation! Let's secure that medical college seat together.</p>
  `;

  return getBaseEmailTemplate({
    title,
    preheader,
    bodyHtml,
    ctaText: "Log In to Elite Dashboard",
    ctaUrl: "https://mdcatxpert.com/login"
  });
}

interface PaymentInvoiceArgs {
  name: string;
  planName: string;
  priceLabel: string;
  durationLabel: string;
  paidAt: number;
  premiumUntil: number;
  reference: string;
}

/**
 * Returns HTML payment invoice/receipt email content, sent automatically
 * after a Safepay payment is confirmed (see src/app/api/webhooks/safepay/route.ts).
 */
export function getPaymentInvoiceEmailHtml({
  name,
  planName,
  priceLabel,
  durationLabel,
  paidAt,
  premiumUntil,
  reference,
}: PaymentInvoiceArgs): string {
  const title = "Payment Receipt";
  const preheader = `Your receipt for ${planName} — payment confirmed automatically.`;
  const dateFmt = new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  });
  const invoiceRow = (label: string, value: string, emphasize = false) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #e2e8f0;">
      <span style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#64748b;">${label}</span>
      <span style="font-size:${emphasize ? "16px" : "14px"}; font-weight:${emphasize ? "800" : "600"}; color:#0f172a;">${value}</span>
    </div>
  `;

  const bodyHtml = `
    <h2>Hello ${name},</h2>
    <p>Thanks for upgrading — your payment was confirmed automatically and your <strong>${planName}</strong> access is now active. Here's your receipt for your records.</p>

    <div class="bullets-container" style="padding:0 24px;">
      ${invoiceRow("Plan", planName)}
      ${invoiceRow("Amount Paid", priceLabel, true)}
      ${invoiceRow("Access Period", durationLabel)}
      ${invoiceRow("Payment Date", dateFmt.format(new Date(paidAt)))}
      ${invoiceRow("Access Valid Until", dateFmt.format(new Date(premiumUntil)))}
      ${invoiceRow("Reference No.", reference)}
    </div>

    <p style="font-size:13px; color:#64748b;">This is a one-time payment — MdcatXpert never auto-renews or auto-charges you. We'll email you a reminder a few days before your access expires so you can choose to renew.</p>
  `;

  return getBaseEmailTemplate({
    title,
    preheader,
    bodyHtml,
    ctaText: "Go to Dashboard",
    ctaUrl: "https://mdcatxpert.com/dashboard",
  });
}

/**
 * Returns HTML New Quiz Uploaded notification email.
 */
export function getNewQuizEmailHtml(
  name: string,
  quizTitle: string,
  subject: string,
  year: number,
  questionCount: number,
  quizId: string
): string {
  const title = `New MDCAT Quiz Available: ${quizTitle}!`;
  const preheader = `A new ${subject} quiz has been added to MDCAT Xpert. Practice now!`;
  const bodyHtml = `
    <h2>Hello ${name},</h2>
    <p>A new practice past paper has just been published by our academic team. Add it to your revision schedule today to keep your preparation edge!</p>
    
    <div class="bullets-container">
      <h3>Quiz Details:</h3>
      <div class="bullet-item">
        <span class="bullet-dot">📅</span>
        <span>Year: ${year}</span>
      </div>
      <div class="bullet-item">
        <span class="bullet-dot">📚</span>
        <span>Subject: ${subject}</span>
      </div>
      <div class="bullet-item">
        <span class="bullet-dot">❓</span>
        <span>Total Questions: ${questionCount} MCQs</span>
      </div>
      <div class="bullet-item">
        <span class="bullet-dot">✏</span>
        <span>Title: ${quizTitle}</span>
      </div>
    </div>

    <p>Click below to jump straight into this practice exam and get instant AI-powered explanations for every answer.</p>
  `;

  return getBaseEmailTemplate({
    title,
    preheader,
    bodyHtml,
    ctaText: "Start Practice Quiz",
    ctaUrl: `https://mdcatxpert.com/quiz/${quizId}`
  });
}

/**
 * Returns HTML Verification OTP email content.
 */
export function getOtpEmailHtml(name: string, code: string): string {
  const title = "Verify Your Email Address";
  const preheader = `Your 6-digit verification code is ${code}. Verify to unlock your MDCAT Xpert portal.`;
  const bodyHtml = `
    <h2>Welcome to MDCAT Xpert, ${name}! 👋</h2>
    <p>Please use the 6-digit verification code below to verify your email address and activate your account. This code is valid for 15 minutes.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; padding: 15px 35px; background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 16px; font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #065f46; text-align: center;">
        ${code}
      </div>
    </div>

    <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 20px;">
      If you did not request this code, please ignore this email or contact support.
    </p>
  `;

  return getBaseEmailTemplate({
    title,
    preheader,
    bodyHtml,
  });
}
