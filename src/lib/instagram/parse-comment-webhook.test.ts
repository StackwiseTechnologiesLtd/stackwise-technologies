import { describe, expect, it } from "vitest";
import { parseInstagramCommentWebhooks } from "@/lib/instagram/parse-comment-webhook";

describe("parseInstagramCommentWebhooks", () => {
  it("parses comment change payloads", () => {
    const body = {
      object: "instagram",
      entry: [
        {
          id: "17841400000000000",
          time: 123,
          changes: [
            {
              field: "comments",
              value: {
                id: "comment123",
                text: "GUIDE",
                media: { id: "media456" },
                from: { id: "user789", username: "maya.creates" },
              },
            },
          ],
        },
      ],
    };
    const parsed = parseInstagramCommentWebhooks(body);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.commentId).toBe("comment123");
    expect(parsed[0]?.mediaId).toBe("media456");
    expect(parsed[0]?.igAccountId).toBe("17841400000000000");
  });
});