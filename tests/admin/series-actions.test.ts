import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

import {
  createSeriesCore,
  updateSeriesCore,
  deleteSeriesCore,
} from "@/app/admin/series/series-core";

const create = vi.fn();
const update = vi.fn();
const del = vi.fn();

const db = {
  series: {
    create: (a: unknown) => create(a),
    update: (a: unknown) => update(a),
    delete: (a: unknown) => del(a),
  },
};

const admin = async () => ({ user: { id: "a1", role: "ADMIN" } }) as never;
const member = async () => ({ user: { id: "m1", role: "MEMBER" } }) as never;
const anon = async () => null;

const validInput = {
  title: "Foundations of Faith",
  description: "A teaching series.",
  imageUrl: "",
};

beforeEach(() => {
  create.mockReset();
  update.mockReset();
  del.mockReset();
  create.mockResolvedValue({ slug: "foundations-of-faith" });
  update.mockResolvedValue({ slug: "foundations-of-faith" });
  del.mockResolvedValue({ slug: "foundations-of-faith" });
});

describe("series core — admin enforcement", () => {
  it("create rejects unauthenticated, writes nothing", async () => {
    const res = await createSeriesCore(validInput, { db, getSession: anon });
    expect(res).toEqual({ status: "forbidden" });
    expect(create).not.toHaveBeenCalled();
  });

  it("create rejects a MEMBER, writes nothing", async () => {
    const res = await createSeriesCore(validInput, { db, getSession: member });
    expect(res).toEqual({ status: "forbidden" });
    expect(create).not.toHaveBeenCalled();
  });

  it("update rejects a non-admin, writes nothing", async () => {
    const res = await updateSeriesCore("s1", validInput, {
      db,
      getSession: member,
    });
    expect(res).toEqual({ status: "forbidden" });
    expect(update).not.toHaveBeenCalled();
  });

  it("delete rejects a non-admin, deletes nothing", async () => {
    const res = await deleteSeriesCore("s1", { db, getSession: anon });
    expect(res).toEqual({ status: "forbidden" });
    expect(del).not.toHaveBeenCalled();
  });
});

describe("series core — happy path & validation", () => {
  it("creates with a slug derived from the title", async () => {
    const res = await createSeriesCore(validInput, { db, getSession: admin });
    expect(res).toEqual({ status: "ok", slug: "foundations-of-faith" });
    expect(create.mock.calls[0][0].data.slug).toBe("foundations-of-faith");
    expect(create.mock.calls[0][0].data.imageUrl).toBeNull();
  });

  it("rejects an empty title without writing", async () => {
    const res = await createSeriesCore(
      { title: "", description: "x" },
      { db, getSession: admin },
    );
    expect(res.status).toBe("error");
    expect(create).not.toHaveBeenCalled();
  });

  it("updates the targeted record", async () => {
    const res = await updateSeriesCore("s1", validInput, {
      db,
      getSession: admin,
    });
    expect(res.status).toBe("ok");
    expect(update.mock.calls[0][0].where).toEqual({ id: "s1" });
  });

  it("deletes the targeted record", async () => {
    const res = await deleteSeriesCore("s1", { db, getSession: admin });
    expect(res.status).toBe("ok");
    expect(del).toHaveBeenCalledWith({ where: { id: "s1" } });
  });
});
