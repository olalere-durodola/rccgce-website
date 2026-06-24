import { describe, it, expect, vi, beforeEach } from "vitest";

// rbac -> @/lib/auth pulls the real NextAuth runtime; stub it out.
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

import { Prisma } from "@prisma/client";

import {
  createMinistryCore,
  updateMinistryCore,
  deleteMinistryCore,
} from "@/app/admin/ministries/ministry-core";

const create = vi.fn();
const update = vi.fn();
const del = vi.fn();

const db = {
  ministry: {
    create: (a: unknown) => create(a),
    update: (a: unknown) => update(a),
    delete: (a: unknown) => del(a),
  },
};

const admin = async () => ({ user: { id: "a1", role: "ADMIN" } }) as never;
const member = async () => ({ user: { id: "m1", role: "MEMBER" } }) as never;
const anon = async () => null;

const validInput = {
  name: "Children's Church",
  summary: "For the little ones.",
  description: "A loving space.",
  leader: "Sister Mary",
  meetingTime: "Sundays 9am",
  imageUrl: "",
};

beforeEach(() => {
  create.mockReset();
  update.mockReset();
  del.mockReset();
  create.mockResolvedValue({ slug: "children-s-church" });
  update.mockResolvedValue({ slug: "children-s-church" });
  del.mockResolvedValue({ slug: "children-s-church" });
});

describe("createMinistryCore — admin enforcement", () => {
  it("rejects an unauthenticated caller and writes nothing", async () => {
    const res = await createMinistryCore(validInput, { db, getSession: anon });
    expect(res).toEqual({ status: "forbidden" });
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a non-admin (MEMBER) caller and writes nothing", async () => {
    const res = await createMinistryCore(validInput, { db, getSession: member });
    expect(res).toEqual({ status: "forbidden" });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("createMinistryCore — validation", () => {
  it("rejects invalid input (missing name) without writing", async () => {
    const res = await createMinistryCore(
      { ...validInput, name: "" },
      { db, getSession: admin },
    );
    expect(res.status).toBe("error");
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a malformed imageUrl without writing", async () => {
    const res = await createMinistryCore(
      { ...validInput, imageUrl: "not-a-url" },
      { db, getSession: admin },
    );
    expect(res.status).toBe("error");
    expect(create).not.toHaveBeenCalled();
  });
});

describe("createMinistryCore — happy path", () => {
  it("derives the slug from the name and persists normalized data", async () => {
    const res = await createMinistryCore(validInput, { db, getSession: admin });
    expect(res).toEqual({ status: "ok", slug: "children-s-church" });
    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0][0].data;
    expect(data.slug).toBe("children-s-church");
    expect(data.name).toBe("Children's Church");
    expect(data.imageUrl).toBeNull();
    expect(data.leader).toBe("Sister Mary");
  });

  it("returns a friendly error on a duplicate-slug (P2002) collision", async () => {
    create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "7",
      }),
    );
    const res = await createMinistryCore(validInput, { db, getSession: admin });
    expect(res.status).toBe("error");
    if (res.status === "error") expect(res.errors?.slug).toBeTruthy();
  });
});

describe("updateMinistryCore", () => {
  it("rejects a non-admin and writes nothing", async () => {
    const res = await updateMinistryCore("m1", validInput, {
      db,
      getSession: member,
    });
    expect(res).toEqual({ status: "forbidden" });
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the targeted record on valid input", async () => {
    const res = await updateMinistryCore("m1", validInput, {
      db,
      getSession: admin,
    });
    expect(res.status).toBe("ok");
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].where).toEqual({ id: "m1" });
  });
});

describe("deleteMinistryCore", () => {
  it("rejects a non-admin and deletes nothing", async () => {
    const res = await deleteMinistryCore("m1", { db, getSession: anon });
    expect(res).toEqual({ status: "forbidden" });
    expect(del).not.toHaveBeenCalled();
  });

  it("deletes the targeted record for an admin", async () => {
    const res = await deleteMinistryCore("m1", { db, getSession: admin });
    expect(res.status).toBe("ok");
    expect(del).toHaveBeenCalledWith({ where: { id: "m1" } });
  });
});
