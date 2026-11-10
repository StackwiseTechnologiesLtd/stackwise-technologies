import { describe, expect, it } from "vitest";
import {
  buildJobSearchQueriesFromIcp,
  linkedinJobsSearchUrl,
} from "@/lib/growth/harvest-search";

describe("linkedinJobsSearchUrl", () => {
  it("adds remote workplace filter by default", () => {
    const url = linkedinJobsSearchUrl("full stack developer");
    expect(url).toContain("/jobs/search-results/");
    expect(url).toContain("keywords=full+stack+developer");
    expect(url).toContain("f_WT=2");
    expect(url).toContain("sortBy=DD");
  });

  it("can omit remote filter", () => {
    const url = linkedinJobsSearchUrl("engineer", { remote: false });
    expect(url).not.toContain("f_WT");
  });
});

describe("buildJobSearchQueriesFromIcp", () => {
  it("uses role title keywords and pads with engineering defaults", () => {
    expect(
      buildJobSearchQueriesFromIcp({
        titleKeywords: ["Full Stack", "Founding Engineer"],
        titleExclusions: [],
        intentPhrases: [],
        locations: [],
      }),
    ).toEqual([
      "Full Stack",
      "Founding Engineer",
      "full stack developer",
      "software engineer",
    ]);
  });

  it("skips person titles like founder/CEO", () => {
    const queries = buildJobSearchQueriesFromIcp({
      titleKeywords: ["Founder", "CEO", "CTO"],
      titleExclusions: [],
      intentPhrases: [],
      locations: [],
    });
    expect(queries[0]).toBe("full stack developer");
    expect(queries).not.toContain("Founder");
  });
});
