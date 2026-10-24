import { describe, expect, it } from "vitest";
import { formatShortRelativeTime } from "@/lib/format-relative-time";

describe("formatShortRelativeTime", () => {
  it("returns empty for invalid input", () => {
    expect(formatShortRelativeTime(null)).toBe("");
    expect(formatShortRelativeTime("")).toBe("");
  });

  it("formats recent minutes", () => {
    const iso = new Date(Date.now() - 15 * 60_000).toISOString();
    expect(formatShortRelativeTime(iso)).toBe("15m");
  });
});
