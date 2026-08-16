import type { Metadata } from "next";
import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";
import MdcatLogo from "@/components/mdcat-logo";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center px-6 text-center transition-colors duration-350">
      <MdcatLogo size="sm" />
      <div className="mt-10 w-16 h-16 rounded-3xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
        <Compass aria-hidden="true" className="w-8 h-8" />
      </div>
      <p className="mt-8 text-sm font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
        404 Error
      </p>
      <h1 className="mt-3 text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight text-balance">
        This page went off-syllabus.
      </h1>
      <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back on track.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/"
          className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-black text-white bg-primary-600 rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25"
        >
          Back to Home
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/help"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          Visit Help Center
        </Link>
      </div>
    </div>
  );
}
