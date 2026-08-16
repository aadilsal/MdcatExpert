import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a free MdcatXpert account and start practicing real past-paper MCQs today.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
