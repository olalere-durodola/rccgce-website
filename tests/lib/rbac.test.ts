import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Session } from "next-auth";

// `redirect` throws in real Next to halt rendering; here we mock it so we can
// assert it was called (and so it does NOT throw, letting us check call args).
const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

// Avoid pulling the real NextAuth/Prisma runtime into the unit test. rbac only
// uses `auth` as the default session getter, which every test overrides.
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => null),
}));

import { getCurrentUser, requireUser, requireAdmin } from "@/lib/rbac";

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

beforeEach(() => {
  redirectMock.mockClear();
});

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
    await requireUser(noSession);
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("returns the user when there is a session", async () => {
    const user = await requireUser(memberSession);
    expect(user.id).toBe("user_1");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("requireAdmin", () => {
  it("redirects to /login when there is no session", async () => {
    await requireAdmin(noSession);
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("redirects to / for an authenticated non-admin (MEMBER)", async () => {
    await requireAdmin(memberSession);
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("returns the user for an ADMIN session", async () => {
    const user = await requireAdmin(adminSession);
    expect(user.role).toBe("ADMIN");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
