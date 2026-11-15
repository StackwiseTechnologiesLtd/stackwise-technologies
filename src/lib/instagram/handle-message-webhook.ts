import { recordInboundInstagramMessage } from "@/lib/instagram/inbox-repository";
import { parseInstagramInboundMessages } from "@/lib/instagram/parse-message-webhook";
import { processInstagramKeywordTrigger } from "@/lib/instagram/process-trigger";
import {
  findAccountByIgUserId,
  hasInstagramCampaignParticipant,
} from "@/lib/instagram/repository";
import { maybeRefreshInstagramAccountProfile } from "@/lib/instagram/sync-account-profile";

export async function handleInstagramMessageWebhook(input: {
  body: unknown;
  processQueued: (deliveryId: string) => void;
}): Promise<{ handled: number }> {
  const messages = parseInstagramInboundMessages(input.body);
  let handled = 0;

  for (const msg of messages) {
    const account = await findAccountByIgUserId(msg.igAccountId);
    if (!account) continue;

    void maybeRefreshInstagramAccountProfile(account.id);

    const inCampaignThread = await hasInstagramCampaignParticipant(
      account.id,
      msg.fromId,
    );

    const outcome = await processInstagramKeywordTrigger({
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

    if (
      msg.text &&
      (inCampaignThread || outcome.matchedCampaign)
    ) {
      await recordInboundInstagramMessage({
        accountId: account.id,
        participantIgsid: msg.fromId,
        participantUsername: msg.fromUsername,
        externalMessageId: msg.messageId,
        bodyText: msg.text,
      });
    }

    if (outcome.handled) handled += 1;
  }

  return { handled };
}