import { describe, expect, it } from "vitest";
import { DEFAULT_ICP_CONFIG } from "@/lib/growth/icp-default";
import {
  evaluateHarvestCandidate,
  signalMatchesDiscovery,
} from "@/lib/growth/harvest-quality";

describe("signalMatchesDiscovery", () => {
  it("matches when body contains search terms", () => {
    expect(
      signalMatchesDiscovery(
        "We need a developer to ship our MVP this quarter",
        "need developer",
        DEFAULT_ICP_CONFIG,
      ),
    ).toBe(true);
  });

  it("rejects unrelated posts", () => {
    expect(
      signalMatchesDiscovery(
        "Beautiful sunset at the beach today",
        "need developer",
        DEFAULT_ICP_CONFIG,
      ),
    ).toBe(false);
  });
});

describe("evaluateHarvestCandidate", () => {
  it("accepts a strong intent post", () => {
    const result = evaluateHarvestCandidate(
      {
        platform: "linkedin",
        authorName: "Jane",
        bodyText:
          "Founder here — we need a developer to harden our MVP before production launch.",
        contextSummary: "need developer",
        postedAt: new Date().toISOString(),
      },
      DEFAULT_ICP_CONFIG,
      { minCompositeScore: 40 },
    );
    expect(result.ok).toBe(true);
  });
});
