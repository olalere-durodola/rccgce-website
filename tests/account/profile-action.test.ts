import { describe, it, expect, vi, beforeEach } from "vitest";

// The core helper receives its db, but imports getCurrentUser from rbac which
// imports @/lib/auth. Stub auth so the real NextAuth runtime never loads.
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

import { updateProfileCore } from "@/app/account/profile/profile-core";

const update = vi.fn();

const db = {
  user: {
    update: (arg: unknown) => update(arg),
  },
};

const loggedIn = async () =>
  ({ user: { id: "u1", role: "MEMBER" } }) as never;
const anon = async () => null;

beforeEach(() => {
  update.mockReset();
  update.mockResolvedValue({});
});

describe("updateProfileCore", () => {
  it("returns unauthenticated and touches no data when there is no session", async () => {
    const result = await updateProfileCore(
      { name: "Jane" },
      { db, getSession: anon },
    );
    expect(result).toEqual({ status: "unauthenticated" });
    expect(update).not.toHaveBeenCalled();
  });

  it("updates ONLY the current session user's record (where id = session id)", async () => {
    const result = await updateProfileCore(
      { name: "Jane Doe", image: "https://example.com/a.png" },
      { db, getSession: loggedIn },
    );

    expect(result).toEqual({ status: "ok" });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "Jane Doe", image: "https://example.com/a.png" },
    });
  });

  it("ignores any client-provided id and uses the session id for the where clause", async () => {
    // A malicious client tries to target another user's record via `id`.
    await updateProfileCore(
      { id: "victim", name: "Hacker" },
      { db, getSession: loggedIn },
    );

    const arg = update.mock.calls[0][0] as { where: { id: string } };
    expect(arg.where.id).toBe("u1");
    expect(arg.where.id).not.toBe("victim");
  });

  it("normalizes a cleared/empty image to null", async () => {
    await updateProfileCore(
      { name: "Jane", image: "" },
      { db, getSession: loggedIn },
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "Jane", image: null },
    });
  });

  it("rejects invalid input (empty name) without touching the database", async () => {
    const result = await updateProfileCore(
      { name: "" },
      { db, getSession: loggedIn },
    );
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.errors?.name).toMatch(/required/i);
    }
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects an invalid image URL without touching the database", async () => {
    const result = await updateProfileCore(
      { name: "Jane", image: "not-a-url" },
      { db, getSession: loggedIn },
    );
    expect(result.status).toBe("error");
    expect(update).not.toHaveBeenCalled();
  });
});
