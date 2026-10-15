import { describe, expect, it } from "vitest";
import {
  fitXReply,
  finalizeReplyForPlatform,
  X_REPLY_MAX_LENGTH,
} from "@/lib/growth/x-reply-format";

describe("fitXReply", () => {
  it("strips Hi name cold open and enforces max length", () => {
    const long =
      "Hi Amit, hope this finds you well. " +
      "x".repeat(400) +
      "\nhttps://cal.com/stackwise-technologies/30min";
    const out = fitXReply(long);
    expect(out.length).toBeLessThanOrEqual(X_REPLY_MAX_LENGTH);
    expect(out.toLowerCase()).not.toContain("hope this finds you");
    expect(out).toContain("cal.com");
  });

  it("leaves linkedin replies unchanged", () => {
    const text = "Hi Jane,\n\nLong linkedin message.";
    expect(finalizeReplyForPlatform("linkedin", text)).toBe(text);
  });
});
