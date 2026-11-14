import { commentMatchesKeyword, renderInstagramTemplate } from "@/lib/instagram/keyword";
import { isInstagramAccountRateLimited } from "@/lib/instagram/rate-limit";
import type { InstagramCampaign, InstagramCampaignTrigger } from "@/lib/instagram/types";
import {
  getDeliveryByTriggerId,
  insertDelivery,
  listCampaigns,
} from "@/lib/instagram/repository";

export async function processInstagramKeywordTrigger(input: {
  accountId: string;
  campaignTrigger: InstagramCampaignTrigger;
  mediaId: string | null;
  externalId: string;
  text: string;
  recipientIgsid: string;
  recipientUsername: string | null;
  deliveryTriggerType: string;
  processQueued: (deliveryId: string) => void;
}): Promise<boolean> {
  if (await isInstagramAccountRateLimited(input.accountId)) {
    await insertDelivery({
      campaignId: null,
      accountId: input.accountId,
      status: "skipped",
      skipReason: "rate_limited",
      triggerType: input.deliveryTriggerType,
      triggerExternalId: `${input.externalId}:rate:${Date.now()}`,
      recipientIgsid: input.recipientIgsid,
      recipientUsername: input.recipientUsername,
      triggerText: input.text,
    });
    return true;
  }

  const campaignsForAccount = await listCampaigns(input.accountId);
  const eligible = campaignsForAccount.filter((c) => c.triggerType === input.campaignTrigger);

  const scoped = input.mediaId
    ? eligible.filter((c) => c.mediaId === input.mediaId)
    : eligible.filter((c) => !c.mediaId);

  const keywordMatch = scoped.find((c) => commentMatchesKeyword(input.text, c.keyword));

  if (keywordMatch && !keywordMatch.active) {
    await insertDelivery({
      campaignId: keywordMatch.id,
      accountId: input.accountId,
      status: "skipped",
      skipReason: "campaign_inactive",
      triggerExternalId: input.externalId,
      recipientIgsid: input.recipientIgsid,
      recipientUsername: input.recipientUsername,
      triggerText: input.text,
      triggerType: input.deliveryTriggerType,
    });
    return true;
  }

  if (scoped.length > 0 && !keywordMatch) {
    await insertDelivery({
      campaignId: null,
      accountId: input.accountId,
      status: "skipped",
      skipReason: "no_keyword_match",
      triggerExternalId: input.externalId,
      recipientIgsid: input.recipientIgsid,
      recipientUsername: input.recipientUsername,
      triggerText: input.text,
      triggerType: input.deliveryTriggerType,
    });
    return true;
  }

  if (!keywordMatch?.active) {
    return false;
  }

  if (await getDeliveryByTriggerId(input.externalId)) {
    await insertDelivery({
      campaignId: keywordMatch.id,
      accountId: input.accountId,
      status: "skipped",
      skipReason: "duplicate",
      triggerExternalId: `${input.externalId}:dup:${crypto.randomUUID().slice(0, 8)}`,
      recipientIgsid: input.recipientIgsid,
      recipientUsername: input.recipientUsername,
      triggerText: input.text,
      triggerType: input.deliveryTriggerType,
    });
    return true;
  }

  const preview = buildPreviewMessage(keywordMatch, input.recipientUsername);

  const deliveryId = await insertDelivery({
    campaignId: keywordMatch.id,
    accountId: input.accountId,
    status: "queued",
    triggerExternalId: input.externalId,
    recipientIgsid: input.recipientIgsid,
    recipientUsername: input.recipientUsername,
    triggerText: input.text,
    privateReplyPreview: preview,
    triggerType: input.deliveryTriggerType,
  });
  input.processQueued(deliveryId);
  return true;
}

function buildPreviewMessage(
  campaign: InstagramCampaign,
  username: string | null,
): string {
  return renderInstagramTemplate(campaign.privateReplyTemplate, { username });
}