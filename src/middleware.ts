import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isAuthPage = createRouteMatcher(["/login", "/signup"]);
const isPublicPath = createRouteMatcher([
  "/",
  "/help",
  "/terms",
  "/privacy",
  "/contact",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isProtectedRoute = (req: Request) =>
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

  // Admin gating (role check will be enforced in page loaders too).
  if (isAdminRoute(request) && !authed) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
