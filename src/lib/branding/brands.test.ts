import { describe, expect, it } from "vitest";
import { getBrand, listBrands } from "./brands";

describe("getBrand", () => {
  it("returns opsis brand by slug", () => {
    const brand = getBrand("opsis");
    expect(brand).toBeDefined();
    expect(brand?.slug).toBe("opsis");
    expect(brand?.heroTitle).toContain("Opsis Partners");
  });

  it("returns undefined for unknown slug", () => {
    expect(getBrand("unknown")).toBeUndefined();
  });

  it("lists registered brands", () => {
    expect(listBrands().map((b) => b.slug)).toContain("opsis");
  });
});
