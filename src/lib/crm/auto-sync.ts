import { HARVEST_MIN_COMPOSITE_SCORE } from "@/lib/growth/harvest-config";

/** When true (default), qualifying Growth leads get a CRM opportunity on ingest. */
export function isCrmAutoPipelineEnabled(): boolean {
  const raw = process.env.CRM_AUTO_PIPELINE?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}

/** Minimum composite score (0–100) for auto CRM sync. Defaults to harvest bar. */
export function crmAutoPipelineMinScore(): number {
  const raw = process.env.CRM_AUTO_PIPELINE_MIN_SCORE?.trim();
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
  }
  return HARVEST_MIN_COMPOSITE_SCORE;
}

export function shouldAutoSyncLeadToCrm(compositeScore: number): boolean {
  return isCrmAutoPipelineEnabled() && compositeScore >= crmAutoPipelineMinScore();
}
