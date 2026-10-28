#!/usr/bin/env node
/**
 * Re-apply Stackwise freehire dev patches after clone/pull.
 * Copies tracked patch files into vendor/freehire.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const vendor = path.join(root, "vendor/freehire");
const patches = path.join(root, "deploy/integrations/freehire/patches");

const copies = [
  ["dev_auth.go", "internal/api/handler/dev_auth.go"],
];

if (!fs.existsSync(path.join(vendor, "docker-compose.yml"))) {
  console.error("Missing vendor/freehire — run npm run integrations:freehire:clone");
  process.exit(1);
}

for (const [from, to] of copies) {
  const src = path.join(patches, from);
  const dest = path.join(vendor, to);
  if (!fs.existsSync(src)) {
    console.error("Missing patch", src);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("Applied", to);
}

const authGo = path.join(vendor, "internal/api/handler/auth.go");
const authText = fs.readFileSync(authGo, "utf8");
if (!authText.includes("DevLogin")) {
  const needle = '\tauthGroup.Post("/login", loginLimiter, h.Login)\n';
  const insert =
    '\tauthGroup.Post("/login", loginLimiter, h.Login)\n\tauthGroup.Post("/dev-login", h.DevLogin)\n';
  if (!authText.includes(needle)) {
    console.error("Could not patch auth.go — upstream changed; add dev-login route manually");
    process.exit(1);
  }
  fs.writeFileSync(authGo, authText.replace(needle, insert));
  console.log("Patched auth.go (dev-login route)");
} else {
  console.log("auth.go already has dev-login route");
}

console.log("\nRebuild API: npm run integrations:freehire:up (or docker compose build app)");
console.log("UI dev: PUBLIC_FREEHIRE_DEV_AUTH=1 npm run integrations:freehire:ui");
