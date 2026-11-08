import { describe, expect, it } from "vitest";
import { DEFAULT_ICP_CONFIG } from "@/lib/growth/icp-default";
import {
  evaluateJobIngestCandidate,
  looksLikeJobPosting,
} from "@/lib/growth/job-ingest-quality";

describe("looksLikeJobPosting", () => {
  it("accepts role title", () => {
    expect(
      looksLikeJobPosting({
        platform: "linkedin",
        authorName: "Co",
        bodyText: "Short desc",
        roleTitle: "Engineer",
      }),
    ).toBe(true);
  });
});

describe("evaluateJobIngestCandidate", () => {
  it("rejects non-job text", () => {
    const result = evaluateJobIngestCandidate(
      {
        platform: "linkedin",
        authorName: "X",
        bodyText: "Just sharing a photo from my vacation today.",
      },
      DEFAULT_ICP_CONFIG,
      { minCompositeScore: 0 },
    );
    expect(result.ok).toBe(false);
  });

  it("accepts internship titles that social harvest would exclude", () => {
    const result = evaluateJobIngestCandidate(
      {
        platform: "linkedin",
        authorName: "Notion",
        bodyText:
          "Software Engineering Intern, Frontend. Remote-friendly. Build product features with React and TypeScript.",
        roleTitle: "Software Engineering Intern, Frontend",
        companyName: "Notion",
        leadSource: "freehire",
      },
      DEFAULT_ICP_CONFIG,
      { minCompositeScore: 25 },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.score.compositeScore).toBeGreaterThanOrEqual(25);
    }
  });
});
