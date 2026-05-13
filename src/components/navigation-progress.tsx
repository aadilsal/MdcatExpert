"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
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

function NavigationProgressInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const navKey = useMemo(
        () => `${pathname}?${searchParams?.toString() ?? ""}`,
        [pathname, searchParams],
    );

    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        if (!isNavigating) return;
        const t = window.setTimeout(() => setIsNavigating(false), 180);
        return () => window.clearTimeout(t);
    }, [navKey, isNavigating]);

    useEffect(() => {
        const onClickCapture = (event: MouseEvent) => {
            if (event.defaultPrevented) return;
            if (event.button !== 0) return;
            if (isModifiedEvent(event)) return;

            const target = event.target as Element | null;
            const a = target?.closest?.("a") as HTMLAnchorElement | null;
            if (!a) return;
            if (shouldIgnoreAnchor(a)) return;

            const href = a.href;
            const url = new URL(href, window.location.href);
            if (url.origin !== window.location.origin) return;

            const current = new URL(window.location.href);
            if (url.pathname === current.pathname && url.search === current.search && url.hash === current.hash) return;

            setIsNavigating(true);
        };

        document.addEventListener("click", onClickCapture, true);
        return () => document.removeEventListener("click", onClickCapture, true);
    }, []);

    useEffect(() => {
        const onPopState = () => setIsNavigating(true);
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    if (!isNavigating) return null;

    return (
        <div
            aria-hidden
            className="fixed top-0 left-0 right-0 z-[10000] h-1 overflow-hidden bg-primary-600/15 pointer-events-none"
        >
            <div className="h-full w-[38%] rounded-r-full bg-primary-600 shadow-[0_0_12px_rgba(29,78,216,0.45)] animate-nav-progress-bar" />
        </div>
    );
}

export default function NavigationProgress() {
    return (
        <Suspense fallback={null}>
            <NavigationProgressInner />
        </Suspense>
    );
}
