import { describe, expect, it } from "vitest";
import { generateContractDraft } from "@/lib/contracts/ai-draft";

describe("generateContractDraft", () => {
  it("returns fallback when OpenRouter is not configured", async () => {
    const prev = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const result = await generateContractDraft({
      documentKind: "sow",
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      servicesBrief: "Build a mobile app MVP.",
    });

    expect(result.bodyMarkdown).toContain("Jane Doe");
    expect(result.usedAi).toBe(false);

    if (prev) process.env.OPENROUTER_API_KEY = prev;
  });
});
