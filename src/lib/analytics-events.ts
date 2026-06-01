/** Analytics event names — keep in sync with convex/analytics.ts allowlist. */
export const ANALYTICS_EVENTS = {
  LANDING_VIEW: "landing_view",
  UPGRADE_PAGE_VIEW: "upgrade_page_view",
  PAYWALL_HIT: "paywall_hit",
  QUIZ_STARTED: "quiz_started",
  QUIZ_COMPLETED: "quiz_completed",
  PAYMENT_SUBMITTED: "payment_submitted",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export const PUBLIC_ANALYTICS_EVENTS: ReadonlySet<string> = new Set([
  ANALYTICS_EVENTS.LANDING_VIEW,
]);

const SESSION_STORAGE_KEY = "mdcat_analytics_session";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `sess_${Date.now()}`;
  }
}

/** Fire-and-forget client tracking via API route. */
export function trackEvent(
  eventName: AnalyticsEventName,
  properties?: Record<string, string>,
): void {
  if (typeof window === "undefined") return;
  const sessionId = getOrCreateSessionId();
  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventName, sessionId, properties }),
    keepalive: true,
  }).catch(() => {});
}
