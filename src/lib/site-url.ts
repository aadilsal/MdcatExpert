const DEFAULT_SITE_URL = "https://mdcatxpert.com";

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (!url) return DEFAULT_SITE_URL;
  if (url.startsWith("http://") || url.startsWith("https://")) return url.replace(/\/$/, "");
  return `https://${url.replace(/\/$/, "")}`;
}
