import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the prisma client so the server action can run without a database.
const upsert = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: { newsletterSignup: { upsert: (...args: unknown[]) => upsert(...args) } },
}));

import { subscribeNewsletter, type NewsletterState } from "@/app/actions";

const initial: NewsletterState = { status: "idle" };

function form(email: unknown): FormData {
  const fd = new FormData();
  if (email !== undefined) fd.set("email", String(email));
  return fd;
}

describe("subscribeNewsletter", () => {
  beforeEach(() => {
    upsert.mockReset();
    upsert.mockResolvedValue({});
  });

  it("rejects an invalid email without touching the database", async () => {
    const result = await subscribeNewsletter(initial, form("not-an-email"));
    expect(result.status).toBe("error");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("subscribes a valid email, normalizing to lowercase", async () => {
    const result = await subscribeNewsletter(initial, form("Jane@Example.com"));
    expect(result.status).toBe("success");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "jane@example.com" } }),
    );
  });

  it("returns an error when the database write fails", async () => {
    upsert.mockRejectedValueOnce(new Error("db down"));
    const result = await subscribeNewsletter(initial, form("jane@example.com"));
    expect(result.status).toBe("error");
  });
});
