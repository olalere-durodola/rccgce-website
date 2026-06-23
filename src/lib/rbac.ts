import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { auth } from "@/lib/auth";

/**
 * Server-side RBAC helpers.
 *
 * Each helper accepts an optional `getSession` so unit tests can inject a fake
 * session getter without pulling in the real NextAuth runtime. In production
 * the default is the real `auth()` from `@/lib/auth`.
 *
 * Design choice for `requireAdmin`: an authenticated non-admin is redirected to
 * "/" (rather than throwing a 403). This keeps the UX simple — members never
 * see a raw error page, just get bounced to the homepage.
 */

export type SessionUser = Session["user"];
export type GetSession = () => Promise<Session | null>;

const defaultGetSession: GetSession = () => auth();

/** Returns the current session user, or null when unauthenticated. */
export async function getCurrentUser(
  getSession: GetSession = defaultGetSession,
): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Requires any authenticated user. Redirects to /login when there is no
 * session, otherwise returns the user.
 */
export async function requireUser(
  getSession: GetSession = defaultGetSession,
): Promise<SessionUser> {
  const user = await getCurrentUser(getSession);
  if (!user) {
    // redirect() throws in the Next runtime; `return` guards mocked test runs
    // and keeps the type narrowed.
    return redirect("/login");
  }
  return user;
}

/**
 * Requires an ADMIN user. Redirects to /login when unauthenticated; redirects
 * to / when authenticated but not an admin. Returns the user when authorized.
 */
export async function requireAdmin(
  getSession: GetSession = defaultGetSession,
): Promise<SessionUser> {
  const user = await getCurrentUser(getSession);
  if (!user) {
    return redirect("/login");
  }
  if (user.role !== "ADMIN") {
    return redirect("/");
  }
  return user;
}
