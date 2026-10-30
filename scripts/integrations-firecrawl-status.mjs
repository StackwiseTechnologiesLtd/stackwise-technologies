#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const firecrawlDir = path.join(process.cwd(), "vendor/firecrawl");
const base = (process.env.FIRECRAWL_API_BASE ?? "http://localhost:3002").replace(/\/$/, "");

console.log("Docker:");
if (fs.existsSync(path.join(firecrawlDir, "docker-compose.yaml"))) {
  spawnSync("docker", ["compose", "ps"], { stdio: "inherit", cwd: firecrawlDir });
} else {
  console.log("  vendor/firecrawl not cloned");
}

try {
  const res = await fetch(`${base}/v0/health/readiness`, { signal: AbortSignal.timeout(5000) });
  console.log(`API: ${res.ok ? "OK" : res.status} ${base}/v0/health/readiness`);
  if (res.ok) console.log("   ", await res.text());
} catch (error) {
  console.log(`API: DOWN ${base} (${error instanceof Error ? error.message : "fetch failed"})`);
}
