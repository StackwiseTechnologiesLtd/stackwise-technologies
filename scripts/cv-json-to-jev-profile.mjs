#!/usr/bin/env node
/**
 * Convert Stackwise CV JSON (my-cv.json.json shape) → JEV data/profile.json.
 *
 *   node scripts/cv-json-to-jev-profile.mjs [cv.json] [out-profile.json]
 *
 * Env: STACKWISE_CV_JSON default ~/Documents/my-cv.json.json
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const defaultCv = path.join(os.homedir(), "Documents", "my-cv.json.json");
const cvPath = path.resolve(process.argv[2] || process.env.STACKWISE_CV_JSON?.trim() || defaultCv);
const outPath = path.resolve(
  process.argv[3] ||
    process.env.JEV_PROFILE_OUT?.trim() ||
    path.join(os.homedir(), "jev-job-search", "data", "profile.json"),
);

function splitName(full) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { first: full.trim(), last: full.trim() };
  return { first: titleCase(parts[0]), last: parts.slice(1).map(titleCase).join(" ") };
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function parsePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const m = String(raw ?? "").trim().match(/^(\+\d{1,3})/);
  const countryCode = m?.[1] ?? "+90";
  let national = digits;
  if (countryCode === "+90" && national.startsWith("90")) national = national.slice(2);
  if (countryCode === "+1" && national.startsWith("1") && national.length > 10) national = national.slice(1);
  return { countryCode, national: national.slice(0, 15) };
}

function ymFromDate(iso) {
  if (!iso?.trim()) return null;
  const d = iso.trim().slice(0, 10);
  const [y, m] = d.split("-").map(Number);
  if (!y || !m) return null;
  return { year: y, month: m, ym: `${y}-${String(m).padStart(2, "0")}` };
}

function bulletsFromText(text, max = 6) {
  return String(text ?? "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 8)
    .slice(0, max);
}

function spokenLevel(code) {
  const n = String(code ?? "").trim();
  if (n === "5") return "Fluent";
  if (n === "4") return "Fluent";
  if (n === "3") return "Intermediate";
  if (n === "2") return "Basic";
  return "Conversational";
}

function ensureUrl(u) {
  const t = String(u ?? "").trim();
  if (!t) return undefined;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function buildProfile(cv) {
  const { first, last } = splitName(cv.fullName ?? "Candidate");
  const phone = parsePhone(cv.phone);

  const primaryEdu =
    cv.educations?.find((e) => /computer information|computer science|software/i.test(e.title ?? "")) ??
    cv.educations?.[0];

  const eduStart = ymFromDate(primaryEdu?.startdate);
  const eduEnd = ymFromDate(primaryEdu?.enddate);

  const experience = (cv.workExperiences ?? []).map((job) => {
    const start = ymFromDate(job.startdate)?.ym ?? "2020-01";
    const open = !job.enddate?.trim();
    return {
      company: job.company?.trim() ?? "Company",
      title: job.worktitle?.trim() ?? cv.jobTitle ?? "Software Engineer",
      location: job.location?.trim() ?? "",
      start,
      end: open ? "present" : ymFromDate(job.enddate)?.ym ?? start,
      current: open,
      bullets: bulletsFromText(job.achievements, 5),
    };
  });

  const projects = (cv.workProjects ?? []).slice(0, 8).map((p) => ({
    name: p.projectname?.trim() ?? "Project",
    role: "Technical lead",
    start: "2022-01",
    end: "present",
    link: ensureUrl(p.projectwebsite ?? p.githublink),
    bullets: bulletsFromText(p.projectachievements, 3),
  }));

  const skillLines = (cv.skills ?? []).map((s) => s.skill?.trim()).filter(Boolean);
  const languages = [];
  const frameworks = [];
  const tools = [];
  for (const line of skillLines) {
    const lower = line.toLowerCase();
    if (/python|c\b|sql|typescript|javascript/.test(lower)) languages.push(line.split("/")[0].trim());
    else if (/node|next|react|express|fastify|aws|django/.test(lower)) frameworks.push(line.split("&")[0].trim());
    else tools.push(line.split("&")[0].trim());
  }

  const facts = [
    ...bulletsFromText(cv.bio, 1),
    ...experience.flatMap((e) => e.bullets.slice(0, 1)),
    ...projects.flatMap((p) => p.bullets.slice(0, 1)),
  ]
    .filter(Boolean)
    .slice(0, 8);

  const summary =
    (cv.bio?.trim() || `${cv.jobTitle}. Full-stack engineer and founder.`).slice(0, 600);

  const resumePdf =
    process.env.JEV_RESUME_PDF?.trim() ||
    path.join(os.homedir(), "Documents", "GitHub", "agency", "daniel-kalumba-tshikomba-cv.pdf");

  return {
    name: { first, last },
    email: cv.email?.trim() ?? "ohdearteddy@gmail.com",
    phone,
    address: {
      line1: "51 Uzunyol Sk",
      city: "Gonyeli",
      region: "Nicosia",
      regionCode: "",
      postalCode: "99010",
      country: "Cyprus",
      countryCode: "CY",
    },
    links: {
      linkedin: ensureUrl(cv.linkedin),
      github: ensureUrl(cv.github),
      website: ensureUrl(cv.website),
    },
    education: [
      {
        school: primaryEdu?.institute?.trim() ?? "Near East University",
        degree: "Bachelor of Science",
        field: primaryEdu?.title?.trim() ?? "Computer Information Systems",
        startMonth: eduStart?.month ?? 10,
        startYear: eduStart?.year ?? 2020,
        gradMonth: eduEnd?.month ?? 1,
        gradYear: eduEnd?.year ?? 2025,
        status: "completed",
      },
    ],
    experience,
    projects,
    skills: {
      languages: [...new Set(languages.length ? languages : ["TypeScript", "Python"])],
      frameworks: [...new Set(frameworks.length ? frameworks : ["Node.js", "Next.js", "AWS CDK"])],
      tools: [...new Set(tools.length ? tools : ["PostgreSQL", "Docker", "Git"])],
    },
    spokenLanguages: (cv.languages ?? []).map((l) => ({
      name: l.language?.trim() ?? "English",
      level: spokenLevel(l.level),
    })),
    workAuthorization: {
      citizenships: ["Democratic Republic of the Congo"],
      authorizedCountries: ["Cyprus"],
      requiresSponsorshipElsewhere: true,
      statement:
        "Based in Nicosia, Cyprus. I have worked for Cyprus-based employers since 2021. Confirm visa or sponsorship needs for each country outside Cyprus.",
    },
    demographics: {
      gender: "Prefer not to say",
      ethnicity: "Prefer not to say",
      hispanicOrLatino: "decline",
      veteran: "no",
      disability: "no",
      sexualOrientation: "Prefer not to say",
      transgender: "decline",
    },
    preferences: {
      earliestStart: "Immediately",
      availability:
        "Full-time software roles and internships; remote only (based in Cyprus, EU).",
      salaryExpectation: "",
      willingToRelocate: "no",
      remote: "preferred",
      preferredLocations: ["Remote", "Cyprus", "European Union", "United Kingdom"],
      howDidYouHear: "Job board or company careers page",
      references: "skip",
      coverLetter: "when_asked",
    },
    resume: {
      path: resumePdf,
      filename: path.basename(resumePdf),
    },
    summary,
    facts: facts.length ? facts : [summary.slice(0, 120)],
    answers: [
      {
        question: "Which area of engineering are you most interested in?",
        answer: "Full-stack and backend systems, especially AI integrations and production SaaS.",
      },
      {
        question: "Can you work on site or relocate?",
        answer:
          "Fully remote preferred. Based in Nicosia, Cyprus. I will not relocate for on-site roles; open to occasional travel only when the role is otherwise remote-first.",
      },
      {
        question: "Office, hybrid, or remote?",
        answer: "Fully remote.",
      },
      {
        question: "Internship or full-time?",
        answer:
          "Open to both: full-time software engineering and internships/co-ops, as long as the role is remote.",
      },
      {
        question: "Years of professional software experience",
        answer: "Four or more years building production web platforms, APIs, and cloud infrastructure.",
      },
      {
        question: "How did you hear about this job?",
        answer: "From a public job board, careers page, or referral. Pick the option that matches the actual source.",
      },
    ],
  };
}

if (!fs.existsSync(cvPath)) {
  console.error("CV JSON not found:", cvPath);
  process.exit(1);
}

const cv = JSON.parse(fs.readFileSync(cvPath, "utf8"));
const profile = buildProfile(cv);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(profile, null, 2)}\n`);
console.log("Wrote JEV profile:", outPath);
console.log("Source CV:", cvPath);
if (!fs.existsSync(profile.resume.path)) {
  console.warn("Resume PDF missing at", profile.resume.path, "(add JEV_RESUME_PDF or place PDF before /apply)");
}
console.warn("Confirm workAuthorization.citizenships in profile if needed (CV did not list citizenship explicitly).");
