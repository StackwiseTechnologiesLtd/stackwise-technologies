export const growthPlatforms = ["linkedin", "x"] as const;
export type GrowthPlatform = (typeof growthPlatforms)[number];

export const connectModes = ["hosted", "relay", "local"] as const;
export type ConnectMode = (typeof connectModes)[number];

export const pipelineStatuses = [
  "new",
  "reviewed",
  "outreach",
  "replied",
  "booked",
  "won",
  "lost",
  "not_a_fit",
] as const;
export type PipelineStatus = (typeof pipelineStatuses)[number];

export const draftStatuses = [
  "pending_review",
  "approved",
  "rejected",
  "published",
  "failed",
] as const;
export type DraftStatus = (typeof draftStatuses)[number];

export type IcpConfig = {
  titleKeywords: string[];
  titleExclusions: string[];
  intentPhrases: string[];
  locations: string[];
};

export type GrowthSignal = {
  id: string;
  platform: GrowthPlatform;
  sourceUrl: string | null;
  authorName: string | null;
  authorHandle: string | null;
  authorProfileUrl: string | null;
  roleTitle: string | null;
  companyName: string | null;
  bodyText: string;
  contextSummary: string | null;
  ingestedAt: string;
};

export type GrowthLead = {
  id: string;
  signalId: string | null;
  fullName: string;
  roleTitle: string | null;
  companyName: string | null;
  profileUrl: string | null;
  email: string | null;
  platform: GrowthPlatform | null;
  icpScore: number;
  intentScore: number;
  compositeScore: number;
  scoreReasons: string[];
  pipelineStatus: PipelineStatus;
  feedbackNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GrowthDraft = {
  id: string;
  leadId: string | null;
  signalId: string | null;
  platform: GrowthPlatform;
  draftKind: "reply" | "post" | "dm";
  bodyText: string;
  imageNotes: string | null;
  status: DraftStatus;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  publishError: string | null;
};

export type IngestSignalInput = {
  platform: GrowthPlatform;
  sourceUrl?: string;
  authorName: string;
  authorHandle?: string;
  authorProfileUrl?: string;
  roleTitle?: string;
  companyName?: string;
  bodyText: string;
  contextSummary?: string;
  email?: string;
  rawPayload?: Record<string, unknown>;
};

export const sessionStatuses = [
  "active",
  "expired",
  "challenge",
  "unknown",
  "disconnected",
] as const;
export type SessionStatus = (typeof sessionStatuses)[number];

export type PlatformCredentialStatus = {
  platform: GrowthPlatform;
  connected: boolean;
  updatedAt: string | null;
  lastSyncAt: string | null;
  displayLabel: string | null;
  sessionStatus: SessionStatus;
  lastHealthCheckAt: string | null;
  lastError: string | null;
  connectedAccountLabel: string | null;
};
