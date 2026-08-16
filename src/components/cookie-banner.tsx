"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (privacy mode, etc.) — skip the banner rather than crash.
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {
      // Best-effort persistence only.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl shadow-gray-900/10">
        <Cookie aria-hidden="true" className="w-6 h-6 text-primary-600 dark:text-primary-400 shrink-0" />
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed grow">
          We use cookies to keep you signed in and show relevant ads. By continuing, you agree to our{" "}
          <Link href="/privacy" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="w-full sm:w-auto shrink-0 px-6 py-3 bg-primary-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-colors active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
