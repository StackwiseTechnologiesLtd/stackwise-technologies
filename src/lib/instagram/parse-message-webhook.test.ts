import { describe, expect, it } from "vitest";
import { parseInstagramInboundMessages } from "@/lib/instagram/parse-message-webhook";

describe("parseInstagramInboundMessages", () => {
  it("parses inbound DM text", () => {
    const body = {
      object: "instagram",
      entry: [
        {
          id: "17841400000000000",
          messaging: [
            {
              sender: { id: "12345", username: "maya.creates" },
              recipient: { id: "17841400000000000" },
              message: { mid: "mid-1", text: "PRICING" },
            },
          ],
        },
      ],
    };
    const parsed = parseInstagramInboundMessages(body);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.triggerType).toBe("dm");
    expect(parsed[0]?.text).toBe("PRICING");
  });

  it("marks story replies", () => {
    const body = {
      object: "instagram",
      entry: [
        {
          id: "17841400000000000",
          changes: [
            {
              field: "messages",
              value: {
                sender: { id: "99" },
                message: {
                  mid: "mid-story",
                  text: "GUIDE",
                  reply_to: { story: { id: "st1" } },
                },
              },
            },
          ],
        },
      ],
    };
    const parsed = parseInstagramInboundMessages(body);
    expect(parsed[0]?.triggerType).toBe("story_reply");
  });
});