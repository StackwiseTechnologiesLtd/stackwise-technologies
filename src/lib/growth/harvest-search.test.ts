import { describe, expect, it } from "vitest";
import {
  buildJobSearchQueriesFromIcp,
  linkedinJobsSearchUrl,
} from "@/lib/growth/harvest-search";

describe("linkedinJobsSearchUrl", () => {
  it("adds remote workplace filter by default", () => {
    const url = linkedinJobsSearchUrl("full stack developer");
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
  it("uses title keywords", () => {
    expect(
      buildJobSearchQueriesFromIcp({
        titleKeywords: ["Full Stack", "Founding Engineer"],
        titleExclusions: [],
        intentPhrases: [],
        locations: [],
      }),
    ).toEqual(["Full Stack", "Founding Engineer"]);
  });
});
