import { describe, expect, it } from "vitest";
import { viewerCanAccessBrand } from "./access";

describe("viewerCanAccessBrand", () => {
  it("allows admin any known brand", () => {
    expect(
      viewerCanAccessBrand({ mode: "admin", email: "a@stackwisetechnologies.com" }, "opsis"),
    ).toBe(true);
  });

  it("restricts portal users to their slug", () => {
    const viewer = { mode: "portal" as const, email: "c@client.com", brandSlug: "opsis" };
    expect(viewerCanAccessBrand(viewer, "opsis")).toBe(true);
    expect(viewerCanAccessBrand(viewer, "other")).toBe(false);
  });
});
