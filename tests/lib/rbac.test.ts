import { describe, it, expect, vi } from "vitest";
import type { Session } from "next-auth";

/**
 * Deterministic RBAC unit tests.
 *
 * Two hazards make a naive version of this suite flaky under concurrent load
 * with the `vmThreads` pool (the only pool that runs in this environment —
 * `forks`/`threads` crash with a runner-config error):
 *
 *   1. rbac.ts imports `@/lib/auth`, which transitively pulls in the full
 *      NextAuth + `next/server` runtime. That module fails to load inside the
 *      VM context ("Cannot find module 'next/server'"). We mock `@/lib/auth`
 *      so the import chain never reaches it — every test injects its own
 *      session getter anyway, so the real `auth()` is never used.
 *
 *   2. `vi.mock()` hoisting is intermittently dropped under `vmThreads`, so a
 *      mock of `next/navigation.redirect` cannot be *relied upon* to be the one
 *      that runs. We defend against this by mocking `redirect` to throw an
 *      error with the SAME shape the real Next `redirect` throws
 *      (`digest = "NEXT_REDIRECT;replace;<url>;307;"`). Whether the mock applies
 *      or the real `redirect` runs, control flow is identical: the call throws,
 *      and `captureRedirect` reads the target back out of the digest. This
 *      removes the timing dependency entirely.
 */

// Mock the redirect to THROW like the real Next runtime (it never returns).
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    const err = new Error("NEXT_REDIRECT") as Error & { digest: string };
    err.digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  },
}));

// Avoid pulling the real NextAuth/`next/server` runtime into this unit test.
// rbac only uses `auth` as the default session getter, which every test
// overrides with an injected getter.
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => null),
}));

import { getCurrentUser, requireUser, requireAdmin } from "@/lib/rbac";

/** Runs `fn`, returning the redirect target encoded in the thrown NEXT_REDIRECT
 * error, or `null` if it returned without redirecting. Re-throws anything that
 * is not a NEXT_REDIRECT so real failures still surface. */
async function captureRedirect(
  fn: () => Promise<unknown>,
): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (err) {
    const digest = (err as { digest?: unknown }).digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      // Digest shape: NEXT_REDIRECT;<type>;<url>;<status>;
      return digest.split(";").slice(2, -2).join(";");
    }
    throw err;
  }
}

function sessionWith(role: "MEMBER" | "ADMIN"): Session {
  return {
    user: {
      id: "user_1",
      name: "Test User",
      email: "test@example.com",
      role,
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  } as Session;
}

const noSession = async () => null;
const adminSession = async () => sessionWith("ADMIN");
const memberSession = async () => sessionWith("MEMBER");

describe("getCurrentUser", () => {
  it("returns null when there is no session", async () => {
    expect(await getCurrentUser(noSession)).toBeNull();
  });

  it("returns the user when there is a session", async () => {
    const user = await getCurrentUser(memberSession);
    expect(user?.id).toBe("user_1");
    expect(user?.role).toBe("MEMBER");
  });
});

describe("requireUser", () => {
  it("redirects to /login when there is no session", async () => {
    const target = await captureRedirect(() => requireUser(noSession));
    expect(target).toBe("/login");
  });

  it("returns the user when there is a session", async () => {
    const user = await requireUser(memberSession);
    expect(user.id).toBe("user_1");
  });
});

describe("requireAdmin", () => {
  it("redirects to /login when there is no session", async () => {
    const target = await captureRedirect(() => requireAdmin(noSession));
    expect(target).toBe("/login");
  });

  it("redirects to / for an authenticated non-admin (MEMBER)", async () => {
    const target = await captureRedirect(() => requireAdmin(memberSession));
    expect(target).toBe("/");
  });

  it("returns the user for an ADMIN session", async () => {
    const user = await requireAdmin(adminSession);
    expect(user.role).toBe("ADMIN");
  });
});
