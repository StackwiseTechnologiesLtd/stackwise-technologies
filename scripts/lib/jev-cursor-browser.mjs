import fs from "node:fs";
import path from "node:path";
import { prepareJevContext, syncJevProfile } from "./jev-run.mjs";

export const SESSION_DIR = ".jev-cursor-apply";

export function loadQueue(jevHome) {
  const queuePath = path.join(jevHome, "data", "queue.json");
  if (!fs.existsSync(queuePath)) {
    throw new Error(`No queue at ${queuePath}. Run npm run growth:jev:discover first.`);
  }
  const raw = JSON.parse(fs.readFileSync(queuePath, "utf8"));
  const entries = Array.isArray(raw) ? raw : raw.entries;
  if (!Array.isArray(entries)) throw new Error("Invalid queue.json shape");
  return { entries, generatedAt: raw.generatedAt ?? null };
}

export function loadProfile(jevHome) {
  const profilePath = path.join(jevHome, "data", "profile.json");
  if (!fs.existsSync(profilePath)) {
    throw new Error(`No profile at ${profilePath}`);
  }
  return JSON.parse(fs.readFileSync(profilePath, "utf8"));
}

/** Applicant facts for the Cursor browser agent (no secrets in repo — session dir is gitignored). */
export function profileForBrowserAgent(profile) {
  const phone =
    profile.phone?.national && profile.phone?.countryCode
      ? `${profile.phone.countryCode} ${profile.phone.national}`
      : profile.phone?.national ?? "";
  return {
    fullName: [profile.name?.first, profile.name?.last].filter(Boolean).join(" "),
    email: profile.email ?? "",
    phone,
    address: profile.address ?? null,
    links: profile.links ?? {},
    education: profile.education ?? [],
    experience: (profile.experience ?? []).map((e) => ({
      company: e.company,
      title: e.title,
      location: e.location,
      start: e.start,
      end: e.end,
      current: e.current,
      bullets: e.bullets?.slice(0, 5) ?? [],
    })),
    standingAnswers: (profile.answers ?? []).map((a) => ({
      question: a.question,
      answer: a.answer,
    })),
    resumePath: profile.resume?.path ?? null,
    workAuthorization: profile.workAuthorization ?? null,
    summary: profile.summary ?? "",
  };
}

const REMOTE_RE = /\bremote\b|work from home|\bwfh\b|distributed|anywhere|worldwide/i;
const ONSITE_ONLY_RE =
  /\b(on[- ]site|in[- ]office|hybrid|relocation required|must (be )?located)\b/i;

/** Remote in location line or job title (used for pack filters). */
export function isRemoteLocation(entry) {
  const locs = entry.job?.locations ?? [];
  if (locs.some((l) => REMOTE_RE.test(l))) return true;
  return REMOTE_RE.test(entry.job?.title ?? "");
}

/** Remote in locations/title/description (used for labels and supplemental search). */
export function isRemoteJob(entry) {
  if (isRemoteLocation(entry)) return true;
  const blob = [
    ...(entry.job?.locations ?? []),
    entry.job?.title ?? "",
    entry.job?.description ?? "",
  ].join(" ");
  return REMOTE_RE.test(blob) && !ONSITE_ONLY_RE.test(blob);
}

/** Posting is clearly on-site (no Remote in locations/title). */
export function isOnsiteOnlyJob(entry) {
  if (isRemoteLocation(entry)) return false;
  const locs = entry.job?.locations ?? [];
  if (locs.length === 0) return false;
  return true;
}

const SOFTWARE_TITLE =
  /software|engineer|developer|full[- ]stack|backend|frontend|front[- ]end|back[- ]end|platform|\bswe\b|devops|sre\b/i;

/** Skipped/below-threshold remote software rows worth a manual look (e.g. international remote). */
export function supplementalRemoteCandidates(entries, limit) {
  return entries
    .filter((e) => e.status === "skipped" && e.fit && isRemoteLocation(e))
    .filter((e) => !/US role, no sponsorship|citizenship|clearance/i.test(e.fit?.skipReason ?? ""))
    .filter((e) => SOFTWARE_TITLE.test(e.job?.title ?? ""))
    .filter((e) => (e.fit?.score ?? 0) >= 0.25)
    .sort((a, b) => (b.fit?.score ?? 0) - (a.fit?.score ?? 0))
    .slice(0, limit);
}

export function queuedJobs(
  entries,
  limit,
  { remoteOnly = false, excludeOnsite = true } = {},
) {
  let queued = entries.filter((e) => e.status === "queued");
  if (remoteOnly) {
    queued = queued.filter(isRemoteLocation);
  } else if (excludeOnsite) {
    queued = queued.filter((e) => !isOnsiteOnlyJob(e));
  }
  queued.sort((a, b) => {
    const ar = isRemoteLocation(a) ? 1 : 0;
    const br = isRemoteLocation(b) ? 1 : 0;
    if (br !== ar) return br - ar;
    return (b.fit?.score ?? 0) - (a.fit?.score ?? 0);
  });
  return queued.slice(0, limit);
}

export function jobCard(entry, index, { fromSupplement = false } = {}) {
  const { job, fit } = entry;
  return {
    index: index + 1,
    jobId: job.id,
    company: job.company,
    title: job.title,
    applyUrl: job.url,
    ats: job.ats ?? "unknown",
    locations: job.locations ?? [],
    remote: isRemoteLocation(entry),
    jevScore: fit?.score ?? null,
    jevReasons: fit?.reasons ?? [],
    ...(fromSupplement
      ? { source: "supplemental_remote", note: "Was skipped in JEV; review sponsorship/location before applying." }
      : {}),
  };
}

export function writeSession(repoRoot, payload) {
  const dir = path.join(repoRoot, SESSION_DIR);
  fs.mkdirSync(dir, { recursive: true });
  const sessionPath = path.join(dir, "session.json");
  fs.writeFileSync(sessionPath, `${JSON.stringify(payload, null, 2)}\n`);
  return sessionPath;
}

export function prepareSession(
  repoRoot,
  {
    count = 1,
    syncProfile = true,
    remoteOnly = false,
    includeOnsite = false,
    supplementalRemote = 3,
  } = {},
) {
  const { jevHome } = prepareJevContext(repoRoot);
  if (syncProfile) syncJevProfile(repoRoot, jevHome);
  const { entries, generatedAt } = loadQueue(jevHome);
  const profile = loadProfile(jevHome);
  const selected = queuedJobs(entries, count, {
    remoteOnly,
    excludeOnsite: !includeOnsite && !remoteOnly,
  });
  const extra =
    remoteOnly || supplementalRemote <= 0
      ? []
      : supplementalRemoteCandidates(entries, supplementalRemote);
  const combined = [...selected, ...extra];
  if (combined.length === 0) {
    if (remoteOnly) {
      throw new Error(
        "No queued remote jobs. Run growth:jev:import-remote-freehire then growth:jev:discover -- --limit 80.",
      );
    }
    throw new Error(
      "No jobs match remote-first pack (onsite-only excluded). Use --include-onsite, growth:jev:import-remote-freehire, or growth:jev:discover -- --limit 80.",
    );
  }
  const payload = {
    mode: "cursor-browser",
    generatedAt: new Date().toISOString(),
    queueGeneratedAt: generatedAt,
    jevHome,
    applicant: profileForBrowserAgent(profile),
    jobs: combined.map((e, i) =>
      jobCard(e, i, { fromSupplement: i >= selected.length }),
    ),
    remoteOnly,
    includeOnsite: includeOnsite || false,
    agentInstructions: [
      "Use cursor-ide-browser MCP (browser_navigate → browser_lock → snapshot → fill → unlock).",
      "Do not submit until the user says to submit this application.",
      "Applicant wants remote full-time or remote internships (based in Cyprus); use standingAnswers.",
      "Use applicant.standingAnswers and experience for text fields; upload resume from applicant.resumePath if the form allows (user may need to pick the file manually).",
      "After submit or skip, run: npm run growth:jev:browser:mark -- <jobId> applied|skipped|manual",
    ],
  };
  const sessionPath = writeSession(repoRoot, payload);
  return { sessionPath, payload, jevHome };
}
