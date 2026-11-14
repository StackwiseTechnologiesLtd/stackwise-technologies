import {
  isInstagramDryRun,
  sendInstagramDirectMessage,
  sendInstagramPrivateReply,
  sendInstagramPublicCommentReply,
} from "@/lib/instagram/graph-send";
import { recordOutboundInstagramMessage } from "@/lib/instagram/inbox-repository";
import { renderInstagramTemplate } from "@/lib/instagram/keyword";
import { appendTrackedButtonsToMessage } from "@/lib/instagram/tracked-links";
import {
  getAccountAccessToken,
  getAccountIgUserId,
  getDeliveryWithCampaign,
  updateDeliveryStatus,
} from "@/lib/instagram/repository";

export async function processInstagramDelivery(deliveryId: string): Promise<void> {
  const loaded = await getDeliveryWithCampaign(deliveryId);
  if (!loaded) return;

  const { delivery, campaign } = loaded;

  if (delivery.status !== "queued") {
    return;
  }

  if (!campaign) {
    await updateDeliveryStatus(deliveryId, {
      status: "skipped",
      skipReason: "campaign_missing",
    });
    return;
  }

  if (!campaign.active) {
    await updateDeliveryStatus(deliveryId, {
      status: "skipped",
      skipReason: "campaign_inactive",
    });
    return;
  }

  let message =
    delivery.privateReplyPreview ??
    renderInstagramTemplate(campaign.privateReplyTemplate, {
      username: delivery.recipientUsername,
    });

  message = await appendTrackedButtonsToMessage({
    message,
    campaign,
    deliveryId,
  });

  async function logOutbound(send: {
    externalMessageId: string | null;
    sendStatus: string;
    errorDetail?: string | null;
  }) {
    if (!delivery.recipientIgsid) return;
    await recordOutboundInstagramMessage({
      accountId: delivery.accountId,
      participantIgsid: delivery.recipientIgsid,
      participantUsername: delivery.recipientUsername,
      bodyText: message,
      externalMessageId: send.externalMessageId,
      deliveryId,
      sendStatus: send.sendStatus,
      errorDetail: send.errorDetail ?? null,
    });
  }

  if (isInstagramDryRun()) {
    await updateDeliveryStatus(deliveryId, {
      status: "sent",
      metaMessageId: "dry_run",
      sentAt: new Date().toISOString(),
    });
    await logOutbound({ externalMessageId: "dry_run", sendStatus: "sent" });
    return;
  }

  const token = await getAccountAccessToken(delivery.accountId);
  if (!token) {
    await updateDeliveryStatus(deliveryId, {
      status: "failed",
      errorDetail: "No access token on account",
    });
    return;
  }

  const isComment = delivery.triggerType === "comment";
  const result = isComment
    ? await sendInstagramPrivateReply({
        commentId: delivery.triggerExternalId,
        message,
        accessToken: token,
      })
    : await (async () => {
        const igAccountId = await getAccountIgUserId(delivery.accountId);
        if (!igAccountId || !delivery.recipientIgsid) {
          return { ok: false as const, error: "Missing IG account or recipient for DM send" };
        }
        return sendInstagramDirectMessage({
          igAccountId,
          recipientIgsid: delivery.recipientIgsid,
          message,
          accessToken: token,
        });
      })();

  if (!result.ok) {
    await updateDeliveryStatus(deliveryId, {
      status: "failed",
      errorDetail: result.error,
    });
    await logOutbound({
      externalMessageId: null,
      sendStatus: "failed",
      errorDetail: result.error,
    });
    return;
  }

  await updateDeliveryStatus(deliveryId, {
    status: "sent",
    metaMessageId: result.messageId,
    sentAt: new Date().toISOString(),
  });
  await logOutbound({ externalMessageId: result.messageId, sendStatus: "sent" });

  if (isComment && campaign.publicReplyTemplate?.trim()) {
    const publicText = renderInstagramTemplate(campaign.publicReplyTemplate, {
      username: delivery.recipientUsername,
    });
    const pub = await sendInstagramPublicCommentReply({
      commentId: delivery.triggerExternalId,
      message: publicText,
      accessToken: token,
    });
    if (!pub.ok) {
      await updateDeliveryStatus(deliveryId, {
        status: "sent",
        errorDetail: `Private reply ok; public reply failed: ${pub.error}`,
      });
    }
  }
}