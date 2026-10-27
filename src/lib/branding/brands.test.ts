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

  it("returns aetheri brand by slug", () => {
    const brand = getBrand("aetheri");
    expect(brand).toBeDefined();
    expect(brand?.slug).toBe("aetheri");
    expect(brand?.heroTitle).toContain("Aetheri Medical");
  });

  it("lists registered brands", () => {
    const slugs = listBrands().map((b) => b.slug);
    expect(slugs).toContain("opsis");
    expect(slugs).toContain("aetheri");
  });
});
