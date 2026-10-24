import {
  growthPlatforms,
  leadSources,
  type GrowthPlatform,
  type IngestSignalInput,
  type LeadSource,
} from "@/lib/growth/types";

export type IntegrationIngestBody = {
  source: LeadSource;
  platform: GrowthPlatform;
  authorName: string;
  bodyText: string;
  sourceUrl?: string;
  authorHandle?: string;
  authorProfileUrl?: string;
  roleTitle?: string;
  companyName?: string;
  contextSummary?: string;
  postedAt?: string;
  email?: string;
  profileContext?: string;
  rawPayload?: Record<string, unknown>;
};

export function parseIntegrationIngestBody(
  body: unknown,
): { ok: true; input: IngestSignalInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "JSON body required" };
  }
  const b = body as IntegrationIngestBody;
  if (!b.source || !leadSources.includes(b.source)) {
    return { ok: false, error: "Invalid source (huginn, freehire, manual, harvest)" };
  }
  if (!b.platform || !growthPlatforms.includes(b.platform)) {
    return { ok: false, error: "Invalid platform (linkedin, x)" };
  }
  if (!b.authorName?.trim() || !b.bodyText?.trim()) {
    return { ok: false, error: "authorName and bodyText are required" };
  }

  return {
    ok: true,
    input: {
      platform: b.platform,
      leadSource: b.source,
      authorName: b.authorName.trim(),
      bodyText: b.bodyText.trim(),
      sourceUrl: b.sourceUrl?.trim(),
      authorHandle: b.authorHandle?.trim(),
      authorProfileUrl: b.authorProfileUrl?.trim(),
      roleTitle: b.roleTitle?.trim(),
      companyName: b.companyName?.trim(),
      contextSummary: b.contextSummary?.trim(),
      postedAt: b.postedAt?.trim(),
      email: b.email?.trim(),
      profileContext: b.profileContext?.trim(),
      rawPayload: b.rawPayload,
    },
  };
}
