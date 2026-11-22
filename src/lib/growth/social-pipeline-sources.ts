import type { LeadSource } from "@/lib/growth/types";

/** Ingest channels we keep in pipeline (X + LinkedIn social harvest with post URLs). */
export const SOCIAL_PIPELINE_SOURCES = ["harvest"] as const satisfies readonly LeadSource[];

export const DEPRECATED_PIPELINE_SOURCES = [
  "huginn",
  "freehire",
  "firecrawl",
  "linkedin_jobs",
] as const satisfies readonly LeadSource[];

export function isSocialPipelineSource(source: string | null | undefined): boolean {
  return SOCIAL_PIPELINE_SOURCES.includes((source ?? "") as (typeof SOCIAL_PIPELINE_SOURCES)[number]);
}