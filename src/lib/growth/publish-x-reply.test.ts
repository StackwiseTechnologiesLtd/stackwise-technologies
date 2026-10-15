import { describe, expect, it } from "vitest";
import { tweetIdFromUrl, normalizeTweetUrl } from "@/lib/growth/publish-x-reply";

describe("publish-x-reply helpers", () => {
  it("extracts tweet id", () => {
    expect(
      tweetIdFromUrl("https://x.com/someone/status/1234567890123456789"),
    ).toBe("1234567890123456789");
  });

  it("normalizes status urls", () => {
    expect(
      normalizeTweetUrl("https://twitter.com/a/status/1?s=20"),
    ).toContain("/status/1");
  });
});
