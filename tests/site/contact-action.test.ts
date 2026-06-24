import { describe, it, expect, vi, beforeEach } from "vitest";

import { submitContact, type ContactState } from "@/app/(marketing)/contact/actions";

const initial: ContactState = { status: "idle" };

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("submitContact", () => {
  it("returns success on valid input", async () => {
    const result = await submitContact(
      initial,
      form({
        name: "Jane Doe",
        email: "jane@example.com",
        message: "Hello, I'd like to visit this Sunday.",
      }),
    );
    expect(result.status).toBe("success");
  });

  it("returns an error with field hints on invalid input", async () => {
    const result = await submitContact(
      initial,
      form({ name: "", email: "not-an-email", message: "" }),
    );
    expect(result.status).toBe("error");
    expect(result.errors?.name).toBeTruthy();
    expect(result.errors?.email).toBeTruthy();
    expect(result.errors?.message).toBeTruthy();
  });

  it("rejects a missing email", async () => {
    const result = await submitContact(
      initial,
      form({ name: "Jane", message: "Hi" }),
    );
    expect(result.status).toBe("error");
    expect(result.errors?.email).toBeTruthy();
  });
});
