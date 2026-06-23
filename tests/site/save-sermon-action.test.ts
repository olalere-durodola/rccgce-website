import { describe, it, expect, vi, beforeEach } from "vitest";

// The core helper does not import the DB itself (it receives it), but it does
// import getCurrentUser from rbac which imports @/lib/auth. Stub auth so the
// real NextAuth runtime never loads in the test VM.
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

import { toggleSavedSermonCore } from "@/app/(marketing)/sermons/save-core";

const findUnique = vi.fn();
const create = vi.fn();
const del = vi.fn();

const db = {
  savedSermon: {
    findUnique: (arg: unknown) => findUnique(arg),
    create: (arg: unknown) => create(arg),
    delete: (arg: unknown) => del(arg),
  },
};

const loggedIn = async () =>
  ({ user: { id: "u1", role: "MEMBER" } }) as never;
const anon = async () => null;

beforeEach(() => {
  findUnique.mockReset();
  create.mockReset();
  del.mockReset();
});

describe("toggleSavedSermonCore", () => {
  it("returns unauthenticated and touches no data when there is no session", async () => {
    const result = await toggleSavedSermonCore("s1", {
      db,
      getSession: anon,
    });
    expect(result).toEqual({ status: "unauthenticated" });
    expect(findUnique).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });

  it("saves the sermon when it is not yet saved", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({});

    const result = await toggleSavedSermonCore("s1", {
      db,
      getSession: loggedIn,
    });

    expect(result).toEqual({ status: "saved" });
    expect(create).toHaveBeenCalledWith({
      data: { userId: "u1", sermonId: "s1" },
    });
    expect(del).not.toHaveBeenCalled();
  });

  it("unsaves the sermon when it is already saved", async () => {
    findUnique.mockResolvedValue({ userId: "u1", sermonId: "s1" });
    del.mockResolvedValue({});

    const result = await toggleSavedSermonCore("s1", {
      db,
      getSession: loggedIn,
    });

    expect(result).toEqual({ status: "unsaved" });
    expect(del).toHaveBeenCalledWith({
      where: { userId_sermonId: { userId: "u1", sermonId: "s1" } },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("scopes the lookup to the current user (never another user's state)", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({});

    await toggleSavedSermonCore("s9", { db, getSession: loggedIn });

    expect(findUnique).toHaveBeenCalledWith({
      where: { userId_sermonId: { userId: "u1", sermonId: "s9" } },
    });
  });
});
