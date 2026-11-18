export const contentCalendarChannels = [
  "instagram",
  "linkedin",
  "x",
  "tiktok",
  "other",
] as const;

export type ContentCalendarChannel = (typeof contentCalendarChannels)[number];

export const contentCalendarChannelLabels: Record<ContentCalendarChannel, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  tiktok: "TikTok",
  other: "Other",
};

export const contentCalendarStatuses = ["draft", "scheduled", "published"] as const;

export type ContentCalendarStatus = (typeof contentCalendarStatuses)[number];

export const contentCalendarStatusLabels: Record<ContentCalendarStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
};

export type ContentCalendarAsset = {
  id: string;
  postId: string;
  contentType: string;
  filename: string;
  byteSize: number;
  sortOrder: number;
  hasR2: boolean;
  hasDevBlob: boolean;
  createdAt: string;
};

export type ContentCalendarPost = {
  id: string;
  title: string;
  scheduledOn: string;
  scheduledTime: string | null;
  channel: ContentCalendarChannel;
  status: ContentCalendarStatus;
  script: string;
  notes: string;
  accent: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContentCalendarPostDetail = ContentCalendarPost & {
  assets: ContentCalendarAsset[];
};