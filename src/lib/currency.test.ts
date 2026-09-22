import { describe, expect, it } from "vitest";
import { roundForCurrency, formatMoney } from "@/lib/currency";

describe("roundForCurrency", () => {
  it("rounds XAF to whole numbers", () => {
    expect(roundForCurrency(1234.56, "XAF")).toBe(1235);
  });

  it("keeps two decimals for ZMW", () => {
    expect(roundForCurrency(99.999, "ZMW")).toBe(100);
  });
});

describe("formatMoney", () => {
  it("formats USD amounts", () => {
    expect(formatMoney(1500, "USD")).toMatch(/1,500/);
  });
});
