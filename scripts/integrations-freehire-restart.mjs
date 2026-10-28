#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
spawnSync("node", ["scripts/integrations-freehire-down.mjs"], { stdio: "inherit", cwd: root });
spawnSync("node", ["scripts/integrations-freehire-up.mjs"], { stdio: "inherit", cwd: root });
