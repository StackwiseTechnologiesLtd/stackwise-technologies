import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnvLocal } from "./load-env-local.mjs";

/** Load Stackwise .env.local and resolve JEV clone path. */
export function prepareJevContext(repoRoot) {
  loadEnvLocal();
  const jevHome =
    process.env.JEV_HOME?.trim() ||
    path.join(os.homedir(), "jev-job-search");
  if (!fs.existsSync(path.join(jevHome, "package.json"))) {
    console.error("JEV not found at", jevHome);
    console.error("Clone: git clone https://github.com/qbeka/jev-job-search", jevHome);
    process.exit(1);
  }
  return { jevHome, repoRoot };
}

/** Sync ~/Documents/my-cv.json.json → JEV profile when present. */
export function syncJevProfile(repoRoot, jevHome) {
  const profilePath = path.join(jevHome, "data", "profile.json");
  const cvDefault = path.join(os.homedir(), "Documents", "my-cv.json.json");
  const cvPath =
    process.env.STACKWISE_CV_JSON?.trim() ||
    (fs.existsSync(cvDefault) ? cvDefault : "");

  if (cvPath && fs.existsSync(cvPath)) {
    const converter = path.join(repoRoot, "scripts", "cv-json-to-jev-profile.mjs");
    const sync = spawnSync(process.execPath, [converter, cvPath, profilePath], {
      stdio: "inherit",
    });
    if (sync.status !== 0) process.exit(sync.status ?? 1);
    return;
  }

  if (!fs.existsSync(profilePath)) {
    const example = path.join(jevHome, "data", "profile.example.json");
    if (fs.existsSync(example)) {
      fs.copyFileSync(example, profilePath);
      console.warn(
        "Copied profile.example.json → profile.json (set STACKWISE_CV_JSON or add my-cv.json.json).",
      );
    } else {
      console.error("No JEV profile at", profilePath);
      process.exit(1);
    }
  }
}

/**
 * Pass Stackwise secrets into JEV without writing them into ~/jev-job-search/.env.
 * When ANTHROPIC_API_KEY is set, default WRITER_BACKEND=api (no Claude Code CLI).
 */
export function jevChildEnv() {
  const env = { ...process.env };

  if (!env.OPENROUTER_API_KEY?.trim()) {
    console.error("OPENROUTER_API_KEY missing in .env.local");
    process.exit(1);
  }

  const writerBackend =
    env.JEV_WRITER_BACKEND?.trim() || env.WRITER_BACKEND?.trim() || "";
  if (writerBackend) {
    env.WRITER_BACKEND = writerBackend;
  } else if (env.ANTHROPIC_API_KEY?.trim()) {
    env.WRITER_BACKEND = "api";
  }

  if (env.WRITER_BACKEND !== "api" && !env.ANTHROPIC_API_KEY?.trim()) {
    console.warn(
      "No ANTHROPIC_API_KEY in .env.local — JEV will try the Claude Code `claude` CLI.",
    );
    console.warn(
      "For Cursor-only workflow add ANTHROPIC_API_KEY and WRITER_BACKEND=api (see docs/JEV_CURSOR_APPLY.md).",
    );
  }

  env.OPENROUTER_SITE_NAME = env.OPENROUTER_SITE_NAME ?? "stackwise-jev";
  return env;
}

export function runJevCli(jevHome, jevArgs) {
  const child = spawnSync("npx", ["jev", ...jevArgs], {
    cwd: jevHome,
    env: jevChildEnv(),
    stdio: "inherit",
  });
  return child.status ?? 1;
}
