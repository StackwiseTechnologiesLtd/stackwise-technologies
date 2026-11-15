import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/instagram/repository", () => ({
  listCampaigns: vi.fn(async () => [
    {
      id: "c1",
      accountId: "a1",
      name: "Test",
      mediaId: null,
      keyword: "looial",
      triggerType: "dm",
      privateReplyTemplate: "Hi",
      publicReplyTemplate: null,
      buttonLabel1: null,
      buttonUrl1: null,
      buttonLabel2: null,
      buttonUrl2: null,
      active: true,
      createdAt: "",
      updatedAt: "",
    },
  ]),
  getDeliveryByTriggerId: vi.fn(async () => null),
  insertDelivery: vi.fn(async () => "delivery-id"),
}));

vi.mock("@/lib/instagram/rate-limit", () => ({
  isInstagramAccountRateLimited: vi.fn(async () => false),
}));

import { insertDelivery } from "@/lib/instagram/repository";
import { processInstagramKeywordTrigger } from "@/lib/instagram/process-trigger";

describe("processInstagramKeywordTrigger", () => {
  it("does not log delivery when keyword does not match", async () => {
    const insert = vi.mocked(insertDelivery);
    insert.mockClear();

    const result = await processInstagramKeywordTrigger({
      accountId: "a1",
      campaignTrigger: "dm",
      mediaId: null,
      externalId: "mid-1",
      text: "hello random",
      recipientIgsid: "123",
      recipientUsername: "user",
      deliveryTriggerType: "dm",
      processQueued: () => {},
    });

    expect(result.handled).toBe(false);
    expect(result.matchedCampaign).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });

  it("queues delivery on case-insensitive DM keyword match", async () => {
    const insert = vi.mocked(insertDelivery);
    insert.mockClear();
    let queued = false;

    const result = await processInstagramKeywordTrigger({
      accountId: "a1",
      campaignTrigger: "dm",
      mediaId: null,
      externalId: "mid-2",
      text: "LOOIAL",
      recipientIgsid: "123",
      recipientUsername: "user",
      deliveryTriggerType: "dm",
      processQueued: () => {
        queued = true;
      },
    });

    expect(result.matchedCampaign).toBe(true);
    expect(insert).toHaveBeenCalled();
    expect(queued).toBe(true);
  });
});