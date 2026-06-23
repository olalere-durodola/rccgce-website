import { describe, it, expect, vi, beforeEach } from "vitest";

const upsert = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    newsletterSignup: { upsert: (...args: unknown[]) => upsert(...args) },
  },
}));

import { POST } from "@/app/api/newsletter/route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/newsletter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  upsert.mockReset();
  upsert.mockResolvedValue({});
});

describe("POST /api/newsletter", () => {
  it("subscribes a valid email and returns ok", async () => {
    const res = await POST(jsonRequest({ email: "Jane@Example.com" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    // normalized to lowercase
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "jane@example.com" } }),
    );
  });

  it("returns 400 for an invalid email without touching the database", async () => {
    const res = await POST(jsonRequest({ email: "nope" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed JSON body", async () => {
    const req = new Request("http://localhost/api/newsletter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("treats a duplicate email as success (idempotent upsert)", async () => {
    // upsert resolves whether or not the row already existed.
    const res = await POST(jsonRequest({ email: "dup@example.com" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
