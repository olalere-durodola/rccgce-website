import { describe, it, expect } from "vitest";
import {
  RECURRING_AMOUNTS,
  isPresetRecurringAmount,
} from "@/lib/giving-config";

describe("giving-config", () => {
  it("exposes the predefined monthly recurring amounts", () => {
    expect(RECURRING_AMOUNTS).toEqual([25, 50, 100, 250]);
  });

  it("accepts a preset recurring amount", () => {
    for (const amount of RECURRING_AMOUNTS) {
      expect(isPresetRecurringAmount(amount)).toBe(true);
    }
  });

  it("rejects a non-preset recurring amount", () => {
    expect(isPresetRecurringAmount(37)).toBe(false);
    expect(isPresetRecurringAmount(0)).toBe(false);
    expect(isPresetRecurringAmount(-50)).toBe(false);
    expect(isPresetRecurringAmount(25.5)).toBe(false);
  });
});
