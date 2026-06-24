import { describe, it, expect } from "vitest";
import {
  registerSchema,
  donationSchema,
  sermonSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Jane",
      email: "not-an-email",
      password: "longenough",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 chars", () => {
    const result = registerSchema.safeParse({
      name: "Jane",
      email: "jane@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });
});

describe("donationSchema", () => {
  it("rejects amount <= 0", () => {
    expect(donationSchema.safeParse({ amount: 0, fund: "Tithe" }).success).toBe(
      false,
    );
    expect(
      donationSchema.safeParse({ amount: -10, fund: "Tithe" }).success,
    ).toBe(false);
  });

  it("rejects an unknown fund", () => {
    expect(
      donationSchema.safeParse({ amount: 50, fund: "Yacht" }).success,
    ).toBe(false);
  });

  it("accepts a valid donation", () => {
    const result = donationSchema.safeParse({ amount: 50, fund: "Tithe" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
    }
  });
});

describe("sermonSchema", () => {
  it("rejects an empty title", () => {
    expect(
      sermonSchema.safeParse({
        title: "",
        slug: "grace",
        speaker: "Pastor",
        date: "2026-01-01",
      }).success,
    ).toBe(false);
  });

  it("rejects an empty slug", () => {
    expect(
      sermonSchema.safeParse({
        title: "Grace",
        slug: "",
        speaker: "Pastor",
        date: "2026-01-01",
      }).success,
    ).toBe(false);
  });
});
