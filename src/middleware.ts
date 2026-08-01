import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import type { NextRequest } from "next/server";

const isAuthPage = createRouteMatcher([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);
const isPublicPath = createRouteMatcher([
  "/",
  "/help",
  "/terms",
  "/privacy",
  "/contact",
  "/blog",
  "/blog(.*)",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
// Server-to-server callbacks that never carry a user session cookie. These
// must bypass the auth redirect entirely, or Safepay's webhook (and any
// future gateway) gets redirected to /login and the payment silently never
// confirms.
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);
const isProtectedRoute = (req: NextRequest) =>
  !isPublicPath(req) &&
  !isAuthPage(req) &&
  !isWebhookRoute(req) &&
  // Let Convex Auth proxy its own endpoint via middleware.
  !(new URL(req.url).pathname.startsWith("/api/auth"));

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authed = await convexAuth.isAuthenticated();

  if (isAuthPage(request) && authed) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }

  if (isProtectedRoute(request) && !authed) {
    return nextjsMiddlewareRedirect(request, "/login");
  }

  // Admin routes: role is enforced on each admin page (Convex). Authenticated non-admins get 403 there.
  if (isAdminRoute(request) && !authed) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
