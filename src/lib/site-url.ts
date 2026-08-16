const DEFAULT_SITE_URL = "https://mdcatxpert.com";

// Deliberately does NOT fall back to process.env.VERCEL_URL: that's Vercel's
// auto-generated per-deployment domain (e.g. mdcat-expert-xyz123.vercel.app),
// which sits behind Vercel's own deployment-protection login wall on most
// projects. Building redirect URLs (Safepay checkout return/cancel, emails)
// from VERCEL_URL sends users to a "log in to Vercel" screen instead of the
// app itself — set NEXT_PUBLIC_SITE_URL explicitly for previews if needed.
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url) return DEFAULT_SITE_URL;
  if (url.startsWith("http://") || url.startsWith("https://")) return url.replace(/\/$/, "");
  return `https://${url.replace(/\/$/, "")}`;
}
