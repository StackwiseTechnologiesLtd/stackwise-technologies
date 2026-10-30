#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const firecrawlDir = path.join(process.cwd(), "vendor/firecrawl");
if (!fs.existsSync(path.join(firecrawlDir, "docker-compose.yaml"))) {
  console.error("Nothing to stop — run integrations:firecrawl:clone first.");
  process.exit(1);
}
spawnSync("docker", ["compose", "down"], { stdio: "inherit", cwd: firecrawlDir });
