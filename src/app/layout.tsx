import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import NavigationProgress from "@/components/navigation-progress";
import PageViewTracker from "@/components/page-view-tracker";
import { getSiteUrl } from "@/lib/site-url";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MdcatXpert — Master Your MDCAT",
    template: "%s | MdcatXpert",
  },
  description:
    "Free MDCAT quiz archives, practice tests, and analytics to help Pakistani medical aspirants prepare smarter and score higher.",
  keywords: [
    "MDCAT",
    "MDCAT preparation",
    "MDCAT past papers",
    "MDCAT practice test",
    "medical entrance exam Pakistan",
    "PMC MDCAT",
    "biology MCQs",
    "MDCAT 2026",
  ],
  authors: [{ name: "MdcatXpert", url: siteUrl }],
  creator: "MdcatXpert",
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: siteUrl,
    siteName: "MdcatXpert",
    title: "MdcatXpert — Master Your MDCAT",
    description:
      "Interactive MDCAT past papers, AI analytics, and study tools for Pakistan's medical entrance exam.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MdcatXpert — Master Your MDCAT",
    description:
      "Interactive MDCAT past papers, AI analytics, and study tools for Pakistan's medical entrance exam.",
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/mdcat_exper_logo-removebg-preview.png",
    apple: "/mdcat_exper_logo-removebg-preview.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme') || 'dark';
                  var isDark = saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MdcatXpert",
              url: siteUrl,
              description:
                "MDCAT preparation platform for Pakistan — interactive past papers, analytics, and AI study tools.",
              email: "support@mdcatxpert.com",
            }),
          }}
        />
        <ConvexAuthNextjsServerProvider>
          <ThemeProvider>
            <NavigationProgress />
            <PageViewTracker />
            {children}
          </ThemeProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
