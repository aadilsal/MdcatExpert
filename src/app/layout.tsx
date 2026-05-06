import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import NavigationLoadingOverlay from "@/components/navigation-loading-overlay";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MdcatXpert — Master Your MDCAT",
  description:
    "Free MDCAT quiz archives, practice tests, and analytics to help you prepare smarter and score higher.",
  keywords: ["MDCAT", "quizzes", "practice tests", "medical", "Pakistan", "preparation"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ConvexAuthNextjsServerProvider>
          <NavigationLoadingOverlay />
          {children}
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
