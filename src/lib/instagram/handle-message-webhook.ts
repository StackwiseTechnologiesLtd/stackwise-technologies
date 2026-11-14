import { recordInboundInstagramMessage } from "@/lib/instagram/inbox-repository";
import { parseInstagramInboundMessages } from "@/lib/instagram/parse-message-webhook";
import { processInstagramKeywordTrigger } from "@/lib/instagram/process-trigger";
import { findAccountByIgUserId } from "@/lib/instagram/repository";

export async function handleInstagramMessageWebhook(input: {
  body: unknown;
  processQueued: (deliveryId: string) => void;
}): Promise<{ handled: number }> {
  const messages = parseInstagramInboundMessages(input.body);
  let handled = 0;

  for (const msg of messages) {
    const account = await findAccountByIgUserId(msg.igAccountId);
    if (!account) continue;

    if (msg.text) {
      await recordInboundInstagramMessage({
        accountId: account.id,
        participantIgsid: msg.fromId,
        participantUsername: msg.fromUsername,
        externalMessageId: msg.messageId,
        bodyText: msg.text,
      });
    }

    const did = await processInstagramKeywordTrigger({
      accountId: account.id,
      campaignTrigger: msg.triggerType,
      mediaId: null,
      externalId: msg.messageId,
      text: msg.text,
      recipientIgsid: msg.fromId,
      recipientUsername: msg.fromUsername,
      deliveryTriggerType: msg.triggerType,
      processQueued: input.processQueued,
    });
    if (did) handled += 1;
  }

  return { handled };
}