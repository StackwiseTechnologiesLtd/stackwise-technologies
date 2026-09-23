import { describe, expect, it } from "vitest";
import { SERVICES_CATALOG, sumLineItemsUsd } from "@/lib/services-catalog";

describe("sumLineItemsUsd", () => {
  it("sums quantity × unit price", () => {
    expect(
      sumLineItemsUsd([
        { quantity: 2, unitPriceUsd: 500 },
        { quantity: 1, unitPriceUsd: 750 },
      ]),
    ).toBe(1750);
  });
});

describe("SERVICES_CATALOG", () => {
  it("has unique service ids", () => {
    const ids = SERVICES_CATALOG.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
