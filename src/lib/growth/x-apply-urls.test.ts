import { describe, expect, it } from "vitest";
import {
  extractUrlsFromPostText,
  normalizeBrokenPostUrls,
  pickBestApplyUrl,
  postBodyNeedsThreadApplyLink,
  resolveApplyUrlFromPostBody,
} from "@/lib/growth/x-apply-urls";

describe("x-apply-urls", () => {
  it("fixes line-broken https in stored post text", () => {
    const raw = "Apply here:\nhttps://\njobs.ashbyhq.com/quora/eng";
    expect(extractUrlsFromPostText(raw)).toContain(
      "https://jobs.ashbyhq.com/quora/eng",
    );
  });

  it("prefers ashby over random links", () => {
    const urls = [
      "https://example.com/blog",
      "https://jobs.ashbyhq.com/acme/role",
    ];
    expect(pickBestApplyUrl(urls)).toBe("https://jobs.ashbyhq.com/acme/role");
  });

  it("detects apply link in reply hint", () => {
    expect(
      postBodyNeedsThreadApplyLink("Apply link in the reply 👇\n#hiring"),
    ).toBe(true);
    expect(
      postBodyNeedsThreadApplyLink(
        "Please apply directly through the link in the main post",
      ),
    ).toBe(true);
  });

  it("resolveApplyUrlFromPostBody", () => {
    const body = "Role open https://boards.greenhouse.io/acme/jobs/1";
    expect(resolveApplyUrlFromPostBody(body)).toMatch(/greenhouse/);
  });

  it("normalizeBrokenPostUrls", () => {
    expect(normalizeBrokenPostUrls("see https://\ncareers.foo.com/j")).toContain(
      "https://careers.foo.com/j",
    );
  });
});