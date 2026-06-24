import { describe, it, expect, vi, beforeEach } from "vitest";

// rbac -> @/lib/auth pulls the real NextAuth runtime; stub it out.
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

import { Prisma } from "@prisma/client";

import {
  createBlogPostCore,
  updateBlogPostCore,
  deleteBlogPostCore,
} from "@/app/admin/blog/blog-core";

const create = vi.fn();
const update = vi.fn();
const del = vi.fn();

const db = {
  blogPost: {
    create: (a: unknown) => create(a),
    update: (a: unknown) => update(a),
    delete: (a: unknown) => del(a),
  },
};

const admin = async () => ({ user: { id: "a1", role: "ADMIN" } }) as never;
const member = async () => ({ user: { id: "m1", role: "MEMBER" } }) as never;
const anon = async () => null;

const validInput = {
  title: "Walking in Covenant",
  excerpt: "A reflection.",
  body: "# Heading\n\nSome **markdown** body.",
  coverImage: "",
  publishedAt: "",
};

beforeEach(() => {
  create.mockReset();
  update.mockReset();
  del.mockReset();
  create.mockResolvedValue({ slug: "walking-in-covenant" });
  update.mockResolvedValue({ slug: "walking-in-covenant" });
  del.mockResolvedValue({ slug: "walking-in-covenant" });
});

describe("createBlogPostCore — admin enforcement", () => {
  it("rejects an unauthenticated caller and writes nothing", async () => {
    const res = await createBlogPostCore(validInput, { db, getSession: anon });
    expect(res).toEqual({ status: "forbidden" });
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a non-admin (MEMBER) caller and writes nothing", async () => {
    const res = await createBlogPostCore(validInput, { db, getSession: member });
    expect(res).toEqual({ status: "forbidden" });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("createBlogPostCore — validation", () => {
  it("rejects invalid input (missing title) without writing", async () => {
    const res = await createBlogPostCore(
      { ...validInput, title: "" },
      { db, getSession: admin },
    );
    expect(res.status).toBe("error");
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects an empty body without writing", async () => {
    const res = await createBlogPostCore(
      { ...validInput, body: "" },
      { db, getSession: admin },
    );
    expect(res.status).toBe("error");
    expect(create).not.toHaveBeenCalled();
  });
});

describe("createBlogPostCore — happy path", () => {
  it("derives the slug, stamps authorId from the session, and leaves a blank date as null (draft)", async () => {
    const res = await createBlogPostCore(validInput, { db, getSession: admin });
    expect(res).toEqual({ status: "ok", slug: "walking-in-covenant" });
    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0][0].data;
    expect(data.slug).toBe("walking-in-covenant");
    expect(data.title).toBe("Walking in Covenant");
    // authorId must come from the SERVER session, never from client input.
    expect(data.authorId).toBe("a1");
    expect(data.publishedAt).toBeNull();
    expect(data.coverImage).toBeNull();
  });

  it("ignores any client-supplied authorId (uses the session user)", async () => {
    await createBlogPostCore(
      { ...validInput, authorId: "attacker-id" },
      { db, getSession: admin },
    );
    expect(create.mock.calls[0][0].data.authorId).toBe("a1");
  });

  it("parses a provided publishedAt into a Date", async () => {
    await createBlogPostCore(
      { ...validInput, publishedAt: "2026-01-01T09:00" },
      { db, getSession: admin },
    );
    expect(create.mock.calls[0][0].data.publishedAt).toBeInstanceOf(Date);
  });

  it("returns a friendly error on a duplicate-slug (P2002) collision", async () => {
    create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "7",
      }),
    );
    const res = await createBlogPostCore(validInput, { db, getSession: admin });
    expect(res.status).toBe("error");
    if (res.status === "error") expect(res.errors?.slug).toBeTruthy();
  });
});

describe("updateBlogPostCore", () => {
  it("rejects a non-admin and writes nothing", async () => {
    const res = await updateBlogPostCore("p1", validInput, {
      db,
      getSession: member,
    });
    expect(res).toEqual({ status: "forbidden" });
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the targeted record on valid input (without touching authorId)", async () => {
    const res = await updateBlogPostCore("p1", validInput, {
      db,
      getSession: admin,
    });
    expect(res.status).toBe("ok");
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].where).toEqual({ id: "p1" });
    expect(update.mock.calls[0][0].data.authorId).toBeUndefined();
  });
});

describe("deleteBlogPostCore", () => {
  it("rejects a non-admin and deletes nothing", async () => {
    const res = await deleteBlogPostCore("p1", { db, getSession: anon });
    expect(res).toEqual({ status: "forbidden" });
    expect(del).not.toHaveBeenCalled();
  });

  it("deletes the targeted record for an admin", async () => {
    const res = await deleteBlogPostCore("p1", { db, getSession: admin });
    expect(res.status).toBe("ok");
    expect(del).toHaveBeenCalledWith({ where: { id: "p1" } });
  });
});
