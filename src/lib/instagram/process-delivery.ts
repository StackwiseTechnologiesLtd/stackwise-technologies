import {
  isInstagramDryRun,
  sendInstagramPrivateReply,
  sendInstagramPublicCommentReply,
} from "@/lib/instagram/graph-send";
import { renderInstagramTemplate } from "@/lib/instagram/keyword";
import {
  getAccountAccessToken,
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

  const message =
    delivery.privateReplyPreview ??
    renderInstagramTemplate(campaign.privateReplyTemplate, {
      username: delivery.recipientUsername,
    });

  if (isInstagramDryRun()) {
    await updateDeliveryStatus(deliveryId, {
      status: "sent",
      metaMessageId: "dry_run",
      sentAt: new Date().toISOString(),
    });
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

  const result = await sendInstagramPrivateReply({
    commentId: delivery.triggerExternalId,
    message,
    accessToken: token,
  });

  if (!result.ok) {
    await updateDeliveryStatus(deliveryId, {
      status: "failed",
      errorDetail: result.error,
    });
    return;
  }

  await updateDeliveryStatus(deliveryId, {
    status: "sent",
    metaMessageId: result.messageId,
    sentAt: new Date().toISOString(),
  });

  if (campaign.publicReplyTemplate?.trim()) {
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