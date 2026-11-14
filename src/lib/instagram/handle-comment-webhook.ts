import { parseInstagramCommentWebhooks } from "@/lib/instagram/parse-comment-webhook";
import { processInstagramKeywordTrigger } from "@/lib/instagram/process-trigger";
import { findAccountByIgUserId, recordWebhookReceipt } from "@/lib/instagram/repository";

export async function handleInstagramCommentWebhook(input: {
  metaAppId: string | null;
  body: unknown;
  processQueued: (deliveryId: string) => void;
}): Promise<{ handled: number }> {
  const comments = parseInstagramCommentWebhooks(input.body);
  let handled = 0;

  for (const comment of comments) {
    const account = await findAccountByIgUserId(comment.igAccountId);
    if (!account) continue;

    const outcome = await processInstagramKeywordTrigger({
      accountId: account.id,
      campaignTrigger: "comment",
      mediaId: comment.mediaId,
      externalId: comment.commentId,
      text: comment.text,
      recipientIgsid: comment.fromId,
      recipientUsername: comment.fromUsername,
      deliveryTriggerType: "comment",
      processQueued: input.processQueued,
    });
    if (outcome.handled) handled += 1;
  }

  return { handled };
}