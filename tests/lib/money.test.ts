import { describe, it, expect } from "vitest";
import {
  dollarsToCents,
  centsToDollars,
  formatCents,
  parseAmountToCents,
} from "@/lib/money";

describe("dollarsToCents", () => {
  it("converts whole and fractional dollars to integer cents", () => {
    expect(dollarsToCents(25)).toBe(2500);
    expect(dollarsToCents(9.5)).toBe(950);
    expect(dollarsToCents(0.01)).toBe(1);
  });

  it("rounds float artifacts correctly", () => {
    // 19.99 * 100 = 1998.9999... in float; must round to 1999.
    expect(dollarsToCents(19.99)).toBe(1999);
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
  });
});

describe("centsToDollars", () => {
  it("converts integer cents back to a dollar number", () => {
    expect(centsToDollars(2500)).toBe(25);
    expect(centsToDollars(1999)).toBe(19.99);
    expect(centsToDollars(1)).toBe(0.01);
  });
});

describe("formatCents", () => {
  it("formats cents as a $X.XX string", () => {
    expect(formatCents(2500)).toBe("$25.00");
    expect(formatCents(1999)).toBe("$19.99");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(5)).toBe("$0.05");
  });
});

describe("parseAmountToCents", () => {
  it("parses a PayPal amount string to integer cents", () => {
    expect(parseAmountToCents("150.00")).toBe(15000);
    expect(parseAmountToCents("9.50")).toBe(950);
    expect(parseAmountToCents("19.99")).toBe(1999);
  });

  it("parses a number value too", () => {
    expect(parseAmountToCents(25)).toBe(2500);
  });

  it("returns null for garbled / missing / non-finite values", () => {
    expect(parseAmountToCents(undefined)).toBeNull();
    expect(parseAmountToCents(null)).toBeNull();
    expect(parseAmountToCents("")).toBeNull();
    expect(parseAmountToCents("abc")).toBeNull();
    expect(parseAmountToCents(NaN)).toBeNull();
    expect(parseAmountToCents(Infinity)).toBeNull();
    expect(parseAmountToCents(-5)).toBeNull();
    expect(parseAmountToCents(0)).toBeNull();
  });
});
