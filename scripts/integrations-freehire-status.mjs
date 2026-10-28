#!/usr/bin/env node
/**
 * Health check for local freehire (Docker API + optional dev UI).
 */
import { spawnSync } from "node:child_process";

const api = process.env.FREEHIRE_API_BASE ?? "http://localhost:8088";
const ui = process.env.FREEHIRE_UI_BASE ?? "http://localhost:8090";

async function probe(label, url) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    const ok = res.status >= 200 && res.status < 500;
    console.log(`${label}: ${ok ? "OK" : "FAIL"} (${res.status}) ${url}`);
    if (url.includes("/health") && ok) {
      const j = await res.json();
      console.log("  ", JSON.stringify(j));
    }
    return ok;
  } catch (e) {
    console.log(`${label}: DOWN ${url}`, e instanceof Error ? e.message : e);
    return false;
  }
}

console.log("Docker:");
spawnSync("docker", ["ps", "--filter", "name=freehire", "--format", "  {{.Names}}\t{{.Status}}"], {
  stdio: "inherit",
});

const apiOk = await probe("API", `${api.replace(/\/$/, "")}/health`);
const uiOk = await probe("UI", ui);

process.exit(apiOk ? 0 : 1);
