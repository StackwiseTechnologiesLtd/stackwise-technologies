import { isCrmAutoPipelineEnabled } from "@/lib/crm/auto-sync";
import { ensureGrowthLeadInCrm } from "@/lib/crm/repository";
import type { LeadSource } from "@/lib/growth/types";

const sourceLabels: Record<LeadSource, string> = {
  harvest: "harvest",
  huginn: "Huginn",
  freehire: "Jobs",
  manual: "manual capture",
};

export async function syncIngestedLeadToCrm(
  growthLeadId: string,
  leadSource: LeadSource,
): Promise<void> {
  if (!isCrmAutoPipelineEnabled()) return;

  const label = sourceLabels[leadSource] ?? leadSource;
  try {
    await ensureGrowthLeadInCrm(growthLeadId, {
      activityNote: `Lead entered pipeline via ${label}`,
    });
  } catch (error) {
    console.error("[crm] auto-sync failed for lead", growthLeadId, error);
  }
}
