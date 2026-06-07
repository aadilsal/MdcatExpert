import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BlogNavLinkClient from "./blog-nav-link";
import MdcatLogo from "@/components/mdcat-logo";

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:-translate-x-1 transition-all" />
              <span className="hidden sm:inline text-sm font-semibold text-gray-500 group-hover:text-primary-600 transition-colors">
                Back to Home
              </span>
            </Link>

            <MdcatLogo size="sm" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <BlogNavLinkClient />
            <Link
              href="/login"
              className="px-4 py-1.5 text-xs font-black text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 sm:py-20 lg:py-24 animate-fade-in">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">{children}</div>
      </main>

      <footer className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400 font-medium">
            © {new Date().getFullYear()} MdcatXpert. Empowering future medical professionals.
          </p>
        </div>
      </footer>
    </div>
  );
}
