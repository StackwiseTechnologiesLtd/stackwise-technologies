import { describe, expect, it } from "vitest";
import { DEFAULT_ICP_CONFIG } from "@/lib/growth/icp-default";
import { scoreLead } from "@/lib/growth/scoring";

describe("scoreLead", () => {
  it("scores high for founder asking for production help", () => {
    const result = scoreLead({
      roleTitle: "Founder & CEO",
      bodyText:
        "We shipped an MVP with AI but need help hardening it for production and payments.",
      config: DEFAULT_ICP_CONFIG,
    });
    expect(result.compositeScore).toBeGreaterThanOrEqual(60);
    expect(result.reasons.some((r) => r.includes("Intent"))).toBe(true);
  });

  it("scores low for student posts", () => {
    const result = scoreLead({
      roleTitle: "Computer Science Student",
      bodyText: "Learning to code and building side projects.",
      config: DEFAULT_ICP_CONFIG,
    });
    expect(result.compositeScore).toBeLessThan(50);
  });
});
