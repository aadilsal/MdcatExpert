import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import type { NextRequest } from "next/server";

const isAuthPage = createRouteMatcher(["/login", "/signup"]);
const isPublicPath = createRouteMatcher([
  "/",
  "/help",
  "/terms",
  "/privacy",
  "/contact",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isProtectedRoute = (req: NextRequest) =>
  !isPublicPath(req) &&
  !isAuthPage(req) &&
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
