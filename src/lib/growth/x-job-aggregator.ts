/** Repost / job-board X accounts — not direct employers (skip CRM promote + pipeline clutter). */

const AGGREGATOR_HANDLE_RE =
  /\b(jobsfordevs|jobs\s*for\s*developers|remoteornothing|remote\s*code|allweb3jobs|web3\s*jobs|hiring\s*board|job\s*alert|devitjobs|devitjob)\b/i;

const AGGREGATOR_NAME_RE =
  /(jobs\s*for\s*developers|remote\s*or\s*nothing|remote\s*code|allweb3|web3\s*jobs|crypto\s*vazi|job\s*board|hiring\s*alert)/i;

export function isXJobAggregator(
  authorName: string,
  bodyText?: string | null,
): boolean {
  const name = authorName.trim();
  const body = (bodyText ?? "").trim();
  if (!name && !body) return false;
  if (AGGREGATOR_NAME_RE.test(name)) return true;
  const handle = name.includes("@") ? name.split("@").pop() ?? name : name;
  if (AGGREGATOR_HANDLE_RE.test(handle)) return true;
  if (body && AGGREGATOR_HANDLE_RE.test(body.slice(0, 200))) return true;
  return false;
}