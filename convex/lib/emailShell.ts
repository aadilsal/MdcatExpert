/**
 * Shared HTML wrapper for engagement emails (weekly digest, dormant
 * win-back, new-library-content). Same visual style as
 * subscriptionReminders.ts's local copy — factored out here because this
 * session adds three more callers, past the point where duplicating the
 * ~70-line shell per file is worth it.
 */
export function emailShell(opts: { heading: string; bodyHtml: string; previewTitle: string }): string {
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
          .content ul { margin: 0 0 20px 0; padding-left: 20px; }
          .content li { margin-bottom: 8px; }
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
          .footer a { color: #4f46e5; text-decoration: none; font-weight: 600; margin: 0 6px; }
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
              <p><a href="https://mdcatxpert.com/dashboard">Go to Dashboard</a> | <a href="https://mdcatxpert.com/profile">Email Preferences</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
