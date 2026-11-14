export const instagramDeliveryStatuses = [
  "queued",
  "sent",
  "skipped",
  "failed",
] as const;
export type InstagramDeliveryStatus = (typeof instagramDeliveryStatuses)[number];

export const instagramCampaignTriggers = [
  "comment",
  "dm",
  "story_reply",
] as const;
export type InstagramCampaignTrigger = (typeof instagramCampaignTriggers)[number];

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
  webhookSubscribed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InstagramCampaign = {
  id: string;
  accountId: string;
  name: string;
  mediaId: string | null;
  keyword: string;
  triggerType: InstagramCampaignTrigger;
  privateReplyTemplate: string;
  publicReplyTemplate: string | null;
  buttonLabel1: string | null;
  buttonUrl1: string | null;
  buttonLabel2: string | null;
  buttonUrl2: string | null;
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
  clickCount: number;
};

export type InstagramOpsStatus = {
  metaAppCount: number;
  connectedAccounts: number;
  activeCampaigns: number;
  lastWebhookAt: string | null;
  lastSendAt: string | null;
  webhookUrlPattern: string;
  dryRunMode: boolean;
};

export type InstagramDeliveryMetrics = {
  sentThisWeek: number;
  failedThisWeek: number;
  queuedNow: number;
  pausedCampaigns: number;
};

export type InstagramConversation = {
  id: string;
  accountId: string;
  participantIgsid: string;
  participantUsername: string | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
};

export type InstagramInboxMessage = {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  externalMessageId: string | null;
  bodyText: string | null;
  deliveryId: string | null;
  sendStatus: string | null;
  errorDetail: string | null;
  createdAt: string;
};