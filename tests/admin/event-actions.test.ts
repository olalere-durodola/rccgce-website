import { describe, it, expect, vi, beforeEach } from "vitest";

// rbac -> @/lib/auth pulls the real NextAuth runtime; stub it out.
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

import { Prisma } from "@prisma/client";

import {
  createEventCore,
  updateEventCore,
  deleteEventCore,
} from "@/app/admin/events/event-core";

const create = vi.fn();
const update = vi.fn();
const del = vi.fn();

const db = {
  event: {
    create: (a: unknown) => create(a),
    update: (a: unknown) => update(a),
    delete: (a: unknown) => del(a),
  },
};

const admin = async () => ({ user: { id: "a1", role: "ADMIN" } }) as never;
const member = async () => ({ user: { id: "m1", role: "MEMBER" } }) as never;
const anon = async () => null;

const validInput = {
  title: "Annual Convention",
  description: "A gathering.",
  startsAt: "2026-09-01T10:00",
  endsAt: "",
  location: "Main Auditorium",
  imageUrl: "",
  isFeatured: true,
};

beforeEach(() => {
  create.mockReset();
  update.mockReset();
  del.mockReset();
  create.mockResolvedValue({ slug: "annual-convention" });
  update.mockResolvedValue({ slug: "annual-convention" });
  del.mockResolvedValue({ slug: "annual-convention" });
});

describe("createEventCore — admin enforcement", () => {
  it("rejects an unauthenticated caller and writes nothing", async () => {
    const res = await createEventCore(validInput, { db, getSession: anon });
    expect(res).toEqual({ status: "forbidden" });
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a non-admin (MEMBER) caller and writes nothing", async () => {
    const res = await createEventCore(validInput, { db, getSession: member });
    expect(res).toEqual({ status: "forbidden" });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("createEventCore — validation", () => {
  it("rejects invalid input (missing title) without writing", async () => {
    const res = await createEventCore(
      { ...validInput, title: "" },
      { db, getSession: admin },
    );
    expect(res.status).toBe("error");
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a malformed imageUrl without writing", async () => {
    const res = await createEventCore(
      { ...validInput, imageUrl: "not-a-url" },
      { db, getSession: admin },
    );
    expect(res.status).toBe("error");
    expect(create).not.toHaveBeenCalled();
  });
});

describe("createEventCore — happy path", () => {
  it("derives the slug from the title and persists normalized data", async () => {
    const res = await createEventCore(validInput, { db, getSession: admin });
    expect(res).toEqual({ status: "ok", slug: "annual-convention" });
    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0][0].data;
    expect(data.slug).toBe("annual-convention");
    expect(data.title).toBe("Annual Convention");
    expect(data.startsAt).toBeInstanceOf(Date);
    // empty optional date -> null; empty optional string -> null
    expect(data.endsAt).toBeNull();
    expect(data.imageUrl).toBeNull();
    expect(data.isFeatured).toBe(true);
  });

  it("returns a friendly error on a duplicate-slug (P2002) collision", async () => {
    create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "7",
      }),
    );
    const res = await createEventCore(validInput, { db, getSession: admin });
    expect(res.status).toBe("error");
    if (res.status === "error") expect(res.errors?.slug).toBeTruthy();
  });
});

describe("updateEventCore", () => {
  it("rejects a non-admin and writes nothing", async () => {
    const res = await updateEventCore("e1", validInput, {
      db,
      getSession: member,
    });
    expect(res).toEqual({ status: "forbidden" });
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the targeted record on valid input", async () => {
    const res = await updateEventCore("e1", validInput, {
      db,
      getSession: admin,
    });
    expect(res.status).toBe("ok");
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].where).toEqual({ id: "e1" });
  });
});

describe("deleteEventCore", () => {
  it("rejects a non-admin and deletes nothing", async () => {
    const res = await deleteEventCore("e1", { db, getSession: anon });
    expect(res).toEqual({ status: "forbidden" });
    expect(del).not.toHaveBeenCalled();
  });

  it("deletes the targeted record for an admin", async () => {
    const res = await deleteEventCore("e1", { db, getSession: admin });
    expect(res.status).toBe("ok");
    expect(del).toHaveBeenCalledWith({ where: { id: "e1" } });
  });
});
