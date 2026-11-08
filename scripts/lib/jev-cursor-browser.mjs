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

export function queuedJobs(entries, limit) {
  const queued = entries.filter((e) => e.status === "queued");
  queued.sort((a, b) => (b.fit?.score ?? 0) - (a.fit?.score ?? 0));
  return queued.slice(0, limit);
}

export function jobCard(entry, index) {
  const { job, fit } = entry;
  return {
    index: index + 1,
    jobId: job.id,
    company: job.company,
    title: job.title,
    applyUrl: job.url,
    ats: job.ats ?? "unknown",
    locations: job.locations ?? [],
    jevScore: fit?.score ?? null,
    jevReasons: fit?.reasons ?? [],
  };
}

export function writeSession(repoRoot, payload) {
  const dir = path.join(repoRoot, SESSION_DIR);
  fs.mkdirSync(dir, { recursive: true });
  const sessionPath = path.join(dir, "session.json");
  fs.writeFileSync(sessionPath, `${JSON.stringify(payload, null, 2)}\n`);
  return sessionPath;
}

export function prepareSession(repoRoot, { count = 1, syncProfile = true } = {}) {
  const { jevHome } = prepareJevContext(repoRoot);
  if (syncProfile) syncJevProfile(repoRoot, jevHome);
  const { entries, generatedAt } = loadQueue(jevHome);
  const profile = loadProfile(jevHome);
  const selected = queuedJobs(entries, count);
  if (selected.length === 0) {
    throw new Error("No queued jobs. Run growth:jev:discover or widen sources.");
  }
  const payload = {
    mode: "cursor-browser",
    generatedAt: new Date().toISOString(),
    queueGeneratedAt: generatedAt,
    jevHome,
    applicant: profileForBrowserAgent(profile),
    jobs: selected.map((e, i) => jobCard(e, i)),
    agentInstructions: [
      "Use cursor-ide-browser MCP (browser_navigate → browser_lock → snapshot → fill → unlock).",
      "Do not submit until the user says to submit this application.",
      "Use applicant.standingAnswers and experience for text fields; upload resume from applicant.resumePath if the form allows (user may need to pick the file manually).",
      "After submit or skip, run: npm run growth:jev:browser:mark -- <jobId> applied|skipped|manual",
    ],
  };
  const sessionPath = writeSession(repoRoot, payload);
  return { sessionPath, payload, jevHome };
}
