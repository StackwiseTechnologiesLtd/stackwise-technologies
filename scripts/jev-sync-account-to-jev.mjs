#!/usr/bin/env node
/**
 * Copy one Stackwise employer account into JEV's accounts.json (for `npx jev apply` + Chrome later).
 *
 *   npm run growth:jev:accounts:sync-jev -- workday:petronascanada
 *
 * Writes password to JEV Keychain (service jev-job-search) per JEV conventions.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { getAccount } from "./lib/jev-employer-accounts.mjs";

const jevHome =
  process.env.JEV_HOME?.trim() || path.join(os.homedir(), "jev-job-search");
const id = process.argv[2]?.trim();

if (!id) {
  console.error("Usage: node scripts/jev-sync-account-to-jev.mjs <account-id>");
  process.exit(1);
}

const acct = getAccount(id);
if (!acct?.password) {
  console.error("Account not found or missing Keychain password:", id);
  process.exit(1);
}

let tenant = id;
if (id.includes(":")) {
  [, tenant] = id.split(":", 2);
}

let origin = "";
try {
  origin = acct.signInUrl ? new URL(acct.signInUrl).origin : "";
} catch {
  /* empty */
}
if (!origin) {
  console.error("Account needs --url with a valid sign-in page when saving.");
  process.exit(1);
}

const accountsPath = path.join(jevHome, "data", "accounts.json");
let data = { accounts: [] };
if (fs.existsSync(accountsPath)) {
  data = JSON.parse(fs.readFileSync(accountsPath, "utf8"));
}
if (!Array.isArray(data.accounts)) data.accounts = [];

const jevId = `workday:${tenant}`;
const passwordItem = `account:${jevId}`;
data.accounts = data.accounts.filter((a) => a.id !== jevId);
data.accounts.push({
  id: jevId,
  provider: "workday",
  tenant,
  allowedOrigins: [origin],
  email: acct.email,
  secret: { keychain: passwordItem },
  mode: "existing_only",
  emailVerification: false,
  approvedAgreements: [],
});
fs.mkdirSync(path.dirname(accountsPath), { recursive: true });
fs.writeFileSync(accountsPath, `${JSON.stringify(data, null, 2)}\n`);

const quoted = `"${acct.password.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const r = spawnSync(
  "/usr/bin/security",
  ["-i"],
  {
    encoding: "utf8",
    input: `add-generic-password -U -s "jev-job-search" -a "${passwordItem}" -w ${quoted}\n`,
  },
);

if (r.status !== 0) {
  console.error("Updated accounts.json but JEV Keychain write failed:", r.stderr);
  process.exit(1);
}

console.log("Synced", id, "→", accountsPath, "(", jevId, ")");
console.log("Run `npx jev accounts list` in JEV_HOME to verify.");
