/** Repost / job-board X accounts — not direct employers (skip CRM promote + pipeline clutter). */

const AGGREGATOR_HANDLE_RE =
  /\b(jobsfordevs|jobs\s*for\s*developers|remoteornothing|remote\s*code|remoteok|remotelink|allweb3jobs|web3\s*jobs|jobspresso|invokegeek|softwareduniya|visajobsdaily|jobsincrypto|hireeing|hirewitharfeen|hiring\s*board|job\s*alert|devitjobs|devitjob|careers?at|_jobs|jobscrypto)\b/i;

const AGGREGATOR_NAME_RE =
  /(jobs\s*for\s*developers|remote\s*or\s*nothing|remote\s*code|remote\s*ok|remote\s*link|allweb3|web3\s*jobs|crypto\s*vazi|job\s*board|job\s*spresso|invoke\s*geek|visa\s*jobs|software\s*duniya|hireeing|job\s*alert|careers\s*@)/i;

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