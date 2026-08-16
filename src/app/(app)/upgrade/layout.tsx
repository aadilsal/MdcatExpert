import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans & Pricing",
  description:
    "Compare MdcatXpert's free tier, Monthly Pass, and Elite Annual plans — one-time payments, no auto-renewal.",
};

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
