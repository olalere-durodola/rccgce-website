import { describe, it, expect, vi, beforeEach } from "vitest";

// rbac -> @/lib/auth pulls the real NextAuth runtime; stub it out.
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

import { Prisma } from "@prisma/client";

import {
  createSermonCore,
  updateSermonCore,
  deleteSermonCore,
} from "@/app/admin/sermons/sermon-core";

const create = vi.fn();
const update = vi.fn();
const del = vi.fn();

const db = {
  sermon: {
    create: (a: unknown) => create(a),
    update: (a: unknown) => update(a),
    delete: (a: unknown) => del(a),
  },
};

const admin = async () => ({ user: { id: "a1", role: "ADMIN" } }) as never;
const member = async () => ({ user: { id: "m1", role: "MEMBER" } }) as never;
const anon = async () => null;

const validInput = {
  title: "The Power of Covenant",
  speaker: "Pastor John",
  date: "2026-01-01",
  scripture: "Genesis 17:7",
  description: "A message on covenant.",
  videoUrl: "",
  audioUrl: "",
  thumbnailUrl: "",
  seriesId: "",
};

beforeEach(() => {
  create.mockReset();
  update.mockReset();
  del.mockReset();
  create.mockResolvedValue({ slug: "the-power-of-covenant" });
  update.mockResolvedValue({ slug: "the-power-of-covenant" });
  del.mockResolvedValue({ slug: "the-power-of-covenant" });
});

describe("createSermonCore — admin enforcement", () => {
  it("rejects an unauthenticated caller and writes nothing", async () => {
    const res = await createSermonCore(validInput, { db, getSession: anon });
    expect(res).toEqual({ status: "forbidden" });
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a non-admin (MEMBER) caller and writes nothing", async () => {
    const res = await createSermonCore(validInput, { db, getSession: member });
    expect(res).toEqual({ status: "forbidden" });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("createSermonCore — validation", () => {
  it("rejects invalid input (missing title/speaker) without writing", async () => {
    const res = await createSermonCore(
      { title: "", speaker: "", date: "2026-01-01" },
      { db, getSession: admin },
    );
    expect(res.status).toBe("error");
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a malformed videoUrl without writing", async () => {
    const res = await createSermonCore(
      { ...validInput, videoUrl: "not-a-url" },
      { db, getSession: admin },
    );
    expect(res.status).toBe("error");
    expect(create).not.toHaveBeenCalled();
  });
});

describe("createSermonCore — happy path", () => {
  it("derives the slug from the title and persists normalized data", async () => {
    const res = await createSermonCore(validInput, { db, getSession: admin });
    expect(res).toEqual({ status: "ok", slug: "the-power-of-covenant" });
    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0][0].data;
    expect(data.slug).toBe("the-power-of-covenant");
    expect(data.title).toBe("The Power of Covenant");
    // empty optionals are stored as null, not ""
    expect(data.videoUrl).toBeNull();
    expect(data.seriesId).toBeNull();
    expect(data.date).toBeInstanceOf(Date);
  });

  it("honours an explicit slug (re-slugified)", async () => {
    await createSermonCore(
      { ...validInput, slug: "Custom Slug!" },
      { db, getSession: admin },
    );
    expect(create.mock.calls[0][0].data.slug).toBe("custom-slug");
  });

  it("returns a friendly error on a duplicate-slug (P2002) collision", async () => {
    create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "7",
      }),
    );
    const res = await createSermonCore(validInput, { db, getSession: admin });
    expect(res.status).toBe("error");
    if (res.status === "error") expect(res.errors?.slug).toBeTruthy();
  });
});

describe("updateSermonCore", () => {
  it("rejects a non-admin and writes nothing", async () => {
    const res = await updateSermonCore("s1", validInput, {
      db,
      getSession: member,
    });
    expect(res).toEqual({ status: "forbidden" });
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the targeted record on valid input", async () => {
    const res = await updateSermonCore("s1", validInput, {
      db,
      getSession: admin,
    });
    expect(res.status).toBe("ok");
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].where).toEqual({ id: "s1" });
  });
});

describe("deleteSermonCore", () => {
  it("rejects a non-admin and deletes nothing", async () => {
    const res = await deleteSermonCore("s1", { db, getSession: anon });
    expect(res).toEqual({ status: "forbidden" });
    expect(del).not.toHaveBeenCalled();
  });

  it("deletes the targeted record for an admin", async () => {
    const res = await deleteSermonCore("s1", { db, getSession: admin });
    expect(res.status).toBe("ok");
    expect(del).toHaveBeenCalledWith({ where: { id: "s1" } });
  });
});
