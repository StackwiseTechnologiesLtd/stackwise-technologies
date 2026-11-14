import { commentMatchesKeyword, renderInstagramTemplate } from "@/lib/instagram/keyword";
import { parseInstagramCommentWebhooks } from "@/lib/instagram/parse-comment-webhook";
import {
  findAccountByIgUserId,
  getDeliveryByTriggerId,
  insertDelivery,
  listCampaigns,
  recordWebhookReceipt,
} from "@/lib/instagram/repository";

export async function handleInstagramCommentWebhook(input: {
  metaAppId: string | null;
  body: unknown;
  processQueued: (deliveryId: string) => void;
}): Promise<{ handled: number }> {
  await recordWebhookReceipt(input.metaAppId);

  const comments = parseInstagramCommentWebhooks(input.body);
  let handled = 0;

  for (const comment of comments) {
    const account = await findAccountByIgUserId(comment.igAccountId);
    if (!account) continue;

    const campaignsForAccount = await listCampaigns(account.id);
    const onMedia = campaignsForAccount.filter((c) => c.mediaId === comment.mediaId);
    const keywordMatch = onMedia.find((c) =>
      commentMatchesKeyword(comment.text, c.keyword),
    );

    if (keywordMatch && !keywordMatch.active) {
      await insertDelivery({
        campaignId: keywordMatch.id,
        accountId: account.id,
        status: "skipped",
        skipReason: "campaign_inactive",
        triggerExternalId: comment.commentId,
        recipientIgsid: comment.fromId,
        recipientUsername: comment.fromUsername,
        triggerText: comment.text,
      });
      handled += 1;
      continue;
    }

    if (onMedia.length > 0 && !keywordMatch) {
      await insertDelivery({
        campaignId: null,
        accountId: account.id,
        status: "skipped",
        skipReason: "no_keyword_match",
        triggerExternalId: comment.commentId,
        recipientIgsid: comment.fromId,
        recipientUsername: comment.fromUsername,
        triggerText: comment.text,
      });
      handled += 1;
      continue;
    }

    if (!keywordMatch?.active) {
      continue;
    }

    const campaign = keywordMatch;
    if (await getDeliveryByTriggerId(comment.commentId)) {
      await insertDelivery({
        campaignId: campaign.id,
        accountId: account.id,
        status: "skipped",
        skipReason: "duplicate",
        triggerExternalId: `${comment.commentId}:dup:${crypto.randomUUID().slice(0, 8)}`,
        recipientIgsid: comment.fromId,
        recipientUsername: comment.fromUsername,
        triggerText: comment.text,
      });
      handled += 1;
      continue;
    }

    const preview = renderInstagramTemplate(campaign.privateReplyTemplate, {
      username: comment.fromUsername,
    });

    const deliveryId = await insertDelivery({
      campaignId: campaign.id,
      accountId: account.id,
      status: "queued",
      triggerExternalId: comment.commentId,
      recipientIgsid: comment.fromId,
      recipientUsername: comment.fromUsername,
      triggerText: comment.text,
      privateReplyPreview: preview,
    });
    input.processQueued(deliveryId);
    handled += 1;
  }

  return { handled };
}