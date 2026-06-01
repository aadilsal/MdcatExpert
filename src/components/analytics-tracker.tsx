"use client";

import { useEffect } from "react";

const TOUCH_LOGIN_KEY = "mdcat_touch_login_done";

/** Updates lastLoginAt once per browser session for authenticated app users. */
export default function AnalyticsTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(TOUCH_LOGIN_KEY)) return;

    void fetch("/api/analytics/touch-login", { method: "POST" })
      .then((res) => {
        if (res.ok) {
          sessionStorage.setItem(TOUCH_LOGIN_KEY, "1");
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
