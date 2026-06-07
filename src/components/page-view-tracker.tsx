"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics-events";

/** Records a page_view on every client-side route change. */
export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, { path: pathname });
  }, [pathname]);

  return null;
}
