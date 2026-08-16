import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the MdcatXpert team for support, feedback, or collaborations.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
