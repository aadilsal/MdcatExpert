"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

function shouldIgnoreAnchor(a: HTMLAnchorElement) {
  const href = a.getAttribute("href") ?? "";
  if (!href) return true;
  if (href.startsWith("#")) return true;
  if (a.target && a.target !== "_self") return true;
  if (a.hasAttribute("download")) return true;
  if (a.getAttribute("rel")?.includes("external")) return true;
  return false;
}

export default function NavigationLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navKey = useMemo(() => `${pathname}?${searchParams?.toString() ?? ""}`, [pathname, searchParams]);

  const [isNavigating, setIsNavigating] = useState(false);

  // Turn off once navigation completes (path/search changed).
  useEffect(() => {
    if (!isNavigating) return;
    const t = window.setTimeout(() => setIsNavigating(false), 0);
    return () => window.clearTimeout(t);
  }, [navKey, isNavigating]);

  // Turn on immediately when the user clicks an internal link.
  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return; // left click only
      if (isModifiedEvent(event)) return;

      const target = event.target as Element | null;
      const a = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;
      if (shouldIgnoreAnchor(a)) return;

      const href = a.href;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      // If it's the same URL, don't flash.
      const current = new URL(window.location.href);
      if (url.pathname === current.pathname && url.search === current.search && url.hash === current.hash) return;

      setIsNavigating(true);
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-9999 pointer-events-none"
    >
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
      <div className="absolute left-1/2 top-6 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 shadow-lg shadow-gray-900/10 ring-1 ring-black/5">
          <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-primary-600 animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest text-gray-600">
            Loading
          </span>
        </div>
      </div>
    </div>
  );
}

