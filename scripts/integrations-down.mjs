#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";

const composeFile = path.join(
  process.cwd(),
  "deploy/integrations/docker-compose.yml",
);

spawnSync(
  "docker",
  ["compose", "-f", composeFile, "down"],
  { stdio: "inherit" },
);
