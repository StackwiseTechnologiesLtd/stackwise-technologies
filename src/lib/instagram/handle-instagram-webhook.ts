import { handleInstagramCommentWebhook } from "@/lib/instagram/handle-comment-webhook";
import { handleInstagramMessageWebhook } from "@/lib/instagram/handle-message-webhook";
import { recordWebhookReceipt } from "@/lib/instagram/repository";

export async function handleInstagramWebhook(input: {
  metaAppId: string | null;
  body: unknown;
  processQueued: (deliveryId: string) => void;
}): Promise<{ handled: number }> {
  await recordWebhookReceipt(input.metaAppId);

  const comment = await handleInstagramCommentWebhook({
    metaAppId: input.metaAppId,
    body: input.body,
    processQueued: input.processQueued,
  });
  const message = await handleInstagramMessageWebhook({
    body: input.body,
    processQueued: input.processQueued,
  });

  return { handled: comment.handled + message.handled };
}