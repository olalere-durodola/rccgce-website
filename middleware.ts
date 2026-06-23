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
    // Preserve where the user was headed so we can return them after login.
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
