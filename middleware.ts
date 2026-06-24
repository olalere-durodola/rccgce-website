import { NextResponse } from "next/server";

import { auth } from "@/lib/auth.edge";

/**
 * Route protection. Requires an authenticated session for /account and /admin.
 * Deeper role checks (ADMIN) are enforced server-side via `requireAdmin` in the
 * admin layout/pages — middleware only guarantees authentication here.
 */
export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    // Preserve the full destination (path + query) so the user lands exactly
    // where they were headed after signing in. callbackUrl is an internal,
    // same-origin pathname only (open-redirect-safe). If this ever becomes a
    // caller-supplied or absolute URL, it MUST be validated as same-origin
    // before being used as a redirect target.
    loginUrl.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
