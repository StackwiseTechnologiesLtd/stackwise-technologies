/** When true (default), every new Growth lead gets a CRM opportunity on ingest. */
export function isCrmAutoPipelineEnabled(): boolean {
  const raw = process.env.CRM_AUTO_PIPELINE?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}
