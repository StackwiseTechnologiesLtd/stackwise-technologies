import { describe, expect, it } from "vitest";
import { linkedInFeedUrlFromUrn, resolveGrowthPostUrl } from "@/lib/growth/post-url";

describe("resolveGrowthPostUrl", () => {
  it("normalizes relative X status links", () => {
    expect(
      resolveGrowthPostUrl({
        platform: "x",
        sourceUrl: "/user/status/123",
      }),
    ).toBe("https://x.com/user/status/123");
  });

  it("builds LinkedIn feed URL from urn when link missing", () => {
    const urn = "urn:li:activity:123";
    expect(linkedInFeedUrlFromUrn(urn)).toBe(
      "https://www.linkedin.com/feed/update/urn%3Ali%3Aactivity%3A123/",
    );
  });

  it("falls back to LinkedIn profile when post URL missing", () => {
    expect(
      resolveGrowthPostUrl({
        platform: "linkedin",
        sourceUrl: null,
        authorProfileUrl: "https://www.linkedin.com/in/example/",
      }),
    ).toBe("https://www.linkedin.com/in/example/");
  });
});
