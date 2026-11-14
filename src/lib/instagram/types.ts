export const instagramDeliveryStatuses = [
  "queued",
  "sent",
  "skipped",
  "failed",
] as const;
export type InstagramDeliveryStatus = (typeof instagramDeliveryStatuses)[number];

export type InstagramMetaApp = {
  id: string;
  slug: string;
  label: string;
  metaAppId: string;
  webhookVerifyToken: string;
  createdAt: string;
  updatedAt: string;
};

export type InstagramAccount = {
  id: string;
  metaAppId: string;
  igUserId: string;
  username: string | null;
  status: string;
  tokenExpiresAt: string | null;
  hasAccessToken: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InstagramCampaign = {
  id: string;
  accountId: string;
  name: string;
  mediaId: string;
  keyword: string;
  privateReplyTemplate: string;
  publicReplyTemplate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InstagramDelivery = {
  id: string;
  campaignId: string | null;
  accountId: string;
  status: InstagramDeliveryStatus;
  skipReason: string | null;
  triggerType: string;
  triggerExternalId: string;
  recipientIgsid: string | null;
  recipientUsername: string | null;
  triggerText: string | null;
  privateReplyPreview: string | null;
  metaMessageId: string | null;
  errorDetail: string | null;
  queuedAt: string;
  sentAt: string | null;
  createdAt: string;
  campaignName: string | null;
};

export type InstagramOpsStatus = {
  metaAppCount: number;
  connectedAccounts: number;
  activeCampaigns: number;
  lastWebhookAt: string | null;
  lastSendAt: string | null;
  webhookUrlPattern: string;
};