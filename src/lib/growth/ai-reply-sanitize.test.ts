import { describe, expect, it } from "vitest";
import {
  looksLikeMetaReasoning,
  sanitizeOutboundReply,
} from "@/lib/growth/ai-reply-sanitize";

describe("sanitizeOutboundReply", () => {
  it("rejects chain-of-thought planning", () => {
    const raw = `The user wants me to write an outbound reply for Stackwise.
Let me review the constraints:
1. Target decision makers
https://cal.com/foo`;
    expect(looksLikeMetaReasoning(raw)).toBe(true);
    expect(sanitizeOutboundReply(raw).rejectedAsMeta).toBe(true);
  });

  it("keeps a normal short reply", () => {
    const raw = `Amit — scaling past MVP is where most side projects stall.

We help founders harden what already works without a rewrite. Happy to compare notes.

https://cal.com/foo`;
    expect(sanitizeOutboundReply(raw).rejectedAsMeta).toBe(false);
    expect(sanitizeOutboundReply(raw).text).toContain("Amit");
  });
});
