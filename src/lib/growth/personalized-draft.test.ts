import { describe, expect, it } from "vitest";
import { buildPersonalizedReplyDraft } from "@/lib/growth/personalized-draft";
import { DEFAULT_ICP_CONFIG } from "@/lib/growth/icp-default";

describe("buildPersonalizedReplyDraft", () => {
  it("falls back to template without OpenRouter key", async () => {
    const prev = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const result = await buildPersonalizedReplyDraft({
      platform: "x",
      authorName: "Jane Founder",
      bodyText: "We need help taking our MVP to production.",
      compositeScore: 80,
      scoreReasons: ["Intent: mvp"],
      config: DEFAULT_ICP_CONFIG,
    });

    expect(result.usedAi).toBe(false);
    expect(result.body.length).toBeLessThanOrEqual(280);
    expect(result.body).toContain("cal.com");
    expect(result.body.toLowerCase()).not.toContain("hi jane");

    if (prev) process.env.OPENROUTER_API_KEY = prev;
  });
});
