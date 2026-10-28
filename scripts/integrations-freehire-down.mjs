#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const freehireDir = path.join(process.cwd(), "vendor/freehire");
const composeEnv = path.join(
  process.cwd(),
  "deploy/integrations/freehire/compose.env",
);

if (!fs.existsSync(path.join(freehireDir, "docker-compose.yml"))) {
  console.error("Nothing to stop — vendor/freehire missing.");
  process.exit(1);
}

const r = spawnSync(
  "docker",
  ["compose", "--env-file", composeEnv, "down"],
  { stdio: "inherit", cwd: freehireDir },
);
process.exit(r.status ?? 0);
