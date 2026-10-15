import { describe, expect, it } from "vitest";
import { sortLeadsByCompositeScore } from "@/lib/growth/lead-sort";
import type { GrowthLead } from "@/lib/growth/types";

function lead(id: string, score: number): GrowthLead {
  return {
    id,
    signalId: null,
    fullName: id,
    roleTitle: null,
    companyName: null,
    profileUrl: null,
    email: null,
    platform: "x",
    icpScore: score,
    intentScore: score,
    compositeScore: score,
    scoreReasons: [],
    pipelineStatus: "new",
    feedbackNote: null,
    profileSummary: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

describe("sortLeadsByCompositeScore", () => {
  it("orders highest composite score first", () => {
    const sorted = sortLeadsByCompositeScore([
      lead("a", 40),
      lead("b", 90),
      lead("c", 55),
    ]);
    expect(sorted.map((l) => l.id)).toEqual(["b", "c", "a"]);
  });
});
