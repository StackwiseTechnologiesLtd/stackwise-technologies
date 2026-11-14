import type { InstagramCampaign } from "@/lib/instagram/types";
import { createTrackedLinks, trackedLinkBaseUrl } from "@/lib/instagram/repository";

export async function appendTrackedButtonsToMessage(input: {
  message: string;
  campaign: InstagramCampaign;
  deliveryId: string;
}): Promise<string> {
  const buttons: { label: string; url: string }[] = [];
  if (input.campaign.buttonUrl1?.trim()) {
    buttons.push({
      label: input.campaign.buttonLabel1?.trim() || "Link 1",
      url: input.campaign.buttonUrl1.trim(),
    });
  }
  if (input.campaign.buttonUrl2?.trim()) {
    buttons.push({
      label: input.campaign.buttonLabel2?.trim() || "Link 2",
      url: input.campaign.buttonUrl2.trim(),
    });
  }
  if (buttons.length === 0) {
    return input.message;
  }

  const base = trackedLinkBaseUrl();
  const links = await createTrackedLinks({
    deliveryId: input.deliveryId,
    campaignId: input.campaign.id,
    buttons,
    baseUrl: base,
  });

  const lines = links.map((l) => `${l.label}: ${base}/r/ig/${l.token}`);
  return `${input.message}\n\n${lines.join("\n")}`;
}