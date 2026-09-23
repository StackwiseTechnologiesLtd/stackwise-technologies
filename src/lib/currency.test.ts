import { describe, expect, it } from "vitest";
import {
  formatMoney,
  localAmountFromUsd,
  roundForCurrency,
} from "@/lib/currency";

describe("roundForCurrency", () => {
  it("rounds XAF to whole numbers", () => {
    expect(roundForCurrency(1234.56, "XAF")).toBe(1235);
  });

  it("keeps two decimals for ZMW", () => {
    expect(roundForCurrency(99.999, "ZMW")).toBe(100);
  });
});

describe("localAmountFromUsd", () => {
  it("rounds KES to whole numbers", () => {
    expect(localAmountFromUsd(199, 129.4367, "KES")).toBe(25758);
  });

  it("keeps two decimals for ZMW", () => {
    expect(localAmountFromUsd(99.99, 27.5, "ZMW")).toBe(2749.73);
  });
});

describe("formatMoney", () => {
  it("formats USD amounts", () => {
    expect(formatMoney(1500, "USD")).toMatch(/1,500/);
  });
});
