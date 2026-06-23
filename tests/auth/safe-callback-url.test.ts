import { describe, it, expect } from "vitest";

import { safeCallbackUrl } from "@/app/(auth)/callback-url";

describe("safeCallbackUrl", () => {
  it("allows a same-origin relative path", () => {
    expect(safeCallbackUrl("/admin/sermons")).toBe("/admin/sermons");
    expect(safeCallbackUrl("/account?tab=saved")).toBe("/account?tab=saved");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeCallbackUrl("//evil.com")).toBe("/account");
  });

  it("rejects absolute URLs", () => {
    expect(safeCallbackUrl("https://evil.com")).toBe("/account");
    expect(safeCallbackUrl("http://evil.com/x")).toBe("/account");
  });

  it("rejects backslash protocol-relative tricks", () => {
    expect(safeCallbackUrl("/\\evil.com")).toBe("/account");
  });

  it("falls back to /account on missing or non-string input", () => {
    expect(safeCallbackUrl(undefined)).toBe("/account");
    expect(safeCallbackUrl(null)).toBe("/account");
    expect(safeCallbackUrl("")).toBe("/account");
    expect(safeCallbackUrl("relative-no-slash")).toBe("/account");
  });
});
